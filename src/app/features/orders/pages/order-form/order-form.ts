import { Component, inject, OnInit, OnDestroy,  ChangeDetectorRef } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators , FormsModule} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product/product';
import { ProductUnitService } from '../../../../core/services/product-unit.service';
import { CommonModule } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';
import { ORDER_STATUSES,OrderStatus } from '../../../../core/models/order/order-status';
import { OrderSummary } from '../../../../core/models/order/order-summary';
import { StoreService } from '../../../../core/services/store.service';
import { NotificationService } from '../../../../core/services/notification.service';   
import { CustomerService } from '../../../../core/services/customer.service';
import { Customer } from '../../../../core/models/customer/customer';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error';
import { buildOrderReceiptHtml } from '../../utils/order-receipt';

type UnknownCustomerOption = {
  id: null;
  nombre: string;
  rut: string;
  desconocido: true;
};

type CustomerOption = Customer | UnknownCustomerOption;

type SaleUnitOption = { id: number | null; code: string; name: string; conversionFactor: number; isBase: boolean; };

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    SelectModule,
    FormsModule,
    CommonModule,
    InputNumberModule,
    FieldErrorComponent

    
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
})
export class OrderForm implements OnInit , OnDestroy {

  id?: number;

  form!: FormGroup;
  products: Product[] = []; 
  searchResults: Product[] = [];
  selectedProduct?: Product;
  saleUnitOptions: SaleUnitOption[] = [];
  selectedSaleUnit: SaleUnitOption | null = null;
  productUnitsLoading = false;
  quantity = 1;
  items: {
  productId: number | null;
  unitId?: number | null;
  productName: string;
  quantity: number;
  unitName: string;
  conversionFactor: number;
  quantityInBaseUnit: number;
  baseUnitSymbol: string;
  unitPrice: number;
  total: number;
  stockAvailable: number;
  stockMinimo: number;
  regularUnitPrice: number;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number;
  wholesaleApplied: boolean;
  }[] = [];
  orderStatuses = ORDER_STATUSES;

  paymentStatus: 'PENDING' | 'PAID' | 'REVERSED' = 'PENDING';
  paymentReceivedAt?: string | null;
  paymentReceivedBy?: { name?: string; email?: string } | null;
  paymentReversedAt?: string | null;
  paymentReversedBy?: { name?: string; email?: string } | null;
  paymentReversalReason?: string | null;
  paymentDialogVisible = false;
  paymentSaving = false;
  savingOrder = false;
  paymentTotalAmount = 0;
  itemsChanged = false;

  customers: Customer[] = [];
  customerOptions: CustomerOption[] = [];
  selectedCustomerOption: CustomerOption | null = null;
  itemsTouched = false;
  productSelectionError = false;
  quantityError = false;

  private customerService = inject(CustomerService);
  private storeService = inject(StoreService);
  private productService = inject(ProductService);
  private productUnitService = inject(ProductUnitService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private timerSubscription?: Subscription;
  private statusChangedAt?: string;
  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
  private orderStoreId?: number;

  private extractCoordinates(url: string): {
      latitude: number;
      longitude: number;
    } | null {

      if (!url) {
        return null;
      }

      let match = url.match(
        /@(-?\d+\.\d+),(-?\d+\.\d+)/
      );

      if (match) {

        return {
          latitude: Number(match[1]),
          longitude: Number(match[2])
        };

      }

      /*
      * También soporta:
      *
      * ?query=-33.52,-70.60
      */

      match = url.match(
        /[?&](?:query|q|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/
      );

      if (match) {

        return {
          latitude: Number(match[1]),
          longitude: Number(match[2])
        };

      }

      /*
      * Soporta links que contienen directamente:
      *
      * -33.52,-70.60
      */

      match = url.match(
        /(-?\d+\.\d+),(-?\d+\.\d+)/
      );

      if (match) {

        return {
          latitude: Number(match[1]),
          longitude: Number(match[2])
        };

      }

      return null;
    }
  wazeLink = '';
  googleMapsLink = '';

  paymentMethods = [
    {
      label: 'Efectivo',
      value: 'CASH'
    },
    {
      label: 'Transferencia',
      value: 'TRANSFER'
    }
  ];
  elapsedTime = '00:00:00';




  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {

    this.form = this.fb.group({

      customerName: ['',Validators.required],
      phone: [''],
      address: ['',Validators.required],
      city: ['', Validators.required],
      commune: ['', Validators.required],
      latitude: [null],
      longitude: [null],
      deliveryDate: ['',Validators.required],
      paymentMethod: ['',Validators.required],
      notes: [''],

      // Solo lectura
      status: ['CREATED'],

      // Información de auditoría
      orderNumber: [{ value: '', disabled: true }],
      createdAt: [{ value: '', disabled: true }],
      createdBy: [{ value: '', disabled: true }],
      updated_at: [{ value: '', disabled: true }],
      totalAmount: [{ value: '', disabled: true }],
  


    });

  }

ngOnInit(): void {

  const idParam = this.route.snapshot.paramMap.get('id');

  this.id = idParam ? Number(idParam) : undefined;

  this.loadProducts();
  this.loadCustomers();

  if (this.id) {
    this.loadOrder(this.id);
    this.updateElapsedTime();
    this.startTimer();
  }

}
  ngOnDestroy(): void {

    this.timerSubscription?.unsubscribe();

  }

 
private loadProducts(): void {

  const sucursalId = this.storeService.selectedStoreId;


  if (sucursalId === null) {

    this.notificationService.warning(
      'Debes seleccionar una sucursal para cargar los productos.'
    );

    return;
  }


  this.productService
    .findAll(sucursalId)
    .subscribe({

      next: products => {

        console.log(
          'PRODUCTOS PARA PEDIDO:',
          products
        );

        this.products = products.filter(product => product.active);
        this.refreshItemsStock();
      },

      error: err => {

        console.error(
          'Error cargando productos:',
          err
        );

        this.notificationService.error(
          'No fue posible cargar los productos de la sucursal.'
        );
      }

    });

}
  loadOrder(id: number): void {

    this.orderService.findById(id)
      .subscribe({

        next: order => {

          if (this.form.get('status')?.value === 'DELIVERED' && this.paymentStatus !== 'PAID') {
    this.notificationService.error('No se puede guardar un pedido como entregado sin confirmar el pago.');
    this.cdr.detectChanges();
    return;
  }

  const selectedStoreId = this.storeService.selectedStoreId;
          this.orderStoreId = order.storeId;
          if (order.storeId !== selectedStoreId) {
            this.notificationService.error(
              'Este pedido pertenece a otra sucursal. Regresa al listado y selecciona la sucursal correspondiente.'
            );

            this.router.navigate(['/orders']);
            return;
          }
          this.orderStoreId = order.storeId;
          this.form.patchValue({

            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            deliveryDate: order.deliveryDate,
            paymentMethod: order.paymentMethod,
            notes: order.notes,

            status: order.status,

            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            createdBy: `${order.createdBy?.name} — ${order.createdBy?.role}`,
            updated_at: order.updated_at,
            totalAmount: order.totalAmount,


          });
          this.paymentStatus = order.paymentStatus ?? 'PENDING';
          if (this.paymentStatus === 'PAID' || this.paymentStatus === 'REVERSED') {
            this.form.get('paymentMethod')?.disable({ emitEvent: false });
          } else {
            this.form.get('paymentMethod')?.enable({ emitEvent: false });
          }
          this.paymentTotalAmount = order.totalAmount ?? 0;
          this.itemsChanged = false;
          this.paymentReceivedAt = order.paymentReceivedAt ?? null;
          this.paymentReceivedBy = order.paymentReceivedBy ?? null;
          this.paymentReversedAt = order.paymentReversedAt ?? null;
          this.paymentReversedBy = order.paymentReversedBy ?? null;
          this.paymentReversalReason = order.paymentReversalReason ?? null;

          this.syncSelectedCustomer();
          this.items = order.items.map(item => {
            const product = this.products.find(
              p => p.id === item.productId
            );

            const conversionFactor = item.conversionFactor ?? 1;
            return {
              productId: item.productId,
              unitId: item.unitId ?? null,
              productName: item.productName,
              quantity: item.quantity,
              unitName: item.unitName ?? product?.baseUnitName ?? 'Unidad base',
              conversionFactor,
              quantityInBaseUnit: item.quantityInBaseUnit ?? item.quantity * conversionFactor,
              baseUnitSymbol: product?.baseUnitSymbol ?? '',
              unitPrice: item.unitPrice,
              total: item.totalPrice,
              stockAvailable: product?.stock ?? 0,
              stockMinimo: product?.stockMinimo ?? 0,
              regularUnitPrice: product?.price ?? item.unitPrice,
              wholesalePrice: product?.wholesalePrice ?? null,
              wholesaleMinQuantity: product?.wholesaleMinQuantity ?? 0,
              wholesaleApplied: item.wholesaleApplied ?? false
            };
          });
          this.refreshItemsStock();

          this.statusChangedAt = order.statusChangedAt
          this.updateElapsedTime();
          this.updateMapLinks();


        },

        error: err => {
          console.error('Error cargando pedido:', err);
        }

      });

  }

 updateOrder(): void {

  if (!this.id) {
    return;
  }

  const formValue = this.form.getRawValue();

  const data = {

    customerName: formValue.customerName,
    phone: formValue.phone,
    address: formValue.address,
    latitude: formValue.latitude,
    longitude: formValue.longitude,
    deliveryDate: formValue.deliveryDate,
    paymentMethod: formValue.paymentMethod,
    notes: formValue.notes,
    status: formValue.status,

    items: this.items.map(item => ({
      productId: item.productId,
      unitId: item.unitId ?? null,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    }))

  };

  console.log('ID:', this.id);
  console.log('Datos a actualizar:', data);

  this.orderService.update(this.id, data)
    .subscribe({

      next: order => {

        console.log(
          'Pedido actualizado:',
          order
        );
        this.cdr.detectChanges();

        this.router.navigate(['/orders']);

      },

      error: err => {

        console.error(
          'Error actualizando pedido:',
          err
        );

      }

    });

  }

  printOrder(): void {
    if (!this.id) {
      return;
    }

    // Abrimos la ventana durante el clic para evitar que el navegador bloquee el popup.
    const printWindow = window.open('', '_blank', 'width=460,height=800');
    if (!printWindow) {
      this.notificationService.warning(
        'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio.'
      );
      return;
    }

    printWindow.document.write('<!doctype html><html><head><title>Preparando comprobante...</title></head><body><p>Preparando comprobante...</p></body></html>');
    printWindow.document.close();

    this.orderService.findById(this.id).subscribe({
      next: order => {
        printWindow.document.open();
        printWindow.document.write(buildOrderReceiptHtml(order));
        printWindow.document.close();
        printWindow.focus();
        window.setTimeout(() => printWindow.print(), 300);
      },
      error: error => {
        console.error('No fue posible cargar el pedido para imprimir:', error);
        printWindow.close();
        this.notificationService.error(
          'No fue posible obtener los datos del pedido para imprimir.'
        );
      }
    });
  }

  openPaymentConfirmation(): void {
    if (!this.id || this.paymentStatus !== 'PENDING') {
      return;
    }
    this.paymentDialogVisible = true;
  }

  cancelPaymentConfirmation(): void {
    this.paymentDialogVisible = false;
  }

  confirmPayment(): void {
    if (!this.id || this.paymentStatus !== 'PENDING' || this.paymentSaving) {
      return;
    }

    this.paymentSaving = true;
    this.orderService.confirmPayment(this.id).subscribe({
      next: order => {
        this.paymentStatus = order.paymentStatus ?? 'PAID';
        this.form.get('paymentMethod')?.disable({ emitEvent: false });
        this.paymentReceivedAt = order.paymentReceivedAt ?? null;
        this.paymentReceivedBy = order.paymentReceivedBy ?? null;
        this.paymentDialogVisible = false;
        this.paymentSaving = false;
        this.notificationService.success('Pago registrado correctamente.');
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error confirmando el pago:', err);
        this.paymentSaving = false;
        this.notificationService.error(
          err.error?.message ?? 'No fue posible registrar el pago. Actualiza el pedido e inténtalo nuevamente.'
        );
        this.cdr.detectChanges();
      }
    });
  }

  get paymentMethodLabel(): string {
    const method = this.form.get('paymentMethod')?.value;
    return this.paymentMethods.find(item => item.value === method)?.label ?? 'No seleccionado';
  }

  exit(): void {
    if ((this.form.dirty || this.itemsChanged) &&
        !window.confirm('Hay cambios sin guardar. ¿Seguro que deseas salir sin guardar?')) {
      return;
    }

    this.router.navigate(['/orders']);
  }

  get deliveryPaymentError(): boolean {
    return this.form.get('status')?.value === 'DELIVERED' && this.paymentStatus !== 'PAID';
  }

  get canConfirmPayment(): boolean {
    const orderStatus = this.form.get('status')?.value;
    return !!this.id
      && this.paymentStatus === 'PENDING'
      && orderStatus !== 'CANCELED'
      && orderStatus !== 'REJECTED'
      && this.items.length > 0
      && !this.form.dirty
      && !this.itemsChanged;
  }

  get isInRoute(): boolean {
    return this.form.get('status')?.value === 'IN_ROUTE';
  }

  onProductSelected(product: Product | null | undefined): void {
    this.selectedProduct = product ?? undefined;
    this.saleUnitOptions = [];
    this.selectedSaleUnit = null;
    this.quantity = 1;
    if (!product) return;

    const baseOption: SaleUnitOption = {
      id: null,
      code: 'BASE',
      name: (product.baseUnitName ?? 'Unidad base') + ' (unidad base)',
      conversionFactor: 1,
      isBase: true
    };
    this.saleUnitOptions = [baseOption];
    this.selectedSaleUnit = baseOption;
    if (!product.baseUnitId) return;

    this.productUnitsLoading = true;
    this.productUnitService.findByProduct(product.id).subscribe({
      next: units => {
        const commercialOptions = (units ?? [])
          .filter(unit => unit.active && unit.saleAllowed && unit.code !== product.baseUnitCode)
          .map(unit => ({
            id: unit.id,
            code: unit.code,
            name: unit.name,
            conversionFactor: unit.conversionFactor,
            isBase: false
          }));
        this.saleUnitOptions = [baseOption, ...commercialOptions];
        this.productUnitsLoading = false;
        this.quantity = this.quantityMinimum;
        this.cdr.detectChanges();
      },
      error: error => {
        this.productUnitsLoading = false;
        console.error('Error cargando presentaciones para venta:', error);
        this.notificationService.error('No fue posible cargar las presentaciones de venta del producto.');
        this.cdr.detectChanges();
      }
    });
  }

  onSaleUnitChange(option: SaleUnitOption | null): void {
    this.selectedSaleUnit = option;
    this.quantity = this.quantityMinimum;
  }

  get selectedConversionFactor(): number {
    return this.selectedSaleUnit?.conversionFactor ?? 1;
  }

  get quantityMinimum(): number {
    return (this.selectedProduct?.minimumSaleQuantity ?? 1) / this.selectedConversionFactor;
  }

  get quantityIncrement(): number {
    return (this.selectedProduct?.saleQuantityIncrement ?? 1) / this.selectedConversionFactor;
  }

  addProduct(): void {
    if (this.isInRoute || this.paymentStatus !== 'PENDING') {
      this.notificationService.warning('Este pedido no permite modificar sus productos por su estado actual.');
      return;
    }
    if (!this.selectedProduct) {
      this.productSelectionError = true;
      return;
    }
    this.productSelectionError = false;

    if (!this.selectedProduct.baseUnitId) {
      this.notificationService.warning('Define la unidad base de ' + this.selectedProduct.name + ' en Productos → Presentaciones antes de agregarlo al pedido.');
      return;
    }
    if (!this.selectedSaleUnit || this.quantity <= 0) {
      this.quantityError = true;
      return;
    }
    this.quantityError = false;

    const product = this.selectedProduct;
    const factor = this.selectedConversionFactor;
    const requestedBaseQuantity = this.quantity * factor;
    const currentBaseQuantity = this.items
      .filter(item => item.productId === product.id)
      .reduce((sum, item) => sum + item.quantity * item.conversionFactor, 0);
    const resultingBaseQuantity = currentBaseQuantity + requestedBaseQuantity;
    const minimum = product.minimumSaleQuantity ?? 1;
    const increment = product.saleQuantityIncrement ?? 1;
    const steps = (resultingBaseQuantity - minimum) / increment;

    if (resultingBaseQuantity < minimum
        || !Number.isFinite(steps)
        || Math.abs(steps - Math.round(steps)) > 0.000001) {
      this.notificationService.warning(
        'La cantidad total debe ser al menos ' + minimum + ' ' + (product.baseUnitSymbol ?? 'unidades')
        + ' y avanzar en incrementos de ' + increment + '.'
      );
      return;
    }

    const unitId = this.selectedSaleUnit.isBase ? null : this.selectedSaleUnit.id;
    const existing = this.items.find(item =>
      item.productId === product.id && (item.unitId ?? null) === unitId
    );

    if (existing) {
      existing.quantity += this.quantity;
      existing.quantityInBaseUnit = existing.quantity * existing.conversionFactor;
    } else {
      this.items.push({
        productId: product.id,
        unitId,
        productName: product.name,
        quantity: this.quantity,
        unitName: this.selectedSaleUnit.isBase ? (product.baseUnitName ?? 'Unidad base') : this.selectedSaleUnit.name,
        conversionFactor: factor,
        quantityInBaseUnit: requestedBaseQuantity,
        baseUnitSymbol: product.baseUnitSymbol ?? '',
        unitPrice: product.price,
        total: product.price * requestedBaseQuantity,
        stockAvailable: product.stock,
        stockMinimo: product.stockMinimo ?? 0,
        regularUnitPrice: product.price,
        wholesalePrice: product.wholesalePrice ?? null,
        wholesaleMinQuantity: product.wholesaleMinQuantity ?? 0,
        wholesaleApplied: false
      });
    }

    this.recalculateProductPricing(product.id);
    this.selectedProduct = undefined;
    this.selectedSaleUnit = null;
    this.saleUnitOptions = [];
    this.quantity = 1;
    this.itemsTouched = false;
    this.itemsChanged = true;
    this.updateTotal();
  }

  removeProduct(index: number): void {

  if (this.isInRoute || this.paymentStatus !== 'PENDING') {
    this.notificationService.warning('Este pedido no permite modificar sus productos por su estado actual.');
    return;
  }

  if (index < 0 || index >= this.items.length) {
    return;
  }

  const removedProductId = this.items[index].productId;
  this.items.splice(index, 1);

  this.items = [...this.items];
  if (removedProductId !== null) this.recalculateProductPricing(removedProductId);
  this.itemsChanged = true;

  this.updateTotal();

}
private updateTotal(): void {

  const total =
    this.items.reduce(
      (sum, item) => sum + item.total,
      0
    );

  this.form.patchValue({
    totalAmount: total
  });

}

  private startTimer(): void {

  this.timerSubscription?.unsubscribe();

  this.timerSubscription = interval(1000)
    .subscribe(() => {

      this.updateElapsedTime();

    });

}

private updateElapsedTime(): void {

  const status = this.form.get('status')?.value;

  if (
    status === 'DELIVERED' ||
    status === 'CANCELED' ||
    status === 'REJECTED'
  ) {
    this.elapsedTime = '';
    return;
  }

  if (!this.statusChangedAt) {
    this.elapsedTime = '00:00:00';
    return;
  }

  const elapsed =
    Math.max(
      0,
      Date.now() -
      new Date(this.statusChangedAt).getTime()
    );

  const totalSeconds =
    Math.floor(elapsed / 1000);

  const days =
    Math.floor(totalSeconds / 86400);

  const hours =
    Math.floor(
      (totalSeconds % 86400) / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;

  if (days > 0) {

    this.elapsedTime =
      `${days}d ${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;

    return;
  }

  this.elapsedTime =
    `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
}


private updateMapLinks(): void {

  const address = this.form.get('address')?.value?.trim();

  if (!address) {
    this.wazeLink = '';
    this.googleMapsLink = '';
    return;
  }

  const latitude = this.form.get('latitude')?.value;
  const longitude = this.form.get('longitude')?.value;

  // Si tenemos coordenadas, usamos coordenadas.
  if (latitude && longitude) {

    this.wazeLink =
      `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

    this.googleMapsLink =
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    return;
  }

  // Si solamente tenemos texto, usamos la dirección.
  const encodedAddress = encodeURIComponent(address);

  this.wazeLink =
    `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;

  this.googleMapsLink =
    `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
}

onAddressPaste(event: ClipboardEvent): void {

  const pastedText =
    event.clipboardData?.getData('text')?.trim();

  if (!pastedText) {
    return;
  }

  setTimeout(() => {

    const coordinates =
      this.extractCoordinates(pastedText);

    if (coordinates) {

      console.log(
        '📍 Coordenadas detectadas:',
        coordinates
      );

      this.form.patchValue({

        latitude: coordinates.latitude,
        longitude: coordinates.longitude

      });

    } else {

      console.log(
        '⚠️ No se encontraron coordenadas en el enlace'
      );

      this.form.patchValue({

        latitude: null,
        longitude: null

      });

    }

    this.updateMapLinks();

  });

}

onAddressChange(): void {

  const address =
    this.form.get('address')?.value?.trim();

  if (!address) {

    this.form.patchValue({
      latitude: null,
      longitude: null
    });

    this.wazeLink = '';
    this.googleMapsLink = '';

    return;
  }

  this.updateMapLinks();

}

saveOrder(exitAfterSave = false): void {

  if (
    this.id &&
    this.orderStoreId !== this.storeService.selectedStoreId
  ) {
    this.notificationService.error(
      'No puedes guardar el pedido desde una sucursal diferente a la original.'
    );
    return;
  }
  if (this.savingOrder) return;

  this.form.markAllAsTouched();
  this.itemsTouched = this.items.length === 0;

  if (this.form.invalid || this.itemsTouched) {
    this.cdr.detectChanges();
    return;
  }

  const selectedStoreId = this.storeService.selectedStoreId;

  if (!this.id && selectedStoreId === null) {

    this.notificationService.warning(
      'Debes seleccionar una sucursal antes de crear el pedido.'
    );

    return;
  }

  const formValue = this.form.getRawValue();

  const data = {

    storeId: selectedStoreId!,
    customerName: formValue.customerName,
    phone: formValue.phone || '',
    address: formValue.address,
    deliveryDate: formValue.deliveryDate,
    paymentMethod: formValue.paymentMethod,
    notes: formValue.notes,
    status: formValue.status,
    

    items: this.items.map(item => ({
      productId: item.productId,
      unitId: item.unitId ?? null,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))

  };

  console.log('ENVIANDO PEDIDO:', data);
  this.savingOrder = true;

  if (this.id) {

    this.orderService.update(this.id, data)
      .subscribe({

        next: order => {
          this.savingOrder = false;
          this.paymentStatus = order.paymentStatus ?? this.paymentStatus;
          this.paymentReceivedAt = order.paymentReceivedAt ?? this.paymentReceivedAt;
          this.paymentReceivedBy = order.paymentReceivedBy ?? this.paymentReceivedBy;
          this.paymentReversedAt = order.paymentReversedAt ?? this.paymentReversedAt;
          this.paymentReversedBy = order.paymentReversedBy ?? this.paymentReversedBy;
          this.paymentReversalReason = order.paymentReversalReason ?? this.paymentReversalReason;
          if (this.paymentStatus === 'PAID' || this.paymentStatus === 'REVERSED') {
            this.form.get('paymentMethod')?.disable({ emitEvent: false });
          }
          this.paymentTotalAmount = order.totalAmount ?? this.paymentTotalAmount;
          this.itemsChanged = false;
          this.form.patchValue({
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount
          });
          this.form.markAsPristine();

          this.notificationService.success('El pedido fue actualizado correctamente.');
          this.cdr.detectChanges();

          if (exitAfterSave) {
            this.router.navigate(['/orders']);
          }
        },

        error: err => {
          this.savingOrder = false;
          console.error('Error actualizando pedido:', err);
          console.error('HTTP STATUS:', err.status);
          console.error('RESPUESTA BACKEND:', err.error);

          const detail =
            typeof err.error === 'string'
              ? err.error
              : JSON.stringify(err.error, null, 2);

          this.notificationService.error(
            `No fue posible actualizar el pedido: ${detail || 'Error sin detalle del servidor'}`
          );

          this.cdr.detectChanges();
        }


      });

  } else {

    this.orderService.create(data)
      .subscribe({

        next: order => {
          this.savingOrder = false;
          this.id = order.id;
          this.orderStoreId = selectedStoreId!;
          this.paymentStatus = order.paymentStatus ?? 'PENDING';
          if (this.paymentStatus === 'PAID' || this.paymentStatus === 'REVERSED') {
            this.form.get('paymentMethod')?.disable({ emitEvent: false });
          }
          this.paymentTotalAmount = order.totalAmount ?? 0;
          this.itemsChanged = false;
          this.form.patchValue({
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            createdBy: order.createdBy?.name ?? order.createdBy?.email ?? ''
          });
          this.form.markAsPristine();

          this.notificationService.success('El pedido fue creado correctamente.');
          this.cdr.detectChanges();

          if (exitAfterSave) {
            this.router.navigate(['/orders']);
          } else {
            this.router.navigate(['/orders/edit', order.id]);
          }
        },

       
        error: err => {
          this.savingOrder = false;
          console.error('Error creando pedido:', err);
          console.error('HTTP STATUS:', err.status);
          console.error('RESPUESTA BACKEND:', err.error);

          const detail =
            typeof err.error === 'string'
              ? err.error
              : JSON.stringify(err.error, null, 2);

          this.notificationService.error(
            `No fue posible actualizar el pedido: ${detail || 'Error sin detalle del servidor'}`
          );

          this.cdr.detectChanges();
        }


      });

  }

}

  getStatusLabel(status: string | null | undefined): string {

    if (!status) {
      return '';
    }

    const found = this.orderStatuses.find(
      item => item.value === status
    );

    return found?.label ?? status;
  }

  private loadCustomers(): void {

  this.customerService.findAll().subscribe({

    next: customers => {

      this.customers = customers.filter(customer => customer.activo);

      const unknownOption: UnknownCustomerOption = {
        id: null,
        nombre: 'Cliente desconocido',
        rut: '',
        desconocido: true
      };

      this.customerOptions = [
        ...this.customers,
        unknownOption
      ];
      this.syncSelectedCustomer();

      // PrimeNG p-select debe recibir las opciones antes de la siguiente verificación.
      this.cdr.detectChanges();

    },

    error: err => {
      console.error('Error cargando clientes:', err);
      this.notificationService.warning(
        'No fue posible cargar los clientes registrados.'
      );
    }

  });

}
onCustomerSelected(option: CustomerOption | null): void {

  this.selectedCustomerOption = option;

  if (!option) {
    this.form.patchValue({
      customerName: '',
      phone: '',
      address: '',
      city: '',
      commune: ''
    });
    return;
  }

  if ('desconocido' in option) {

    this.form.patchValue({
      customerName: 'Cliente desconocido',
      phone: '',
      address: '',
      city: '',
      commune: ''
    });

    return;
  }

  // Cliente existente: datos obtenidos desde la BD.
  this.form.patchValue({
    customerName: option.nombre,
    phone: option.telefono ?? '',
    address: option.direccion ?? '',
    city: option.ciudad?.nombre ?? '',
    commune: option.comuna?.nombre ?? ''
  });

  this.updateMapLinks();

}




private syncSelectedCustomer(): void {
  const customerName = String(
    this.form.get('customerName')?.value ?? ''
  ).trim();

  if (!customerName) {
    this.selectedCustomerOption = null;
    return;
  }

  const normalizedName = customerName.toLowerCase();

  // Buscar primero entre los clientes cargados.
  const customer = this.customers.find(
    option =>
      option.nombre.trim().toLowerCase() === normalizedName
  );

  if (customer) {
    this.customerOptions = [
      ...this.customers,
      {
        id: null,
        nombre: 'Cliente desconocido',
        rut: '',
        desconocido: true
      }
    ];

    this.selectedCustomerOption = customer;
    this.form.patchValue({
      city: customer.ciudad?.nombre ?? '',
      commune: customer.comuna?.nombre ?? ''
    });
    return;
  }

  // Si el cliente ya no está activo o no aparece en la lista,
  // creamos una opción para poder mostrar el nombre histórico.
  const historicalCustomer: UnknownCustomerOption = {
    id: null,
    nombre: customerName,
    rut: '',
    desconocido: true
  };

  this.customerOptions = [
    ...this.customers,
    {
      id: null,
      nombre: 'Cliente desconocido',
      rut: '',
      desconocido: true
    },
    ...(normalizedName === 'cliente desconocido'
      ? []
      : [historicalCustomer])
  ];

  this.selectedCustomerOption =
    normalizedName === 'cliente desconocido'
      ? this.customerOptions[this.customerOptions.length - 1]
      : historicalCustomer;
  this.form.patchValue({ city: '', commune: '' });
}


get isUnknownCustomerSelected(): boolean {
  return (
    !this.id &&
    this.selectedCustomerOption !== null &&
    'desconocido' in this.selectedCustomerOption
  );
}


private recalculateProductPricing(productId: number): void {
  const product = this.products.find(item => item.id === productId);
  if (!product) return;

  const productItems = this.items.filter(item => item.productId === productId);
  const totalInBaseUnit = productItems.reduce(
    (sum, item) => sum + item.quantity * item.conversionFactor,
    0
  );
  const wholesaleMin = product.wholesaleMinQuantity ?? 0;
  const wholesaleApplied = !!product.wholesalePrice
    && product.wholesalePrice > 0
    && wholesaleMin > 0
    && totalInBaseUnit >= wholesaleMin;
  const unitPrice = wholesaleApplied ? product.wholesalePrice! : product.price;

  productItems.forEach(item => {
    item.regularUnitPrice = product.price;
    item.wholesalePrice = product.wholesalePrice ?? null;
    item.wholesaleMinQuantity = wholesaleMin;
    item.wholesaleApplied = wholesaleApplied;
    item.unitPrice = unitPrice;
    item.quantityInBaseUnit = item.quantity * item.conversionFactor;
    item.baseUnitSymbol = product.baseUnitSymbol ?? '';
    item.total = unitPrice * item.quantityInBaseUnit;
  });
}

private refreshItemsStock(): void {
  this.items = this.items.map(item => {
    const product = this.products.find(p => p.id === item.productId);
    if (!product) return item;

    return {
      ...item,
      stockAvailable: product.stock ?? 0,
      stockMinimo: product.stockMinimo ?? 0,
      baseUnitSymbol: product.baseUnitSymbol ?? item.baseUnitSymbol
    };
  });
}
  
}