import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, asyncScheduler, filter, observeOn, switchMap, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ProductStock } from '../../../../core/models/inventory/product-stock';
import { Product } from '../../../../core/models/product/product';
import { ProductService } from '../../../../core/services/product.service';
import { InventoryMovement } from '../../../../core/models/inventory/inventory-movement';
import { Store } from '../../../../core/models/store/store';
import { InventoryService } from '../../../../core/services/inventory.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { StoreService } from '../../../../core/services/store.service';

type InitialStockRow = ProductStock & { stockInicialDraft: number; stockMinimoDraft: number; };

@Component({
  selector: 'app-initial-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, InputTextModule, SelectModule, TableModule],
  templateUrl: './initial-stock.html',
  styleUrl: './initial-stock.scss'
})
export class InitialStock implements OnInit, OnDestroy {
  selectedStore: Store | null = null;
  activeTab: 'initial' | 'movements' = 'initial';
  rows: InitialStockRow[] = [];
  historyProducts: Product[] = [];
  loading = false;
  searchTerm = '';
  movementProductId: number | null = null;
  movementType: 'ENTRY' | 'ADJUSTMENT' = 'ENTRY';
  movementQuantity: number | null = null;
  movementReason = '';
  savingMovement = false;
  movementHistory: InventoryMovement[] = [];
  loadingHistory = false;
  private readonly savingIds = new Set<number>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly storeService: StoreService, private readonly inventoryService: InventoryService,
    private readonly productService: ProductService, private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.storeService.selectedStore$.pipe(
      observeOn(asyncScheduler),
      filter((store): store is Store => store !== null),
      switchMap(store => {
        this.selectedStore = store;
        this.loading = true;
        this.rows = [];
        this.historyProducts = [];
        this.loadHistoryProducts(store.id);
        this.movementHistory = [];
        this.movementProductId = null;
        return this.inventoryService.getStocks(store.id);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: stocks => {
        this.rows = (stocks ?? []).map(stock => ({ ...stock, stockInicialDraft: Number(stock.stock ?? 0), stockMinimoDraft: Number(stock.stockMinimo ?? 0) }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => { console.error('Error cargando existencias:', error); this.loading = false; this.notificationService.error('No fue posible cargar las existencias de la sucursal.'); this.cdr.markForCheck(); }
    });
  }

  private loadHistoryProducts(storeId: number): void {
    this.productService.findAll(storeId).subscribe({
      next: products => { this.historyProducts = products ?? []; this.cdr.markForCheck(); },
      error: error => { console.error('Error cargando productos para historial:', error); this.notificationService.error('No fue posible cargar los productos para consultar el historial.'); }
    });
  }

  get selectedMovementProduct(): Product | undefined {
    return this.historyProducts.find(product => product.id === this.movementProductId);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get filteredRows(): InitialStockRow[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('es-CL');
    if (!query) return this.rows;
    return this.rows.filter(row => row.sku.toLocaleLowerCase('es-CL').includes(query) || row.nombreProducto.toLocaleLowerCase('es-CL').includes(query) || (row.marca ?? '').toLocaleLowerCase('es-CL').includes(query));
  }

  isSaving(row: InitialStockRow): boolean { return this.savingIds.has(row.productoId); }

  onMovementProductChange(productId: number | null): void {
    this.movementProductId = productId;
    this.movementHistory = [];
    if (!productId || !this.selectedStore) return;
    this.loadingHistory = true;
    this.inventoryService.getProductMovements(productId, this.selectedStore.id).subscribe({
      next: movements => { this.movementHistory = movements ?? []; this.loadingHistory = false; this.cdr.markForCheck(); },
      error: error => { console.error('Error cargando historial de movimientos:', error); this.loadingHistory = false; this.notificationService.error('No fue posible cargar el historial del producto.'); this.cdr.markForCheck(); }
    });
  }

  movementLabel(movement: InventoryMovement): string {
    if (movement.tipoReferencia === 'PURCHASE') return 'Recepción de compra';
    const labels: Record<string, string> = { INITIAL: 'Inventario inicial', ENTRY: 'Ingreso manual', EXIT: 'Salida', RETURN: 'Devolución', ADJUSTMENT: 'Ajuste' };
    return labels[movement.tipoMovimiento] ?? movement.tipoMovimiento;
  }

  movementDifference(movement: InventoryMovement): number {
    return Number(movement.stockNuevo) - Number(movement.stockAnterior);
  }

  saveInitialStock(row: InitialStockRow): void {
    if (!this.selectedStore || this.isSaving(row)) return;
    if (row.stockInicialDraft == null || row.stockInicialDraft < 0 || row.stockMinimoDraft == null || row.stockMinimoDraft < 0) {
      this.notificationService.error('Stock inicial y stock mínimo deben ser valores iguales o mayores que cero.'); return;
    }
    this.savingIds.add(row.productoId);
    this.inventoryService.initializeStock({ productoId: row.productoId, sucursalId: this.selectedStore.id, stock: row.stockInicialDraft, stockMinimo: row.stockMinimoDraft, motivo: 'Conteo físico de apertura' }).subscribe({
      next: updated => {
        this.updateRow(updated);
        this.savingIds.delete(row.productoId);
        this.notificationService.success('Inventario inicial registrado para ' + row.nombreProducto + '.');
        if (this.movementProductId === row.productoId) this.onMovementProductChange(row.productoId);
        this.cdr.markForCheck();
      },
      error: error => { this.savingIds.delete(row.productoId); this.notificationService.error(error?.error?.message ?? 'No fue posible registrar el inventario inicial.'); this.cdr.markForCheck(); }
    });
  }

  registerManualMovement(): void {
    if (!this.selectedStore || this.savingMovement) return;
    const productId = Number(this.movementProductId);
    const quantity = Number(this.movementQuantity);
    const reason = this.movementReason.trim();
    if (!productId) { this.notificationService.warning('Debes seleccionar un producto para realizar el movimiento.'); return; }
    if (this.selectedMovementProduct && !this.selectedMovementProduct.active) { this.notificationService.warning('Este producto está inactivo. Puedes consultar su historial, pero debes activarlo para registrar nuevos movimientos.'); return; }
    if (this.movementQuantity == null || !Number.isFinite(quantity)) { this.notificationService.warning('Debes ingresar una cantidad para realizar el movimiento.'); return; }
    if (!reason) { this.notificationService.warning('Debes llenar el campo Motivo / observación para realizar el movimiento.'); return; }
    if (this.movementType === 'ENTRY' && quantity <= 0) {
      this.notificationService.warning('La cantidad del ingreso debe ser mayor que cero.'); return;
    }
    if (this.movementType === 'ADJUSTMENT' && quantity === 0) {
      this.notificationService.warning('La diferencia del ajuste no puede ser cero. Usa un valor positivo o negativo.'); return;
    }
    this.savingMovement = true;
    const request = { productoId: productId, sucursalId: this.selectedStore.id, cantidad: quantity, motivo: reason };
    const operation = this.movementType === 'ENTRY'
      ? this.inventoryService.registerEntry(request)
      : this.inventoryService.registerAdjustment(request);
    operation.subscribe({
      next: movement => {
        this.inventoryService.getStocks(this.selectedStore!.id).subscribe({
          next: stocks => {
            this.rows = (stocks ?? []).map(stock => ({ ...stock, stockInicialDraft: Number(stock.stock ?? 0), stockMinimoDraft: Number(stock.stockMinimo ?? 0) }));
            this.savingMovement = false;
            this.movementQuantity = null;
            this.movementReason = '';
            this.notificationService.success(`Movimiento registrado. Nuevo stock: ${movement.stockNuevo}.`);
            this.onMovementProductChange(productId);
            this.cdr.markForCheck();
          },
          error: () => {
            this.savingMovement = false;
            this.notificationService.warning('El movimiento se registró, pero no fue posible actualizar el listado. Recarga la pantalla para consultar el stock.');
            this.cdr.markForCheck();
          }
        });
      },
      error: error => {
        this.savingMovement = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible registrar el movimiento manual.');
        this.cdr.markForCheck();
      }
    });
  }

  updateMinimumStock(row: InitialStockRow): void {
    if (!this.selectedStore || this.isSaving(row)) return;
    if (row.stockMinimoDraft == null || row.stockMinimoDraft < 0) { this.notificationService.error('El stock mínimo debe ser igual o mayor que cero.'); return; }
    this.savingIds.add(row.productoId);
    this.inventoryService.updateMinimumStock(row.productoId, this.selectedStore.id, row.stockMinimoDraft).subscribe({
      next: updated => { this.updateRow(updated); this.savingIds.delete(row.productoId); this.notificationService.success('Stock mínimo actualizado para ' + row.nombreProducto + '.'); this.cdr.markForCheck(); },
      error: error => { this.savingIds.delete(row.productoId); this.notificationService.error(error?.error?.message ?? 'No fue posible actualizar el stock mínimo.'); this.cdr.markForCheck(); }
    });
  }

  private updateRow(updated: ProductStock): void {
    this.rows = this.rows.map(row => row.productoId === updated.productoId ? { ...row, ...updated, stockInicialDraft: Number(updated.stock ?? 0), stockMinimoDraft: Number(updated.stockMinimo ?? 0) } : row);
  }
}