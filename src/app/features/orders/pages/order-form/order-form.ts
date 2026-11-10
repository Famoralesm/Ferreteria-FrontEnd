import { Component, inject, OnInit, OnDestroy,  ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';

import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product/product';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';
import { ORDER_STATUSES,OrderStatus } from '../../../../core/models/order/order-status';
import { OrderSummary } from '../../../../core/models/order/order-summary';
import { NotificationService } from '../../../../core/services/notification.service';   

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
    InputNumberModule

    
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
  quantity = 1;
  items: {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  }[] = [];
  orderStatuses = ORDER_STATUSES;

  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private timerSubscription?: Subscription;
  private statusChangedAt?: string;
  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
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

      customerName: [''],
      phone: [''],
      address: [''],
      latitude: [null],
      longitude: [null],
      deliveryDate: [''],
      paymentMethod: [''],
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

  const idParam =
    this.route.snapshot.paramMap.get('id');

  this.id = idParam
    ? Number(idParam)
    : undefined;

  this.loadProducts();

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

  this.productService
    .findAll()
    .subscribe({

      next: products => {

        console.log(
          'PRODUCTOS PARA PEDIDO:',
          products
        );

        this.products = products;

      },

      error: err => {

        console.error(
          'Error cargando productos:',
          err
        );

      }

    });

  }
  loadOrder(id: number): void {

    this.orderService.findById(id)
      .subscribe({

        next: order => {


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
          this.items = order.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.totalPrice
              }));

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
      quantity: item.quantity,
      unitPrice: item.unitPrice
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

  cancel(): void {

    this.router.navigate(['/orders']);

  }

  addProduct(): void {

  console.log('Producto seleccionado:', this.selectedProduct);
  console.log('Cantidad:', this.quantity);

  if (!this.selectedProduct) {
    console.warn('No hay producto seleccionado');
    return;
  }

  if (this.quantity <= 0) {
    console.warn('Cantidad inválida');
    return;
  }

  const existing = this.items.find(
    item => item.productId === this.selectedProduct!.id
  );

  if (existing) {

    existing.quantity += this.quantity;

    existing.total =
      existing.quantity * existing.unitPrice;

  } else {

    this.items.push({

      productId: this.selectedProduct.id,

      productName: this.selectedProduct.name,

      quantity: this.quantity,

      unitPrice: this.selectedProduct.price,

      total:
        this.selectedProduct.price *
        this.quantity

    });

  }

  this.selectedProduct = undefined;
  this.quantity = 1;

  this.updateTotal();

  console.log('Items:', this.items);
}
removeProduct(productId: number): void {

  this.items =
    this.items.filter(
      item => item.productId !== productId
    );

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

saveOrder(): void {

  const formValue = this.form.getRawValue();

  if (this.items.length === 0) {
    console.warn('El pedido debe tener al menos un producto');
    return;
  }

  const data = {

    customerName: formValue.customerName,
    phone: formValue.phone,
    address: formValue.address,
    deliveryDate: formValue.deliveryDate,
    paymentMethod: formValue.paymentMethod,
    notes: formValue.notes,
    status: formValue.status,

    items: this.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))

  };

  console.log('ENVIANDO PEDIDO:', data);

  if (this.id) {

    this.orderService.update(this.id, data)
      .subscribe({

        next: order => {

          console.log('Pedido creado:', order);
          this.cdr.detectChanges();
          this.router.navigate(['/orders', order.id]);
          
         

        },

        error: err => {

          console.error(
            'Error actualizando pedido:',
            err
          );

        }

      });

  } else {

    this.orderService.create(data)
      .subscribe({

        next: order => {

              this.notificationService.success(
      'El pedido fue creado correctamente.'
    );
          this.cdr.detectChanges();
          this.router.navigate(['/orders', order.id]);
          

        },

        error: err => {

          console.error(
            'Error creando pedido:',
            err
          );

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

  
}