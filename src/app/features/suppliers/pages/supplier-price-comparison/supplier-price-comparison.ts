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
import { NotificationService } from '../../../../core/services/notification.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ProductService } from '../../../../core/services/product.service';
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
  suppliers: Supplier[] = [];
  comparisons: ProductSupplier[] = [];
  selectedSupplierId: number | null = null;
  purchasePrice: number | null = null;
  loading = false;
  saving = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly supplierService: SupplierService,
    private readonly productService: ProductService,
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
      },
      error: error => console.error('Error cargando producto comparado:', error)
    });
  }

  get sortedComparisons(): ProductSupplier[] {
    return [...this.comparisons].sort((a, b) => a.precioCompra - b.precioCompra);
  }

  get availableSuppliers(): Supplier[] {
    const linked = new Set(this.comparisons.map(item => item.proveedorId));
    return this.suppliers.filter(item => item.activo && !linked.has(item.id));
  }

  loadSuppliers(): void {
    this.supplierService.findAll().subscribe({
      next: items => { this.suppliers = items ?? []; this.cdr.detectChanges(); },
      error: error => { console.error('Error cargando proveedores:', error); this.notificationService.error('No fue posible cargar los proveedores.'); }
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
    if (!this.selectedSupplierId || this.purchasePrice == null || this.purchasePrice < 0 || this.saving) {
      this.notificationService.warning('Selecciona un proveedor e ingresa un precio válido.');
      return;
    }
    const request: ProductSupplierRequest = {
      supplierId: this.selectedSupplierId,
      purchasePrice: this.purchasePrice,
      selected: false
    };
    this.saving = true;
    this.supplierService.associateSupplier(this.productId, request).subscribe({
      next: () => {
        this.saving = false;
        this.selectedSupplierId = null;
        this.purchasePrice = null;
        this.notificationService.success('Precio de proveedor agregado correctamente.');
        this.loadComparisons();
      },
      error: error => {
        this.saving = false;
        console.error('Error asociando proveedor:', error);
        this.notificationService.error(error?.error?.message ?? 'No fue posible agregar el precio del proveedor.');
        this.cdr.detectChanges();
      }
    });
  }

  removeSupplier(item: ProductSupplier): void {
    if (!confirm(`¿Quitar a ${item.nombreProveedor} de la comparación de este producto?`)) return;
    this.supplierService.deleteProductSupplier(this.productId, item.id).subscribe({
      next: () => {
        this.comparisons = this.comparisons.filter(row => row.id !== item.id);
        this.notificationService.success('Proveedor quitado de la comparación.');
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error quitando proveedor del producto:', error);
        this.notificationService.error(error?.error?.message ?? 'No fue posible quitar el proveedor.');
      }
    });
  }

  selectSupplier(item: ProductSupplier): void {
    this.supplierService.selectSupplier(this.productId, item.id).subscribe({
      next: () => {
        this.comparisons = this.comparisons.map(row => ({ ...row, seleccionado: row.id === item.id }));
        this.notificationService.success('Proveedor seleccionado para este producto.');
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error seleccionando proveedor:', error);
        this.notificationService.error(error?.error?.message ?? 'No fue posible seleccionar el proveedor.');
      }
    });
  }

  backToProduct(): void {
    this.router.navigate(['/products/edit', this.productId]);
  }
}
