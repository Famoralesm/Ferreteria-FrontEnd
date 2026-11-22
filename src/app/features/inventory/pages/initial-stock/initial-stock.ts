import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, filter, switchMap, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ProductStock } from '../../../../core/models/inventory/product-stock';
import { Store } from '../../../../core/models/store/store';
import { InventoryService } from '../../../../core/services/inventory.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { StoreService } from '../../../../core/services/store.service';

type InitialStockRow = ProductStock & { stockInicialDraft: number; stockMinimoDraft: number; };

@Component({
  selector: 'app-initial-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, InputTextModule, TableModule],
  templateUrl: './initial-stock.html',
  styleUrl: './initial-stock.scss'
})
export class InitialStock implements OnInit, OnDestroy {
  selectedStore: Store | null = null;
  rows: InitialStockRow[] = [];
  loading = false;
  searchTerm = '';
  private readonly savingIds = new Set<number>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly storeService: StoreService, private readonly inventoryService: InventoryService,
    private readonly notificationService: NotificationService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.storeService.selectedStore$.pipe(
      filter((store): store is Store => store !== null),
      switchMap(store => { this.selectedStore = store; this.loading = true; this.rows = []; return this.inventoryService.getStocks(store.id); }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: stocks => {
        this.rows = (stocks ?? []).map(stock => ({ ...stock, stockInicialDraft: Number(stock.stock ?? 0), stockMinimoDraft: Number(stock.stockMinimo ?? 0) }));
        this.loading = false; this.cdr.detectChanges();
      },
      error: error => { console.error('Error cargando existencias:', error); this.loading = false; this.notificationService.error('No fue posible cargar las existencias de la sucursal.'); this.cdr.detectChanges(); }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get filteredRows(): InitialStockRow[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('es-CL');
    if (!query) return this.rows;
    return this.rows.filter(row => row.sku.toLocaleLowerCase('es-CL').includes(query) || row.nombreProducto.toLocaleLowerCase('es-CL').includes(query) || (row.marca ?? '').toLocaleLowerCase('es-CL').includes(query));
  }

  isSaving(row: InitialStockRow): boolean { return this.savingIds.has(row.productoId); }

  saveInitialStock(row: InitialStockRow): void {
    if (!this.selectedStore || this.isSaving(row)) return;
    if (row.stockInicialDraft == null || row.stockInicialDraft < 0 || row.stockMinimoDraft == null || row.stockMinimoDraft < 0) {
      this.notificationService.error('Stock inicial y stock mínimo deben ser valores iguales o mayores que cero.'); return;
    }
    this.savingIds.add(row.productoId);
    this.inventoryService.initializeStock({ productoId: row.productoId, sucursalId: this.selectedStore.id, stock: row.stockInicialDraft, stockMinimo: row.stockMinimoDraft, motivo: 'Conteo físico de apertura' }).subscribe({
      next: updated => { this.updateRow(updated); this.savingIds.delete(row.productoId); this.notificationService.success('Inventario inicial registrado para ' + row.nombreProducto + '.'); this.cdr.detectChanges(); },
      error: error => { this.savingIds.delete(row.productoId); this.notificationService.error(error?.error?.message ?? 'No fue posible registrar el inventario inicial.'); this.cdr.detectChanges(); }
    });
  }

  updateMinimumStock(row: InitialStockRow): void {
    if (!this.selectedStore || this.isSaving(row)) return;
    if (row.stockMinimoDraft == null || row.stockMinimoDraft < 0) { this.notificationService.error('El stock mínimo debe ser igual o mayor que cero.'); return; }
    this.savingIds.add(row.productoId);
    this.inventoryService.updateMinimumStock(row.productoId, this.selectedStore.id, row.stockMinimoDraft).subscribe({
      next: updated => { this.updateRow(updated); this.savingIds.delete(row.productoId); this.notificationService.success('Stock mínimo actualizado para ' + row.nombreProducto + '.'); this.cdr.detectChanges(); },
      error: error => { this.savingIds.delete(row.productoId); this.notificationService.error(error?.error?.message ?? 'No fue posible actualizar el stock mínimo.'); this.cdr.detectChanges(); }
    });
  }

  private updateRow(updated: ProductStock): void {
    this.rows = this.rows.map(row => row.productoId === updated.productoId ? { ...row, ...updated, stockInicialDraft: Number(updated.stock ?? 0), stockMinimoDraft: Number(updated.stockMinimo ?? 0) } : row);
  }
}