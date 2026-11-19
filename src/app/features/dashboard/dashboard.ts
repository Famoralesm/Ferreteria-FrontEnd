
import { Component , OnInit,ChangeDetectorRef , ChangeDetectionStrategy} from '@angular/core';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { OrderSummary } from '../../core/models/order/order-summary';
import { DashboardService } from '../../core/services/dashboard.service';
import { TableModule } from 'primeng/table';
import { AsyncPipe} from '@angular/common';
import { TagModule } from 'primeng/tag';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';

import {
    catchError,
    filter,
    switchMap,
    shareReplay
} from 'rxjs/operators';

import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
   
    StatCard,
    TableModule,
    TagModule,
    AsyncPipe,
    CommonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard    {

  orders$!: Observable<OrderSummary[]>;


constructor(
    private dashboardService: DashboardService,
    private storeService: StoreService
) {

    this.orders$ = this.storeService.selectedStore$.pipe(

        filter(store => store !== null),

        switchMap(store =>

            this.dashboardService.getLatestOrders(store.id).pipe(

                catchError(err => {

                    console.error(
                        'Error cargando pedidos del dashboard:',
                        err
                    );

                    return of([] as OrderSummary[]);

                })

            )

        ),

        shareReplay({
            bufferSize: 1,
            refCount: true
        })

    );

}

  getSeverity(status: string) {

    switch (status) {

        case 'CREATED':
            return 'success';

        case 'PREPARING':
            return 'warn';

        case 'ON_THE_WAY':
            return 'info';

        case 'DELIVERED':
            return 'contrast';

        case 'CANCELLED':
            return 'danger';

        default:
            return 'secondary';
    }


}
getStatusLabel(status: string) {

    switch (status) {

        case 'CREATED':
            return 'Creado';

        case 'PREPARING':
            return 'Preparando';

        case 'ON_THE_WAY':
            return 'En reparto';

        case 'DELIVERED':
            return 'Entregado';

        case 'CANCELLED':
            return 'Cancelado';

        default:
            return status;

    }

}
}