import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Product } from '../../../../core/models/product/product';
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
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule],
  templateUrl: './product-units.html',
  styleUrl: './product-units.scss'
})
export class ProductUnits implements OnInit {
  products: Product[] = [];
  selectedProduct: Product | null = null;
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
  selectedBaseUnitId: number | null = null;
  savingBaseUnit = false;

  constructor(
    private productService: ProductService,
    private productUnitService: ProductUnitService,
    private unitOfMeasureService: UnitOfMeasureService,
    private storeService: StoreService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMeasureUnits();
    const storeId = this.storeService.selectedStoreId;
    if (storeId === null) {
      this.notificationService.warning('Selecciona una sucursal para administrar las presentaciones.');
      return;
    }
    this.productService.findAll(storeId).subscribe({
      next: products => this.products = products,
      error: err => {
        console.error('Error cargando productos:', err);
        this.notificationService.error('No fue posible cargar los productos.');
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
    operation.subscribe({
      next: () => {
        this.measureSaving = false;
        this.notificationService.success(this.measureEditingId === null ? 'Unidad de medida creada.' : 'Unidad de medida actualizada.');
        this.resetMeasureForm();
        this.loadMeasureUnits();
      },
      error: err => {
        this.measureSaving = false;
        console.error('Error guardando unidad de medida:', err);
        this.notificationService.error(err?.error?.message ?? 'No fue posible guardar la unidad de medida.');
      }
    });
  }

  editMeasureUnit(unit: UnitOfMeasure): void {
    this.measureEditingId = unit.id;
    this.measureForm = { code: unit.code, name: unit.name, symbol: unit.symbol };
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

  onProductChange(product: Product | null): void {
    this.selectedProduct = product;
    this.selectedBaseUnitId = product?.baseUnitId ?? null;
    this.units = [];
    this.resetForm();
    if (!product) return;
    this.loading = true;
    this.productUnitService.findByProduct(product.id).subscribe({
      next: units => { this.units = units; this.loading = false; },
      error: err => {
        console.error('Error cargando presentaciones:', err);
        this.loading = false;
        this.notificationService.error('No fue posible cargar las presentaciones del producto.');
      }
    });
  }

  saveBaseUnit(): void {
    if (!this.selectedProduct || this.selectedBaseUnitId === null) {
      this.notificationService.warning('Selecciona una unidad base.');
      return;
    }
    this.savingBaseUnit = true;
    this.productService.setBaseUnit(this.selectedProduct.id, this.selectedBaseUnitId).subscribe({
      next: updated => {
        this.selectedProduct = updated;
        this.products = this.products.map(item => item.id === updated.id ? updated : item);
        this.savingBaseUnit = false;
        this.notificationService.success('Unidad base actualizada.');
      },
      error: err => {
        this.savingBaseUnit = false;
        console.error('Error asignando unidad base:', err);
        this.notificationService.error(err?.error?.message ?? 'No fue posible asignar la unidad base.');
      }
    });
  }

  get activeMeasureUnits(): UnitOfMeasure[] {
    return this.measureUnits.filter(unit => unit.active);
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
      purchaseAllowed: this.form.purchaseAllowed,
      saleAllowed: this.form.saleAllowed
    };
    if (!request.code || !request.name || !Number.isFinite(request.conversionFactor) || request.conversionFactor <= 0) {
      this.notificationService.warning('Completa código, nombre y un factor de conversión mayor que cero.');
      return;
    }
    this.saving = true;
    const operation = this.editingId === null
      ? this.productUnitService.create(this.selectedProduct.id, request)
      : this.productUnitService.update(this.selectedProduct.id, this.editingId, request);
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.notificationService.success(this.editingId === null ? 'Presentación creada.' : 'Presentación actualizada.');
        this.onProductChange(this.selectedProduct);
      },
      error: err => {
        this.saving = false;
        console.error('Error guardando presentación:', err);
        this.notificationService.error(err?.error?.message ?? 'No fue posible guardar la presentación.');
      }
    });
  }

  edit(unit: ProductUnit): void {
    this.editingId = unit.id;
    this.form = { code: unit.code, name: unit.name, conversionFactor: unit.conversionFactor,
      purchaseAllowed: unit.purchaseAllowed, saleAllowed: unit.saleAllowed };
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
    return { code: '', name: '', conversionFactor: 1, purchaseAllowed: true, saleAllowed: true };
  }
  private emptyMeasureForm(): UnitOfMeasureRequest { return { code: '', name: '', symbol: '' }; }
}