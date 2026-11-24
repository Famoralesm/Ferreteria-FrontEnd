import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Product } from '../../../../core/models/product/product';
import { ProductUnit, ProductUnitRequest } from '../../../../core/models/product/product-unit';
import { ProductService } from '../../../../core/services/product.service';
import { ProductUnitService } from '../../../../core/services/product-unit.service';
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

  constructor(
    private productService: ProductService,
    private productUnitService: ProductUnitService,
    private storeService: StoreService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
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

  onProductChange(product: Product | null): void {
    this.selectedProduct = product;
    this.units = [];
    this.resetForm();
    if (!product) return;
    this.loading = true;
    this.productUnitService.findByProduct(product.id).subscribe({
      next: units => {
        this.units = units;
        this.loading = false;
      },
      error: err => {
        console.error('Error cargando presentaciones:', err);
        this.loading = false;
        this.notificationService.error('No fue posible cargar las presentaciones del producto.');
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
        const message = err?.error?.message ?? 'No fue posible guardar la presentación.';
        this.notificationService.error(message);
      }
    });
  }

  edit(unit: ProductUnit): void {
    this.editingId = unit.id;
    this.form = {
      code: unit.code,
      name: unit.name,
      conversionFactor: unit.conversionFactor,
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

  resetForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  private emptyForm(): ProductUnitRequest {
    return {
      code: '',
      name: '',
      conversionFactor: 1,
      purchaseAllowed: true,
      saleAllowed: true
    };
  }
}
