import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { Purchase, PurchaseStatus } from '../../../../core/models/purchase/purchase';
import { Store } from '../../../../core/models/store/store';
import { PurchaseService } from '../../../../core/services/purchase.service';
import { StoreService } from '../../../../core/services/store.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule],
  templateUrl: './purchase-detail.html',
  styleUrl: './purchase-detail.scss'
})
export class PurchaseDetail implements OnInit {
  purchase: Purchase | null = null;
  stores: Store[] = [];
  loading = true;
  receiving = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly purchaseService: PurchaseService,
    private readonly storeService: StoreService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.storeService.findActive().subscribe({
      next: stores => {
        this.stores = stores ?? [];
        this.cdr.detectChanges();
      },
      error: error => console.error('Error cargando sucursales:', error)
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.notificationService.error('El identificador de la compra no es válido.');
      this.router.navigate(['/purchases']);
      return;
    }
    this.loadPurchase(id);
  }

  loadPurchase(id: number): void {
    this.loading = true;
    this.purchaseService.findById(id).subscribe({
      next: purchase => {
        this.purchase = purchase;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error cargando detalle de compra:', error);
        this.loading = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible cargar el detalle de la compra.');
        this.cdr.detectChanges();
      }
    });
  }

  get storeName(): string {
    if (!this.purchase) return '—';
    return this.stores.find(store => store.id === this.purchase?.sucursalId)?.nombre
      ?? `Sucursal #${this.purchase.sucursalId}`;
  }

  statusLabel(status: PurchaseStatus): string {
    switch (status) {
      case 'PENDING_RECEIPT': return 'Pendiente de recepción';
      case 'RECEIVED': return 'Recibida';
      case 'CANCELED': return 'Cancelada';
    }
    return 'Desconocido';
  }

  receivePurchase(): void {
    if (!this.purchase || this.receiving || this.purchase.status !== 'PENDING_RECEIPT') return;

    const confirmed = confirm(
      `¿Confirmas la recepción de la compra #${this.purchase.id}?\n\nSe ingresarán al stock de ${this.storeName} las cantidades de todos sus productos. Esta operación no se puede repetir.`
    );
    if (!confirmed) return;

    this.receiving = true;
    this.purchaseService.receive(this.purchase.id).subscribe({
      next: purchase => {
        this.purchase = purchase;
        this.receiving = false;
        this.notificationService.success('Compra recibida correctamente. El stock fue actualizado.');
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error recibiendo compra:', error);
        this.receiving = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible recibir la compra.');
        this.cdr.detectChanges();
      }
    });
  }

  back(): void {
    this.router.navigate(['/purchases']);
  }
}