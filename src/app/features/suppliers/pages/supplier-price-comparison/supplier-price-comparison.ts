import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ProductSupplier, ProductSupplierRequest } from '../../../../core/models/supplier/product-supplier';
import { Supplier } from '../../../../core/models/supplier/supplier';
import { Brand } from '../../../../core/models/product/brand';
import { ProductUnit } from '../../../../core/models/product/product-unit';
import { NotificationService } from '../../../../core/services/notification.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ProductService } from '../../../../core/services/product.service';
import { ProductUnitService } from '../../../../core/services/product-unit.service';
import { BrandService } from '../../../../core/services/brand.service';
import { StoreService } from '../../../../core/services/store.service';

@Component({
  selector: 'app-supplier-price-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, SelectModule, TableModule],
  templateUrl: './supplier-price-comparison.html',
  styleUrl: './supplier-price-comparison.scss'
})
export class SupplierPriceComparison implements OnInit {
  productId = 0;
  productName = 'Producto';
  productSku = '';
  baseUnitName = 'unidad base';
  suppliers: Supplier[] = [];
  brands: Brand[] = [];
  purchaseUnits: ProductUnit[] = [];
  comparisons: ProductSupplier[] = [];
  selectedSupplierId: number | null = null;
  selectedBrandId: number | null = null;
  selectedProductUnitId: number | null = null;
  purchasePrice: number | null = null;
  loading = false;
  saving = false;
  loadingOptions = false;
  editingOfferId: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly supplierService: SupplierService,
    private readonly productService: ProductService,
    private readonly productUnitService: ProductUnitService,
    private readonly brandService: BrandService,
    private readonly storeService: StoreService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.productId) {
      this.router.navigate(['/products']);
      return;
    }
    this.loadSuppliers();
    this.loadBrands();
    this.loadProduct();
    this.loadComparisons();
  }

  loadProduct(): void {
    const storeId = this.storeService.selectedStoreId;
    if (storeId === null) return;
    this.productService.findById(this.productId, storeId).subscribe({
      next: product => {
        this.productName = product.name;
        this.productSku = product.sku;
        this.baseUnitName = product.baseUnitName || product.unit || 'unidad base';
        this.selectedBrandId = product.brandId ?? null;
        this.loadPurchaseUnits(product.baseUnitCode);
      },
      error: error => console.error('Error cargando producto comparado:', error)
    });
  }

  loadPurchaseUnits(baseUnitCode?: string | null): void {
    this.loadingOptions = true;
    this.productUnitService.findByProduct(this.productId).subscribe({
      next: units => {
        this.purchaseUnits = (units ?? []).filter(unit => unit.active && unit.purchaseAllowed);
        const baseUnit = this.purchaseUnits.find(unit => unit.code === baseUnitCode && unit.conversionFactor === 1);
        this.selectedProductUnitId = baseUnit?.id ?? this.purchaseUnits[0]?.id ?? null;
        this.loadingOptions = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error cargando presentaciones de compra:', error);
        this.loadingOptions = false;
        this.notificationService.error('No fue posible cargar las presentaciones habilitadas para compra.');
        this.cdr.detectChanges();
      }
    });
  }

  get sortedComparisons(): ProductSupplier[] {
    return [...this.comparisons].sort((a, b) =>
      Number(a.precioUnidadBase ?? a.precioCompra) - Number(b.precioUnidadBase ?? b.precioCompra));
  }

  get availableSuppliers(): Supplier[] {
    // Un proveedor puede ofrecer el mismo producto en varias presentaciones o marcas.
    return this.suppliers.filter(item => item.activo);
  }

  get estimatedBasePrice(): number | null {
    const unit = this.purchaseUnits.find(item => item.id === this.selectedProductUnitId);
    if (this.purchasePrice == null || !unit || unit.conversionFactor <= 0) return null;
    return this.purchasePrice / unit.conversionFactor;
  }

  loadSuppliers(): void {
    this.supplierService.findAll().subscribe({
      next: items => { this.suppliers = items ?? []; this.cdr.detectChanges(); },
      error: error => { console.error('Error cargando proveedores:', error); this.notificationService.error('No fue posible cargar los proveedores.'); }
    });
  }

  loadBrands(): void {
    this.brandService.findAll().subscribe({
      next: items => { this.brands = items ?? []; this.cdr.detectChanges(); },
      error: error => { console.error('Error cargando marcas:', error); this.notificationService.error('No fue posible cargar las marcas.'); }
    });
  }

  loadComparisons(): void {
    this.loading = true;
    this.supplierService.getProductSuppliers(this.productId).subscribe({
      next: items => { this.comparisons = items ?? []; this.loading = false; this.cdr.detectChanges(); },
      error: error => { console.error('Error comparando precios:', error); this.loading = false; this.notificationService.error('No fue posible cargar los precios de proveedores.'); this.cdr.detectChanges(); }
    });
  }

  addSupplierPrice(): void {
    if (!this.selectedSupplierId || !this.selectedBrandId || !this.selectedProductUnitId
      || this.purchasePrice == null || this.purchasePrice < 0 || this.saving) {
      this.notificationService.warning('Selecciona proveedor, marca, presentación e ingresa un precio válido.');
      return;
    }
    const request: ProductSupplierRequest = {
      supplierId: this.selectedSupplierId,
      brandId: this.selectedBrandId,
      productUnitId: this.selectedProductUnitId,
      purchasePrice: this.purchasePrice,
      selected: false
    };
    this.saving = true;
    const saveRequest = this.editingOfferId
      ? this.supplierService.updateProductSupplier(this.productId, this.editingOfferId, request)
      : this.supplierService.associateSupplier(this.productId, request);
    saveRequest.subscribe({
      next: () => {
        this.saving = false;
        this.purchasePrice = null;
        const wasEditing = this.editingOfferId !== null;
        this.editingOfferId = null;
        this.notificationService.success(wasEditing ? 'Oferta actualizada correctamente.' : 'Oferta de proveedor registrada correctamente.');
        this.loadComparisons();
      },
      error: error => {
        this.saving = false;
        console.error('Error registrando oferta:', error);
        this.notificationService.error(error?.error?.message ?? 'No fue posible registrar la oferta.');
        this.cdr.detectChanges();
      }
    });
  }

  editOffer(item: ProductSupplier): void {
    this.editingOfferId = item.id;
    this.selectedSupplierId = item.proveedorId;
    this.selectedBrandId = item.marcaId ?? null;
    this.selectedProductUnitId = item.presentacionId ?? null;
    this.purchasePrice = item.precioCompra;
  }

  cancelOfferEdit(): void {
    this.editingOfferId = null;
    this.selectedSupplierId = null;
    this.selectedBrandId = null;
    this.purchasePrice = null;
    const baseUnit = this.purchaseUnits.find(unit => unit.conversionFactor === 1);
    this.selectedProductUnitId = baseUnit?.id ?? this.purchaseUnits[0]?.id ?? null;
  }

  removeSupplier(item: ProductSupplier): void {
    if (!confirm(`¿Quitar la oferta de ${item.nombreProveedor} para ${item.nombreMarca || 'esta marca'} / ${item.nombrePresentacion || 'esta presentación'}?`)) return;
    this.supplierService.deleteProductSupplier(this.productId, item.id).subscribe({
      next: () => {
        this.comparisons = this.comparisons.filter(row => row.id !== item.id);
        this.notificationService.success('Oferta quitada de la comparación.');
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error quitando oferta:', error);
        this.notificationService.error(error?.error?.message ?? 'No fue posible quitar la oferta.');
      }
    });
  }

  selectSupplier(item: ProductSupplier): void {
    this.supplierService.selectSupplier(this.productId, item.id).subscribe({
      next: () => {
        this.comparisons = this.comparisons.map(row => ({ ...row, seleccionado: row.id === item.id }));
        this.notificationService.success('Oferta seleccionada como preferida para este producto.');
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error seleccionando oferta:', error);
        this.notificationService.error(error?.error?.message ?? 'No fue posible seleccionar la oferta.');
      }
    });
  }

  backToProduct(): void {
    this.router.navigate(['/products/edit', this.productId]);
  }
}