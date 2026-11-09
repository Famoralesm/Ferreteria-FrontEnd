import {
  Component,
  OnInit, ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { CustomerTable } from '../../components/customer-table/customer-table';
import { NotificationService } from '../../../../core/services/notification.service';
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
  

  constructor(
    private notificationService: NotificationService,
    private customerService: CustomerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {

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

    this.notificationService.success(
      `Se ha eliminado el cliente "${customer.nombre}" con éxito.`
    );

      this.cdr.detectChanges();
    },

    error: err => {
      console.error('Error eliminando cliente:', err);
      
      this.notificationService.error(
        'No se pudo eliminar el cliente. Inténtalo nuevamente.'
      );
    }

  });
}



}