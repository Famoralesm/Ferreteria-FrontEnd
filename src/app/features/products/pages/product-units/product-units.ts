import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, filter, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Product } from '../../../../core/models/product/product';
import { Store } from '../../../../core/models/store/store';
import { ProductUnit, ProductUnitRequest } from '../../../../core/models/product/product-unit';
import { UnitOfMeasure, UnitOfMeasureRequest } from '../../../../core/models/product/unit-of-measure';
import { ProductService } from '../../../../core/services/product.service';
import { ProductUnitService } from '../../../../core/services/product-unit.service';
import { UnitOfMeasureService } from '../../../../core/services/unit-of-measure.service';
import { StoreService } from '../../../../core/services/store.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-product-units',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, InputTextModule],
  templateUrl: './product-units.html',
  styleUrl: './product-units.scss'
})
export class ProductUnits implements OnInit, OnDestroy {
  activeTab = 'catalog';
  products: Product[] = [];
  productsLoading = false;
  private readonly destroy$ = new Subject<void>();
  selectedProduct: Product | null = null;
  changingBaseUnit = false;
  units: ProductUnit[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;
  form: ProductUnitRequest = this.emptyForm();

  measureUnits: UnitOfMeasure[] = [];
  measureLoading = false;
  measureSaving = false;
  measureEditingId: number | null = null;
  measureForm: UnitOfMeasureRequest = this.emptyMeasureForm();
  measurePage = 0;
  readonly measurePageSize = 4;
  presentationPage = 0;
  readonly presentationPageSize = 4;
  private pendingProductId: number | null = null;

  get paginatedPresentations(): ProductUnit[] {
    const start = this.presentationPage * this.presentationPageSize;
    return this.units.slice(start, start + this.presentationPageSize);
  }

  get presentationPageCount(): number {
    return Math.ceil(this.units.length / this.presentationPageSize);
  }

  changePresentationPage(page: number): void {
    if (page < 0 || page >= this.presentationPageCount) return;
    this.presentationPage = page;
  }

  get isEditingBaseUnit(): boolean {
    return this.editingId !== null
      && !!this.units.find(unit => unit.id === this.editingId)
      && this.isBasePresentation(this.units.find(unit => unit.id === this.editingId)!);
  }

  get activeMeasureUnits(): UnitOfMeasure[] {
    return this.measureUnits.filter(unit => unit.active);
  }

  get configuredBaseUnits(): UnitOfMeasure[] {
    const configuredCodes = new Set(
      this.units.filter(unit => unit.active).map(unit => unit.code)
    );
    return this.measureUnits.filter(unit => unit.active && configuredCodes.has(unit.code));
  }

  get paginatedMeasureUnits(): UnitOfMeasure[] {
    const start = this.measurePage * this.measurePageSize;
    return this.measureUnits.slice(start, start + this.measurePageSize);
  }

  get measurePageCount(): number {
    return Math.ceil(this.measureUnits.length / this.measurePageSize);
  }

  constructor(
    private productService: ProductService,
    private productUnitService: ProductUnitService,
    private unitOfMeasureService: UnitOfMeasureService,
    private storeService: StoreService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const productId = Number(params.get('productId'));
      if (Number.isInteger(productId) && productId > 0) {
        this.pendingProductId = productId;
        this.activeTab = 'presentations';
        this.selectPendingProduct();
      }
    });
    this.loadMeasureUnits();
    this.storeService.selectedStore$
      .pipe(
        filter((store): store is Store => store !== null),
        takeUntil(this.destroy$)
      )
      .subscribe(store => this.loadProducts(store.id));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProducts(storeId: number): void {
    this.productsLoading = true;
    this.productService.findAll(storeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: products => {
          this.products = products ?? [];
          this.productsLoading = false;
          this.selectPendingProduct();
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Error cargando productos de la sucursal:', err);
          this.products = [];
          this.productsLoading = false;
          this.cdr.detectChanges();
          this.notificationService.error('No fue posible cargar los productos de la sucursal seleccionada.');
        }
      });
  }

  loadMeasureUnits(): void {
    this.measureLoading = true;
    this.unitOfMeasureService.findAll().subscribe({
      next: units => { this.measureUnits = units; this.measureLoading = false; },
      error: err => {
        console.error('Error cargando unidades de medida:', err);
        this.measureLoading = false;
        this.notificationService.error('No fue posible cargar el catálogo de unidades.');
      }
    });
  }

  saveMeasureUnit(): void {
    const request: UnitOfMeasureRequest = {
      code: this.measureForm.code.trim().toUpperCase(),
      name: this.measureForm.name.trim(),
      symbol: this.measureForm.symbol.trim()
    };
    if (!request.code || !request.name || !request.symbol) {
      this.notificationService.warning('Completa código, nombre y símbolo.');
      return;
    }
    this.measureSaving = true;
    const operation = this.measureEditingId === null
      ? this.unitOfMeasureService.create(request)
      : this.unitOfMeasureService.update(this.measureEditingId, request);
    const wasCreating = this.measureEditingId === null;
    operation.subscribe({
      next: saved => {
        setTimeout(() => {
          this.measureSaving = false;
          this.measureUnits = [...this.measureUnits.filter(unit => unit.id !== saved.id), saved]
            .sort((a, b) => a.name.localeCompare(b.name, 'es'));
          this.resetMeasureForm();
          this.measurePage = 0;
          this.cdr.detectChanges();
          this.notificationService.success(wasCreating ? 'Unidad de medida creada.' : 'Unidad de medida actualizada.');
        });
      },
      error: err => {
        setTimeout(() => {
          this.measureSaving = false;
          this.cdr.detectChanges();
          console.error('Error guardando unidad de medida:', err);
          this.notificationService.error(err?.error?.message ?? 'No fue posible guardar la unidad de medida.');
        });
      }
    });
  }

  changeMeasurePage(page: number): void {
    if (page < 0 || page >= this.measurePageCount) return;
    this.measurePage = page;
  }

  onPresentationCodeChange(code: string | null): void {
    if (!code) return;
    const selectedUnit = this.activeMeasureUnits.find(unit => unit.code === code);
    if (selectedUnit) this.form.name = selectedUnit.name;
  }

  editMeasureUnit(unit: UnitOfMeasure): void {
    this.measureEditingId = unit.id;
    this.measureForm = { code: unit.code, name: unit.name, symbol: unit.symbol };
  }

  deleteMeasureUnit(unit: UnitOfMeasure): void {
    if (!confirm(`¿Eliminar definitivamente la unidad "${unit.name}"? Esta acción no se puede deshacer.`)) return;
    this.unitOfMeasureService.delete(unit.id).subscribe({
      next: () => {
        this.measureUnits = this.measureUnits.filter(item => item.id !== unit.id);
        if (this.measureEditingId === unit.id) this.resetMeasureForm();
        this.measurePage = Math.min(this.measurePage, Math.max(0, this.measurePageCount - 1));
        this.notificationService.success('Unidad de medida eliminada.');
      },
      error: err => {
        console.error('Error eliminando unidad de medida:', err);
        this.notificationService.error(err?.error?.message ?? 'No fue posible eliminar la unidad de medida.');
      }
    });
  }

  toggleMeasureUnit(unit: UnitOfMeasure): void {
    const action = unit.active ? 'desactivar' : 'activar';
    if (!confirm(`¿Deseas ${action} la unidad "${unit.name}"?`)) return;
    this.unitOfMeasureService.setActive(unit.id, !unit.active).subscribe({
      next: updated => {
        unit.active = updated.active;
        this.notificationService.success(`Unidad de medida ${unit.active ? 'activada' : 'desactivada'}.`);
      },
      error: err => {
        console.error('Error cambiando estado de unidad:', err);
        this.notificationService.error(err?.error?.message ?? 'No fue posible cambiar el estado de la unidad.');
      }
    });
  }

  resetMeasureForm(): void {
    this.measureEditingId = null;
    this.measureForm = this.emptyMeasureForm();
  }

  beginBaseUnitChange(): void {
    if (!this.selectedProduct?.baseUnitId) return;
    this.changingBaseUnit = true;
  }

  cancelBaseUnitChange(): void {
    this.changingBaseUnit = false;
  }

  onBaseUnitChange(unitOfMeasureId: number | null): void {
    if (!this.selectedProduct || !unitOfMeasureId) return;
    if (this.selectedProduct.baseUnitId === unitOfMeasureId) {
      this.changingBaseUnit = false;
      return;
    }
    const productId = this.selectedProduct.id;
    const preserveExistingValues = !!this.selectedProduct.baseUnitId;
    if (preserveExistingValues && !window.confirm(
      'Vas a corregir la unidad base. Se conservarán exactamente los valores numéricos actuales de stock, stock mínimo, precios, umbral mayorista y factores de presentación. Solo continúa si esos valores YA están expresados en la nueva unidad. Las cantidades e importes históricos no se recalcularán; solo se actualizará la etiqueta de las líneas históricas vendidas en unidad base. ¿Deseas continuar?'
    )) {
      this.changingBaseUnit = false;
      return;
    }
    this.productService.setBaseUnit(productId, unitOfMeasureId, preserveExistingValues).subscribe({
      next: saved => {
        // La respuesta cambia las ramas @if del selector de unidad base.
        // Diferimos la actualización para no modificar la vista durante el mismo
        // ciclo de detección iniciado por PrimeNG.
        setTimeout(() => {
          if (this.selectedProduct?.id !== productId) return;
          this.selectedProduct = { ...this.selectedProduct, ...saved };
          this.products = this.products.map(product => product.id === saved.id ? { ...product, ...saved } : product);
          this.changingBaseUnit = false;
          this.notificationService.success(`Unidad base ${preserveExistingValues ? 'corregida' : 'definida'}: ${saved.baseUnitName} (${saved.baseUnitSymbol}).`);
          this.loadProductUnits(productId);
          this.cdr.detectChanges();
        });
      },
      error: err => {
        setTimeout(() => {
          console.error('Error asignando unidad base:', err);
          this.changingBaseUnit = false;
          this.notificationService.error(err?.error?.message ?? 'No fue posible definir la unidad base.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  isBasePresentation(unit: ProductUnit): boolean {
    return !!this.selectedProduct?.baseUnitCode && unit.code === this.selectedProduct.baseUnitCode;
  }

  onProductChange(product: Product | null): void {
    // PrimeNG puede actualizar su índice interno de opción durante el mismo ciclo
    // de detección. Diferimos el cambio de estado para evitar NG0100.
    this.loading = !!product;
    setTimeout(() => {
      this.selectedProduct = product;
      this.changingBaseUnit = false;
      this.units = [];
      this.resetForm();
      if (!product) {
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }
      this.loadProductUnits(product.id);
      this.cdr.detectChanges();
    });
  }

  private selectPendingProduct(): void {
    if (!this.pendingProductId || this.products.length === 0) return;
    const product = this.products.find(item => item.id === this.pendingProductId);
    if (!product) return;
    this.pendingProductId = null;
    this.selectedProduct = product;
    this.activeTab = 'presentations';
    this.onProductChange(product);
  }

  private loadProductUnits(productId: number): void {
    this.loading = true;
    this.productUnitService.findByProduct(productId).subscribe({
      next: units => {
        setTimeout(() => {
          if (this.selectedProduct?.id !== productId) return;
          this.units = units ?? [];
          this.presentationPage = 0;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {
        setTimeout(() => {
          if (this.selectedProduct?.id !== productId) return;
          this.loading = false;
          this.cdr.detectChanges();
          console.error('Error cargando presentaciones:', err);
          this.notificationService.error('No fue posible cargar las presentaciones del producto.');
        });
      }
    });
  }

  deletePresentation(unit: ProductUnit): void {
    if (!this.selectedProduct) return;
    if (!confirm(`¿Eliminar definitivamente la presentación "${unit.name}"? Esta acción no se puede deshacer.`)) return;
    const productId = this.selectedProduct.id;
    this.productUnitService.delete(productId, unit.id).subscribe({
      next: () => {
        this.units = this.units.filter(item => item.id !== unit.id);
        if (this.editingId === unit.id) this.resetForm();
        this.presentationPage = Math.min(this.presentationPage, Math.max(0, this.presentationPageCount - 1));
        this.notificationService.success('Presentación eliminada.');
      },
      error: err => {
        console.error('Error eliminando presentación:', err);
        this.notificationService.error(err?.error?.message ?? 'No fue posible eliminar la presentación.');
      }
    });
  }

  save(): void {
    if (!this.selectedProduct) {
      this.notificationService.warning('Selecciona un producto.');
      return;
    }
    const request: ProductUnitRequest = {
      code: this.form.code.trim().toUpperCase(),
      name: this.form.name.trim(),
      conversionFactor: Number(this.form.conversionFactor),
      minimumSaleQuantity: Number(this.form.minimumSaleQuantity),
      saleQuantityIncrement: Number(this.form.saleQuantityIncrement),
      purchaseAllowed: this.form.purchaseAllowed,
      saleAllowed: this.form.saleAllowed
    };
    if (!request.code || !request.name
        || !Number.isFinite(request.conversionFactor) || request.conversionFactor <= 0
        || !Number.isFinite(request.minimumSaleQuantity) || request.minimumSaleQuantity <= 0
        || !Number.isFinite(request.saleQuantityIncrement) || request.saleQuantityIncrement <= 0) {
      this.notificationService.warning('Completa código, nombre, factor, mínimo e incremento con valores mayores que cero.');
      return;
    }
    const productId = this.selectedProduct.id;
    const editingId = this.editingId;
    this.saving = true;
    const operation = editingId === null
      ? this.productUnitService.create(productId, request)
      : this.productUnitService.update(productId, editingId, request);
    operation.subscribe({
      next: () => {
        setTimeout(() => {
          this.saving = false;
          this.resetForm();
          this.cdr.detectChanges();
          this.notificationService.success(editingId === null ? 'Presentación creada.' : 'Presentación actualizada.');
          this.loadProductUnits(productId);
        });
      },
      error: err => {
        setTimeout(() => {
          this.saving = false;
          this.cdr.detectChanges();
          console.error('Error guardando presentación:', err);
          this.notificationService.error(err?.error?.message ?? 'No fue posible guardar la presentación.');
        });
      }
    });
  }

  edit(unit: ProductUnit): void {
    this.editingId = unit.id;
    this.form = {
      code: unit.code,
      name: unit.name,
      conversionFactor: unit.conversionFactor,
      minimumSaleQuantity: unit.minimumSaleQuantity ?? 1,
      saleQuantityIncrement: unit.saleQuantityIncrement ?? 1,
      purchaseAllowed: unit.purchaseAllowed,
      saleAllowed: unit.saleAllowed
    };
  }

  toggleActive(unit: ProductUnit): void {
    if (!this.selectedProduct) return;
    const action = unit.active ? 'desactivar' : 'activar';
    if (!confirm(`¿Deseas ${action} la presentación "${unit.name}"?`)) return;
    this.productUnitService.setActive(this.selectedProduct.id, unit.id, !unit.active).subscribe({
      next: () => {
        unit.active = !unit.active;
        this.notificationService.success(`Presentación ${unit.active ? 'activada' : 'desactivada'}.`);
      },
      error: err => {
        console.error('Error cambiando estado de presentación:', err);
        this.notificationService.error('No fue posible cambiar el estado de la presentación.');
      }
    });
  }

  resetForm(): void { this.editingId = null; this.form = this.emptyForm(); }
  private emptyForm(): ProductUnitRequest {
    return {
      code: '', name: '', conversionFactor: 1,
      minimumSaleQuantity: 1, saleQuantityIncrement: 1,
      purchaseAllowed: true, saleAllowed: true
    };
  }
  private emptyMeasureForm(): UnitOfMeasureRequest { return { code: '', name: '', symbol: '' }; }
}