import {
  Component,
  OnInit, ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { CustomerTable } from '../../components/customer-table/customer-table';

import { CustomerService } from '../../../../core/services/customer.service';
import { Customer } from '../../../../core/models/customer/customer';

@Component({
  selector: 'app-customer-list',
  standalone: true,

  imports: [
    CommonModule,
    ButtonModule,
    CustomerTable,

  ],

  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss'
})
export class CustomerList implements OnInit {

  customers: Customer[] = [];
  notificationMessage = '';
  notificationType: 'success' | 'error' | '' = '';

  private notificationTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {

  const notification = history.state?.notification;

  if (
    notification?.message &&
    (notification.type === 'success' ||
     notification.type === 'error')
  ) {
    this.showNotification(
      notification.message,
      notification.type
    );
  }

  this.loadCustomers();
}

loadCustomers(): void {

  this.customerService
    .findAll()
    .subscribe({

      next: data => {

        console.log(
          'CLIENTES RECIBIDOS:',
          data
        );

        this.customers = data;

        // Actualiza la vista después de recibir los datos.
        this.cdr.detectChanges();

      },

      error: err => {

        console.error(
          'Error cargando clientes:',
          err
        );

      }

    });

}

  newCustomer(): void {

    this.router.navigate([
      '/customers/new'
    ]);

  }

  view(id: number): void {

    this.router.navigate([
      '/customers',
      id
    ]);

  }

  edit(id: number): void {

    this.router.navigate([
      '/customers/edit',
      id
    ]);

  }

delete(id: number): void {

  const customer = this.customers.find(
    item => item.id === id
  );

  if (!customer) {
    return;
  }

  if (!confirm(`¿Eliminar al cliente "${customer.nombre}"?`)) {
    return;
  }

  this.customerService.delete(id).subscribe({

    next: () => {

      this.customers = this.customers.filter(
        item => item.id !== id
      );

      this.showNotification(
        `Se ha eliminado el cliente "${customer.nombre}" con éxito.`,
        'error'
      );

      this.cdr.detectChanges();
    },

    error: err => {
      console.error('Error eliminando cliente:', err);

      this.showNotification(
        'No se pudo eliminar el cliente. Inténtalo nuevamente.',
        'error'
      );
    }

  });
}

  showNotification(
  message: string,
  type: 'success' | 'error'
  ): void {

    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }

    this.notificationMessage = message;
    this.notificationType = type;

    this.notificationTimer = setTimeout(() => {
      this.notificationMessage = '';
      this.notificationType = '';
      this.notificationTimer = undefined;

      this.cdr.detectChanges();
    }, 2000);
  }

}