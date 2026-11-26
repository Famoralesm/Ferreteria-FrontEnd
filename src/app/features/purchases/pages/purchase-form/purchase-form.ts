import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { Product } from '../../../../core/models/product/product';
import { ProductUnit } from '../../../../core/models/product/product-unit';
import { Store } from '../../../../core/models/store/store';
import { Supplier } from '../../../../core/models/supplier/supplier';
import { PurchaseRequest } from '../../../../core/models/purchase/purchase';
import { ProductService } from '../../../../core/services/product.service';
import { ProductUnitService } from '../../../../core/services/product-unit.service';
import { StoreService } from '../../../../core/services/store.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { PurchaseService } from '../../../../core/services/purchase.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface PurchaseLine {
  productId: number | null;
  productUnitId: number | null;
  quantity: number;
  unitPurchasePrice: number;
  units: ProductUnit[];
  loadingUnits: boolean;
}

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, InputNumberModule, InputTextModule, TextareaModule, ConfirmDialogModule, PaginatorModule],
  providers: [ConfirmationService],
  templateUrl: './purchase-form.html',
  styleUrl: './purchase-form.scss'
})
export class PurchaseForm implements OnInit {
  suppliers: Supplier[] = [];
  stores: Store[] = [];
  products: Product[] = [];
  selectedStoreId: number | null = null;
  purchaseId: number | null = null;
  first = 0;
  readonly pageSize = 4;
  private editLoaded = false;

  documentType: string | null = null;
  documentNumber = '';
  purchaseDate = this.todayLocal();
  notes = '';
  lines: PurchaseLine[] = [this.newLine()];

  loading = true;
  saving = false;

  readonly documentTypes = [
    { label: 'Factura', value: 'FACTURA' },
    { label: 'Boleta', value: 'BOLETA' },
    { label: 'Guía de despacho', value: 'GUIA_DESPACHO' },
    { label: 'Otro', value: 'OTRO' }
  ];

  constructor(
    private readonly supplierService: SupplierService,
    private readonly storeService: StoreService,
    private readonly productService: ProductService,
    private readonly productUnitService: ProductUnitService,
    private readonly purchaseService: PurchaseService,
    private readonly notificationService: NotificationService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const routeId = Number(this.route.snapshot.paramMap.get('id'));
    this.purchaseId = Number.isInteger(routeId) && routeId > 0 ? routeId : null;
    this.supplierService.findAll().subscribe({
      next: suppliers => {
        this.suppliers = (suppliers ?? []).filter(supplier => supplier.activo);
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error cargando proveedores:', error);
        this.notificationService.error('No fue posible cargar los proveedores.');
      }
    });

    this.storeService.findActive().subscribe({
      next: stores => {
        this.stores = stores ?? [];
        this.selectedStoreId = this.storeService.selectedStoreId ?? this.stores[0]?.id ?? null;
        this.loadProducts();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error cargando sucursales:', error);
        this.loading = false;
        this.notificationService.error('No fue posible cargar las sucursales.');
        this.cdr.detectChanges();
      }
    });
  }

  private todayLocal(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private newLine(): PurchaseLine {
    return {
      productId: null,
      productUnitId: null,
      quantity: 1,
      unitPurchasePrice: 0,
      units: [],
      loadingUnits: false
    };
  }

  loadProducts(): void {
    if (!this.selectedStoreId) {
      this.products = [];
      return;
    }
    this.loading = true;
    this.productService.findAll(this.selectedStoreId).subscribe({
      next: products => {
        this.products = (products ?? []).filter(product => product.active);
        if (this.purchaseId && !this.editLoaded) this.loadPurchaseForEdit();
        else this.loading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error cargando productos:', error);
        this.loading = false;
        this.notificationService.error('No fue posible cargar los productos de la sucursal.');
        this.cdr.detectChanges();
      }
    });
  }

  onStoreChange(): void {
    if (this.lines.some(line => line.productId !== null)) {
      const previousStoreId = this.storeService.selectedStoreId;
      this.confirmationService.confirm({
        header: 'Cambiar sucursal',
        message: 'Al cambiar la sucursal se quitarán los productos agregados a esta compra. ¿Deseas continuar?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cambiar', rejectLabel: 'Mantener sucursal', acceptButtonStyleClass: 'p-button-warning',
        accept: () => { this.lines = [this.newLine()]; this.loadProducts(); },
        reject: () => { this.selectedStoreId = previousStoreId; this.cdr.detectChanges(); }
      });
      return;
    }
    this.lines = [this.newLine()];
    this.loadProducts();
  }

  get visibleLines(): PurchaseLine[] { return this.lines.slice(this.first, this.first + this.pageSize); }

  onProductChange(line: PurchaseLine): void {
    line.productUnitId = null;
    line.units = [];
    if (!line.productId) return;

    line.loadingUnits = true;
    this.productUnitService.findByProduct(line.productId).subscribe({
      next: units => {
        line.units = (units ?? []).filter(unit => unit.active && unit.purchaseAllowed);
        line.loadingUnits = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error cargando presentaciones:', error);
        line.loadingUnits = false;
        this.notificationService.error('No fue posible cargar las presentaciones del producto.');
        this.cdr.detectChanges();
      }
    });
  }

  addLine(): void {
    this.lines = [...this.lines, this.newLine()];
    this.first = Math.floor((this.lines.length - 1) / this.pageSize) * this.pageSize;
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      this.lines[0] = this.newLine();
      return;
    }
    this.lines = this.lines.filter((_, lineIndex) => lineIndex !== index);
    if (this.first >= this.lines.length) this.first = Math.max(0, Math.floor((this.lines.length - 1) / this.pageSize) * this.pageSize);
  }

  get estimatedTotal(): number {
    return this.lines.reduce((total, line) =>
      total + (Number(line.quantity) || 0) * (Number(line.unitPurchasePrice) || 0), 0);
  }

  selectedProduct(line: PurchaseLine): Product | undefined {
    return this.products.find(product => product.id === line.productId);
  }

  baseUnitLabel(line: PurchaseLine): string {
    const product = this.selectedProduct(line);
    return product?.baseUnitName || product?.baseUnitCode || product?.unit || 'Unidad base';
  }

  lineUnitLabel(line: PurchaseLine): string {
    if (line.productUnitId === null) return this.baseUnitLabel(line);
    return line.units.find(unit => unit.id === line.productUnitId)?.name ?? this.baseUnitLabel(line);
  }

  save(): void {
    if (this.saving) return;

    if (!this.selectedStoreId) {
      this.notificationService.warning('Selecciona una sucursal para la compra.');
      return;
    }
    if (!this.suppliers.length) {
      this.notificationService.warning('No hay proveedores activos disponibles.');
      return;
    }
    if (!this.documentDateValid()) {
      this.notificationService.warning('La fecha de compra es obligatoria.');
      return;
    }
    if (this.lines.length === 0 || this.lines.some(line =>
      line.loadingUnits || !line.productId || !Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0
      || !Number.isFinite(Number(line.unitPurchasePrice)) || Number(line.unitPurchasePrice) < 0
      || Number(line.quantity) > 9999999999.9999
      || Number(line.unitPurchasePrice) > 9999999999999.99
    )) {
      this.notificationService.warning('Revisa los productos, cantidades y precios. Todos los campos deben ser válidos.');
      return;
    }

    const chosenSupplier = this.selectedSupplierId;
    if (!chosenSupplier) {
      this.notificationService.warning('Selecciona un proveedor.');
      return;
    }

    const request: PurchaseRequest = {
      supplierId: chosenSupplier,
      sucursalId: this.selectedStoreId,
      documentType: this.documentType,
      documentNumber: this.documentNumber.trim() || null,
      purchaseDate: this.purchaseDate,
      notes: this.notes.trim() || null,
      items: this.lines.map(line => ({
        productId: Number(line.productId),
        productUnitId: line.productUnitId,
        quantity: Number(line.quantity),
        unitPurchasePrice: Number(line.unitPurchasePrice)
      }))
    };

    this.confirmationService.confirm({
      header: this.purchaseId ? 'Confirmar cambios de compra' : 'Confirmar registro de compra',
      message: this.purchaseId ? 'Se actualizarán los datos y productos de esta compra pendiente. ¿Deseas guardar los cambios?' : 'La compra quedará pendiente de recepción. El stock no cambiará hasta confirmar su recepción. ¿Deseas registrar esta compra?',
      icon: 'pi pi-file-check',
      acceptLabel: this.purchaseId ? 'Guardar cambios' : 'Registrar compra',
      rejectLabel: 'Revisar datos',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.savePurchase(request)
    });
  }

  private savePurchase(request: PurchaseRequest): void {
    this.saving = true;
    const operation = this.purchaseId ? this.purchaseService.update(this.purchaseId, request) : this.purchaseService.create(request);
    operation.subscribe({
      next: purchase => {
        this.saving = false;
        this.notificationService.success(this.purchaseId ? 'Compra actualizada correctamente.' : 'Compra registrada como pendiente de recepción.');
        this.router.navigate(['/purchases', purchase.id]);
      },
      error: error => {
        console.error('Error registrando compra:', error);
        this.saving = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible registrar la compra.');
        this.cdr.detectChanges();
      }
    });
  }

  selectedSupplierId: number | null = null;
  get pageTitle(): string { return this.purchaseId ? 'Editar compra' : 'Registrar compra'; }

  private loadPurchaseForEdit(): void {
    if (!this.purchaseId || this.editLoaded) return;
    this.editLoaded = true;
    this.loading = true;
    this.purchaseService.findById(this.purchaseId).subscribe({
      next: purchase => {
        if (purchase.status !== 'PENDING_RECEIPT') {
          this.notificationService.warning('Solo se pueden editar compras pendientes de recepción.');
          this.router.navigate(['/purchases', purchase.id]);
          return;
        }
        this.selectedSupplierId = purchase.supplierId;
        this.selectedStoreId = purchase.sucursalId;
        this.documentType = purchase.documentType;
        this.documentNumber = purchase.documentNumber ?? '';
        this.purchaseDate = purchase.purchaseDate;
        this.notes = purchase.notes ?? '';
        this.lines = purchase.items.map(item => ({
          productId: item.productId,
          productUnitId: item.productUnitId,
          quantity: Number(item.quantity),
          unitPurchasePrice: Number(item.unitPurchasePrice),
          units: [],
          loadingUnits: item.productUnitId !== null
        }));
        if (!this.lines.length) this.lines = [this.newLine()];
        this.first = 0;
        this.loading = false;
        this.lines.forEach(line => {
          if (!line.productId) return;
          this.productUnitService.findByProduct(line.productId).subscribe({
            next: units => {
              line.units = (units ?? []).filter(unit => unit.active && unit.purchaseAllowed);
              line.loadingUnits = false;
              this.cdr.detectChanges();
            },
            error: error => {
              console.error('Error cargando presentaciones de compra:', error);
              line.loadingUnits = false;
              this.notificationService.error('No fue posible cargar las presentaciones de uno de los productos.');
              this.cdr.detectChanges();
            }
          });
        });
        this.cdr.detectChanges();
      },
      error: error => {
        this.loading = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible cargar la compra para editar.');
        this.cdr.detectChanges();
      }
    });
  }


  private documentDateValid(): boolean {
    return !!this.purchaseDate && /^\d{4}-\d{2}-\d{2}$/.test(this.purchaseDate);
  }

  cancel(): void {
    this.router.navigate(['/purchases']);
  }
}