import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';

import { OrderTable } from '../../components/order-table/order-table';
import { OrderToolbar } from '../../components/order-toolbar/order-toolbar';

import { OrderService } from '../../../../core/services/order.service';
import { OrderSummary } from '../../../../core/models/order/order-summary';


interface StatusThreshold {
  yellow: number;
  orange: number;
  red: number;
}


@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    OrderToolbar,
    OrderTable
  ],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList {

  private readonly searchTerm$ = new BehaviorSubject<string>('');

  readonly filteredOrders$: Observable<OrderSummary[]>;

  private readonly statusThresholds: Record<string, StatusThreshold> = {

    CREATED: {
      yellow: 24 * 60 * 60 * 1000,
      orange: 36 * 60 * 60 * 1000,
      red: 48 * 60 * 60 * 1000
    },

    PREPARING: {
      yellow: 60 * 60 * 1000,
      orange: 90 * 60 * 1000,
      red: 120 * 60 * 1000
    },

    IN_ROUTE: {
      yellow: 3 * 60 * 60 * 1000,
      orange: 4 * 60 * 60 * 1000,
      red: 5 * 60 * 60 * 1000
    }

  };


  constructor(
    private orderService: OrderService,
    private router: Router
  ) {

    const orders$ = this.orderService.findAll().pipe(

      map(data => this.sortByUrgency(data)),

      catchError(err => {

        console.error('Error cargando pedidos:', err);

        return of([] as OrderSummary[]);

      }),

      shareReplay(1)

    );


    this.filteredOrders$ = combineLatest([

      orders$,
      this.searchTerm$

    ]).pipe(

      map(([orders, term]) =>
        this.filterOrders(orders, term)
      ),

      shareReplay(1)

    );

  }


  onSearchChange(term: string): void {

    this.searchTerm$.next(term);

  }


  private filterOrders(
    orders: OrderSummary[],
    searchTerm: string
  ): OrderSummary[] {

    const term = this.normalize(searchTerm);

    if (!term) {

      return [...orders];

    }

    return orders.filter(order => {

      const date = new Date(order.fecha);

      const formattedDate =
        Number.isNaN(date.getTime())
          ? ''
          : date.toLocaleDateString('es-CL');

      const fields = [
        order.id,
        order.cliente,
        order.fecha,
        formattedDate,
        order.total,
        order.estado
      ];

      return fields.some(value =>
        this.normalize(value).includes(term)
      );

    });

  }


  private normalize(value: unknown): string {

    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  }


  private getElapsedMs(order: OrderSummary): number {

    const timestamp = Date.parse(order.statusChangedAt ?? '');

    if (!Number.isFinite(timestamp)) {

      return 0;

    }

    return Math.max(0, Date.now() - timestamp);

  }


  private getUrgencyLevel(order: OrderSummary): number {

    const status = order.estado?.toUpperCase();

    if (
      status === 'DELIVERED' ||
      status === 'CANCELED' ||
      status === 'REJECTED'
    ) {

      return -1;

    }

    const threshold = this.statusThresholds[status];

    if (!threshold) {

      return 0;

    }

    const elapsed = this.getElapsedMs(order);

    if (elapsed >= threshold.red) {

      return 3;

    }

    if (elapsed >= threshold.orange) {

      return 2;

    }

    if (elapsed >= threshold.yellow) {

      return 1;

    }

    return 0;

  }


  private sortByUrgency(orders: OrderSummary[]): OrderSummary[] {

    return [...orders].sort((a, b) => {

      const urgencyDifference =
        this.getUrgencyLevel(b) - this.getUrgencyLevel(a);

      if (urgencyDifference !== 0) {

        return urgencyDifference;

      }

      return this.getElapsedMs(b) - this.getElapsedMs(a);

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


  newOrder(): void {

    this.router.navigate(['/orders/new']);

  }


  print(id: number): void {

    console.log('Imprimir', id);

  }


  duplicate(id: number): void {

    console.log('Duplicar', id);

  }

}