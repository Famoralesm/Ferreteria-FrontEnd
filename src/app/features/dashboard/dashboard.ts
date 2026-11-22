import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { OrderSummary } from '../../core/models/order/order-summary';
import { Dashboard } from '../../core/models/dashboard';
import { DashboardService } from '../../core/services/dashboard.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { StoreService } from '../../core/services/store.service';

interface OrderStatusMetric {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface OrderStatusSummary {
  total: number;
  gradient: string;
  metrics: OrderStatusMetric[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCard, TableModule, TagModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  readonly dashboard$: Observable<Dashboard>;
  readonly orders$: Observable<OrderSummary[]>;
  readonly allOrders$: Observable<OrderSummary[]>;
  readonly orderStatusSummary$: Observable<OrderStatusSummary>;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly storeService: StoreService
  ) {
    this.dashboard$ = this.dashboardService.getDashboard().pipe(
      catchError(error => {
        console.error('Error cargando indicadores del dashboard:', error);
        return of({
          ventasHoy: 0,
          pedidosPendientes: 0,
          clientes: 0,
          productos: 0
        });
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const selectedStoreOrders$ = this.storeService.selectedStore$.pipe(
      filter(store => store !== null),
      switchMap(store => this.dashboardService.getLatestOrders(store.id).pipe(
        catchError(error => {
          console.error('Error cargando últimos pedidos:', error);
          return of([] as OrderSummary[]);
        })
      )),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.orders$ = selectedStoreOrders$;

    this.allOrders$ = this.storeService.selectedStore$.pipe(
      filter(store => store !== null),
      switchMap(store => this.dashboardService.getAllOrders(store.id).pipe(
        catchError(error => {
          console.error('Error cargando pedidos para el resumen:', error);
          return of([] as OrderSummary[]);
        })
      )),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.orderStatusSummary$ = this.allOrders$.pipe(
      map(orders => this.buildOrderStatusSummary(orders))
    );
  }

  private buildOrderStatusSummary(orders: OrderSummary[]): OrderStatusSummary {
    const definitions = [
      { status: 'CREATED', label: 'Creados', color: '#64748b' },
      { status: 'PREPARING', label: 'Preparando', color: '#d97706' },
      { status: 'IN_ROUTE', label: 'En ruta', color: '#2563eb' },
      { status: 'DELIVERED', label: 'Entregados', color: '#16a34a' },
      { status: 'REJECTED', label: 'Rechazados', color: '#dc2626' },
      { status: 'CANCELED', label: 'Cancelados', color: '#9ca3af' }
    ];
    const total = orders.length;
    let accumulated = 0;
    const metrics = definitions.map(definition => {
      const count = orders.filter(order => order.estado === definition.status).length;
      const percentage = total > 0 ? count / total * 100 : 0;
      const start = accumulated;
      accumulated += percentage;
      return { ...definition, count, percentage, start, end: accumulated };
    });
    const visible = metrics.filter(metric => metric.count > 0);
    const gradient = total === 0
      ? 'conic-gradient(#e5e7eb 0% 100%)'
      : `conic-gradient(${visible.map(metric => `${metric.color} ${metric.start}% ${metric.end}%`).join(', ')})`;
    return { total, gradient, metrics: visible };
  }

  getSeverity(status: string) {
    switch (status) {
      case 'CREATED': return 'secondary';
      case 'PREPARING': return 'warn';
      case 'IN_ROUTE': return 'info';
      case 'DELIVERED': return 'success';
      case 'REJECTED':
      case 'CANCELED': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string) {
    switch (status) {
      case 'CREATED': return 'Creado';
      case 'PREPARING': return 'Preparando';
      case 'IN_ROUTE': return 'En ruta';
      case 'DELIVERED': return 'Entregado';
      case 'REJECTED': return 'Rechazado';
      case 'CANCELED': return 'Cancelado';
      default: return status;
    }
  }
}
