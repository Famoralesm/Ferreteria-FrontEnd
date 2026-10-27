import {
  Component,
  OnInit
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
    CustomerTable
  ],

  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss'
})
export class CustomerList implements OnInit {

  customers: Customer[] = [];

  constructor(
    private customerService: CustomerService,
    private router: Router
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

    if (!confirm('¿Eliminar cliente?')) {
      return;
    }

    this.customerService
      .delete(id)
      .subscribe({

        next: () => {
          this.loadCustomers();
        },

        error: err => {

          console.error(
            'Error eliminando cliente:',
            err
          );

        }

      });

  }

}