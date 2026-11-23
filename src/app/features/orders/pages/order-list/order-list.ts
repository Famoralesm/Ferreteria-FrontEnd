import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { StoreService } from '../../../../core/services/store.service';
import { ButtonModule } from 'primeng/button';
import { OrderTable } from '../../components/order-table/order-table';
import { OrderToolbar } from '../../components/order-toolbar/order-toolbar';
import { OrderService } from '../../../../core/services/order.service';
import { OrderSummary } from '../../../../core/models/order/order-summary';
import { Order } from '../../../../core/models/order/order';

interface StatusThreshold {
  yellow: number;
  orange: number;
  red: number;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, OrderToolbar, OrderTable],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList {
  private readonly searchTerm$ = new BehaviorSubject<string>('');
  readonly filteredOrders$: Observable<OrderSummary[]>;

  private readonly statusThresholds: Record<string, StatusThreshold> = {
    CREATED: { yellow: 24 * 60 * 60 * 1000, orange: 36 * 60 * 60 * 1000, red: 48 * 60 * 60 * 1000 },
    PREPARING: { yellow: 60 * 60 * 1000, orange: 90 * 60 * 1000, red: 120 * 60 * 1000 },
    IN_ROUTE: { yellow: 3 * 60 * 60 * 1000, orange: 4 * 60 * 60 * 1000, red: 5 * 60 * 60 * 1000 }
  };

  constructor(
    private orderService: OrderService,
    private router: Router,
    private storeService: StoreService
  ) {
    const orders$ = this.storeService.selectedStore$.pipe(
      filter(store => store !== null),
      switchMap(store => this.orderService.findAll(store.id).pipe(
        map(data => this.sortByUrgency(data)),
        catchError(err => {
          console.error('Error cargando pedidos:', err);
          return of([] as OrderSummary[]);
        })
      )),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.filteredOrders$ = combineLatest([orders$, this.searchTerm$]).pipe(
      map(([orders, term]) => this.filterOrders(orders, term)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  onSearchChange(term: string): void {
    this.searchTerm$.next(term);
  }

  private filterOrders(orders: OrderSummary[], searchTerm: string): OrderSummary[] {
    const term = this.normalize(searchTerm);
    if (!term) return [...orders];

    return orders.filter(order => {
      const date = new Date(order.fecha);
      const formattedDate = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-CL');
      const fields = [order.id, order.cliente, order.fecha, formattedDate, order.total, order.estado];
      return fields.some(value => this.normalize(value).includes(term));
    });
  }

  private normalize(value: unknown): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private getElapsedMs(order: OrderSummary): number {
    const timestamp = Date.parse(order.statusChangedAt ?? '');
    if (!Number.isFinite(timestamp)) return 0;
    return Math.max(0, Date.now() - timestamp);
  }

  private getUrgencyLevel(order: OrderSummary): number {
    const status = order.estado?.toUpperCase();
    if (status === 'DELIVERED' || status === 'CANCELED' || status === 'REJECTED') return -1;
    const threshold = this.statusThresholds[status];
    if (!threshold) return 0;
    const elapsed = this.getElapsedMs(order);
    if (elapsed >= threshold.red) return 3;
    if (elapsed >= threshold.orange) return 2;
    if (elapsed >= threshold.yellow) return 1;
    return 0;
  }

  private sortByUrgency(orders: OrderSummary[]): OrderSummary[] {
    return [...orders].sort((a, b) => {
      const urgencyDifference = this.getUrgencyLevel(b) - this.getUrgencyLevel(a);
      return urgencyDifference !== 0 ? urgencyDifference : this.getElapsedMs(b) - this.getElapsedMs(a);
    });
  }

  edit(id: number): void {
    this.router.navigate(['/orders/edit', id]);
  }

  view(id: number): void {
    this.router.navigate(['/orders', id]);
  }

  newOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  print(id: number): void {
    // Abrimos la ventana durante el clic para evitar que el navegador bloquee el popup.
    const printWindow = window.open('', '_blank', 'width=460,height=800');
    if (!printWindow) {
      alert('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio.');
      return;
    }

    printWindow.document.write('<!doctype html><html><head><title>Preparando boleta...</title></head><body><p>Preparando boleta...</p></body></html>');
    printWindow.document.close();

    this.orderService.findById(id).subscribe({
      next: order => {
        printWindow.document.open();
        printWindow.document.write(this.buildReceiptHtml(order));
        printWindow.document.close();
        printWindow.focus();
        window.setTimeout(() => printWindow.print(), 300);
      },
      error: error => {
        console.error('No fue posible cargar el pedido para imprimir:', error);
        printWindow.close();
        alert('No fue posible obtener los datos del pedido para imprimir.');
      }
    });
  }

  private buildReceiptHtml(order: Order): string {
    const escape = (value: unknown): string => String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const money = (value: number | null | undefined): string =>
      new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value ?? 0));
    const date = (value?: string): string => {
      if (!value) return 'No informado';
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? escape(value) : parsed.toLocaleString('es-CL');
    };
    const items = (order.items ?? []).map(item => {
      const unit = item.unitName || 'Unidad';
      const quantity = Number(item.quantity ?? 0);
      const factor = Number(item.conversionFactor ?? 1);
      const unitPrice = Number(item.unitPrice ?? 0);
      const total = Number(item.totalPrice ?? quantity * factor * unitPrice);
      return `<tr><td colspan="2" class="product">${escape(item.productName)}</td></tr>
        <tr><td>${quantity} ${escape(unit)} × ${money(unitPrice)}</td><td class="right">${money(total)}</td></tr>`;
    }).join('');

    return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Pedido #${escape(order.id)} - Ferretería FC</title>
<style>
@page{size:80mm auto;margin:4mm}
*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;width:72mm;margin:0 auto;font-size:11px}
h1{font-size:19px;text-align:center;margin:0 0 4px}h2{font-size:13px;text-align:center;margin:2px 0}
p{margin:3px 0}.center{text-align:center}.muted{color:#444}.line{border-top:1px dashed #333;margin:8px 0}
table{width:100%;border-collapse:collapse}td{padding:3px 0;vertical-align:top}.right{text-align:right;white-space:nowrap}
.product{font-weight:bold;padding-top:6px}.total{font-size:15px;font-weight:bold}
.footer{text-align:center;margin-top:14px;font-size:10px}
@media screen{body{margin:12px auto;padding:10px;border:1px solid #ddd}}
</style></head><body>
<h1>FERRETERÍA FC</h1>
<h2>COMPROBANTE DE PEDIDO</h2>
<p class="center">RUT: XX.XXX.XXX-X</p>
<p class="center">Dirección: [Dirección de la empresa]</p>
<p class="center">Teléfono: [Teléfono de contacto]</p>
<div class="line"></div>
<p><b>Pedido:</b> #${escape(order.id)}</p>
<p><b>N° interno:</b> ${escape(order.orderNumber)}</p>
<p><b>Fecha:</b> ${date(order.createdAt)}</p>
<p><b>Estado:</b> ${escape(order.status)}</p>
<div class="line"></div>
<p><b>Cliente:</b> ${escape(order.customerName)}</p>
<p><b>Teléfono:</b> ${escape(order.phone || 'No informado')}</p>
<p><b>Dirección:</b> ${escape(order.address || 'No informado')}</p>
<p><b>Entrega:</b> ${date(order.deliveryDate)}</p>
<div class="line"></div>
<table><tbody>${items}</tbody></table>
<div class="line"></div>
<table><tbody><tr class="total"><td>TOTAL</td><td class="right">${money(order.totalAmount)}</td></tr></tbody></table>
<p><b>Medio de pago:</b> ${escape(order.paymentMethod)}</p>
<p><b>Registrado por:</b> ${escape(order.createdBy?.name || order.createdBy?.email || 'No informado')}</p>
${order.notes ? `<div class="line"></div><p><b>Observaciones:</b> ${escape(order.notes)}</p>` : ''}
<div class="line"></div>
<p class="footer">Gracias por preferir Ferretería FC<br>Documento de uso interno / comprobante de pedido.<br>No reemplaza una boleta tributaria electrónica.</p>
</body></html>`;
  }
}