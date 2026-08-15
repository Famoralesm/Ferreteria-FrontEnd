import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';

import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    SelectModule
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
})
export class OrderForm implements OnInit , OnDestroy {

  id?: number;

  form!: FormGroup;

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

      /*
      * Formato típico:
      *
      * https://www.google.com/maps/@-33.520..., -70.600...,17z
      */

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




  constructor() {

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
      status: [{ value: '', disabled: true }],

      // Información de auditoría
      orderNumber: [{ value: '', disabled: true }],
      createdAt: [{ value: '', disabled: true }],
      createdBy: [{ value: '', disabled: true }],
      updated_at: [{ value: '', disabled: true }],
      totalAmount: [{ value: '', disabled: true }],
  


    });

  }

  ngOnInit(): void {

    this.id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (this.id) {
      this.loadOrder(this.id);
      this.updateElapsedTime();
      this.startTimer();
    }

  }
  ngOnDestroy(): void {

    this.timerSubscription?.unsubscribe();

  }

 

  loadOrder(id: number): void {

    this.orderService.findById(id)
      .subscribe({

        next: order => {

          console.log('Pedido:', order);

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
            statusChangedAt : order.statusChangedAt


          });
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

    /*
     * getRawValue() incluye también los campos disabled.
     *
     * Pero NO queremos enviar los campos de solo lectura
     * al backend para actualizar.
     */

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
      status: formValue.status

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

  private startTimer(): void {

  this.timerSubscription?.unsubscribe();

  this.timerSubscription = interval(1000)
    .subscribe(() => {

      this.updateElapsedTime();

    });

}

private updateElapsedTime(): void {

  if (!this.statusChangedAt) {
    this.elapsedTime = '00:00:00';
    return;
  }

  const start = new Date(this.statusChangedAt).getTime();
  const now = Date.now();

  const difference = Math.max(0, now - start);

  const totalSeconds = Math.floor(difference / 1000);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

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
}