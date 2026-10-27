
import { Component , OnInit,ChangeDetectorRef , ChangeDetectionStrategy} from '@angular/core';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { OrderSummary } from '../../core/models/order/order-summary';
import { DashboardService } from '../../core/services/dashboard.service';
import { TableModule } from 'primeng/table';
import { AsyncPipe} from '@angular/common';
import { TagModule } from 'primeng/tag';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
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
export class Dashboard  implements OnInit  {
  orders$!: Observable<OrderSummary[]>;


constructor(
    private dashboardService: DashboardService, 
    private cd: ChangeDetectorRef
) {

    console.log('Constructor Dashboard');

}
ngOnInit() {

    console.log('ngOnInit');

    this.orders$ = this.dashboardService.getLatestOrders();
/*     this.dashboardService.getLatestOrders()
        .subscribe(data => {

            console.log('subscribe');
            console.log(document.querySelector('p-table'));

            this.orders = data;
            this.cd.detectChanges();

        }); */



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