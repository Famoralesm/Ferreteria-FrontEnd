import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { OrderTable } from '../../components/order-table/order-table';
import { OrderToolbar } from '../../components/order-toolbar/order-toolbar';
import { OrderFilter } from '../../components/order-filter/order-filter';
import { OrderService } from '../../../../core/services/order.service';
import { OrderSummary } from '../../../../core/models/order/order-summary';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';



@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    OrderToolbar,
    OrderFilter,
    OrderTable
  ],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList implements OnInit {

  orders: OrderSummary[] = [];




  constructor(
    private orderService: OrderService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}


  ngOnInit(): void {

    this.loadOrders();



  }





  loadOrders(): void {

    this.orderService.findAll()

      .subscribe({

        next: data => {

          console.log('PEDIDOS RECIBIDOS:', data);

          this.orders = data;

          this.cdr.detectChanges();

        },

        error: err => {

          console.error(err);

        }

      });

  }


  edit(id: number): void {

    this.router.navigate(['/orders/edit', id]);

  }


  view(id: number): void {

    this.router.navigate(['/orders', id]);

  }


  delete(id: number): void {

    console.log('Eliminar', id);

  }


  print(id: number): void {

    console.log('Imprimir', id);

  }


  duplicate(id: number): void {

    console.log('Duplicar', id);

  }


 

}

