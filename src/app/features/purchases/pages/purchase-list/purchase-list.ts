import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { Purchase, PurchaseStatus } from '../../../../core/models/purchase/purchase';
import { Store } from '../../../../core/models/store/store';
import { PurchaseService } from '../../../../core/services/purchase.service';
import { StoreService } from '../../../../core/services/store.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, SelectModule],
  templateUrl: './purchase-list.html',
  styleUrl: './purchase-list.scss'
})
export class PurchaseList implements OnInit {
  purchases: Purchase[] = [];
  stores: Store[] = [];
  loading = false;

  supplierFilter: number | null = null;
  storeFilter: number | null = null;
  statusFilter: PurchaseStatus | null = null;
  dateFrom = '';
  dateTo = '';

  readonly statuses = [
    { label: 'Pendiente de recepción', value: 'PENDING_RECEIPT' },
    { label: 'Recibida', value: 'RECEIVED' },
    { label: 'Cancelada', value: 'CANCELED' }
  ];

  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly storeService: StoreService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.storeService.findActive().subscribe({
      next: stores => {
        this.stores = stores ?? [];
        this.loadPurchases();
      },
      error: error => {
        console.error('Error cargando sucursales:', error);
        this.loadPurchases();
      }
    });
  }

  loadPurchases(): void {
    this.loading = true;
    this.purchaseService.findAll().subscribe({
      next: purchases => {
        this.purchases = purchases ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error cargando compras:', error);
        this.loading = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible cargar las compras.');
        this.cdr.detectChanges();
      }
    });
  }

  get supplierOptions(): { label: string; value: number }[] {
    const unique = new Map<number, string>();
    this.purchases.forEach(purchase => unique.set(purchase.supplierId, purchase.supplierName));
    return [...unique.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], 'es'))
      .map(([value, label]) => ({ value, label }));
  }

  get filteredPurchases(): Purchase[] {
    return this.purchases.filter(purchase => {
      if (this.supplierFilter !== null && purchase.supplierId !== this.supplierFilter) return false;
      if (this.storeFilter !== null && purchase.sucursalId !== this.storeFilter) return false;
      if (this.statusFilter !== null && purchase.status !== this.statusFilter) return false;
      if (this.dateFrom && purchase.purchaseDate < this.dateFrom) return false;
      if (this.dateTo && purchase.purchaseDate > this.dateTo) return false;
      return true;
    });
  }

  storeName(storeId: number): string {
    return this.stores.find(store => store.id === storeId)?.nombre ?? \`Sucursal #\${storeId}\`;
  }

  statusLabel(status: PurchaseStatus): string {
    switch (status) {
      case 'PENDING_RECEIPT': return 'Pendiente de recepción';
      case 'RECEIVED': return 'Recibida';
      case 'CANCELED': return 'Cancelada';
    }
  }

  clearFilters(): void {
    this.supplierFilter = null;
    this.storeFilter = null;
    this.statusFilter = null;
    this.dateFrom = '';
    this.dateTo = '';
  }

  openDetail(purchase: Purchase): void {
    this.router.navigate(['/purchases', purchase.id]);
  }

  newPurchase(): void {
    this.router.navigate(['/purchases/new']);
  }

  trackById(_: number, purchase: Purchase): number {
    return purchase.id;
  }
}