import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import {
  Dashboard as DashboardData,
  DashboardOrderStatus,
  DashboardProductStatus
} from '../../core/models/dashboard';
import { DashboardService } from '../../core/services/dashboard.service';
import { StoreService } from '../../core/services/store.service';

interface ChartMetric {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  start: number;
  end: number;
}

interface ChartSummary {
  total: number;
  gradient: string;
  metrics: ChartMetric[];
  centerLabel: string;
}

interface DashboardCharts {
  yesterday: ChartSummary;
  today: ChartSummary;
  products: ChartSummary;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCard, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  readonly dashboard$: Observable<DashboardData>;
  readonly charts$: Observable<DashboardCharts>;

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

    this.charts$ = this.storeService.selectedStore$.pipe(
      filter(store => store !== null),
      switchMap(store => {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        return forkJoin({
          yesterday: this.dashboardService.getOrdersByStatus(
            store.id,
            this.toLocalDateTime(yesterdayStart),
            this.toLocalDateTime(todayStart)
          ),
          today: this.dashboardService.getOrdersByStatus(
            store.id,
            this.toLocalDateTime(todayStart),
            this.toLocalDateTime(now)
          ),
          products: this.dashboardService.getProductStatus(store.id)
        }).pipe(
          map(data => ({
            yesterday: this.buildOrderChart(data.yesterday),
            today: this.buildOrderChart(data.today),
            products: this.buildProductChart(data.products)
          })),
          catchError(error => {
            console.error('Error cargando gráficos del dashboard:', error);
            return of(this.emptyCharts());
          })
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private toLocalDateTime(value: Date): string {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` +
      `T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  private buildOrderChart(data: DashboardOrderStatus): ChartSummary {
    return this.buildChart(data.total, 'Pedidos', [
      { status: 'CREATED', label: 'Creados', count: data.created, color: '#64748b' },
      { status: 'PREPARING', label: 'Preparando', count: data.preparing, color: '#d97706' },
      { status: 'IN_ROUTE', label: 'En ruta', count: data.inRoute, color: '#2563eb' },
      { status: 'DELIVERED', label: 'Entregados', count: data.delivered, color: '#16a34a' },
      { status: 'REJECTED', label: 'Rechazados', count: data.rejected, color: '#dc2626' },
      { status: 'CANCELED', label: 'Cancelados', count: data.canceled, color: '#9ca3af' }
    ]);
  }

  private buildProductChart(data: DashboardProductStatus): ChartSummary {
    return this.buildChart(data.total, 'Productos', [
      { status: 'ACTIVE', label: 'Activos (stock normal)', count: data.active, color: '#16a34a' },
      { status: 'LOW_STOCK', label: 'Stock bajo', count: data.lowStock, color: '#d97706' },
      { status: 'INACTIVE', label: 'Inactivos', count: data.inactive, color: '#94a3b8' }
    ]);
  }

  private buildChart(
    total: number,
    centerLabel: string,
    definitions: Array<{ status: string; label: string; count: number; color: string }>
  ): ChartSummary {
    let accumulated = 0;
    const metrics = definitions.map(definition => {
      const percentage = total > 0 ? definition.count / total * 100 : 0;
      const start = accumulated;
      accumulated += percentage;
      return { ...definition, percentage, start, end: accumulated };
    });
    const visible = metrics.filter(metric => metric.count > 0);
    const gradient = total === 0
      ? 'conic-gradient(#e5e7eb 0% 100%)'
      : `conic-gradient(${visible.map(metric =>
          `${metric.color} ${metric.start}% ${metric.end}%`
        ).join(', ')})`;

    return { total, gradient, metrics: visible, centerLabel };
  }

  private emptyCharts(): DashboardCharts {
    const empty = this.buildChart(0, 'Sin datos', []);
    return { yesterday: empty, today: empty, products: empty };
  }
}
