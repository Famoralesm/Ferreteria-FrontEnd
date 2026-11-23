import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Order } from '../../../../core/models/order/order';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetail implements OnInit {
  order: Order | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly orderService: OrderService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'El identificador del pedido no es válido.';
      this.loading = false;
      return;
    }

    this.orderService.findById(id).subscribe({
      next: order => {
        this.order = order;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error cargando detalle del pedido:', error);
        this.errorMessage = error?.error?.message ?? 'No fue posible cargar el detalle del pedido.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  back(): void {
    this.location.back();
  }

  edit(): void {
    if (this.order) this.router.navigate(['/orders/edit', this.order.id]);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      CREATED: 'Creado', PREPARING: 'En preparación', IN_ROUTE: 'En ruta',
      DELIVERED: 'Entregado', CANCELED: 'Cancelado', REJECTED: 'Rechazado'
    };
    return labels[status] ?? status;
  }

  trackByItem(index: number, item: { id?: number }): number {
    return item.id ?? index;
  }
}