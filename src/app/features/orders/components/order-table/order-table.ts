import { Component, OnDestroy,OnInit ,  ChangeDetectorRef} from '@angular/core';
import { Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { OrderSummary } from '../../../../core/models/order-summary';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CurrencyPipe, DatePipe,CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';



type StatusColor = 'green' | 'yellow' | 'orange' | 'red';

interface StatusThreshold {
  yellow: number;
  orange: number;
  red: number;
}

@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [    
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    CurrencyPipe,
    DatePipe],
  templateUrl: './order-table.html',
  styleUrl: './order-table.scss',
})
export class OrderTable implements OnInit, OnDestroy{
  
    private timerSubscription?: Subscription;



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
    
    private cdr: ChangeDetectorRef,

  ) {}
    ngOnInit(): void {
 
  
      this.timerSubscription =
        interval(1000).subscribe(() => {
  
          this.cdr.detectChanges();
  
        });
  
    }
  
  
    ngOnDestroy(): void {
  
      this.timerSubscription?.unsubscribe();
  
    }

  @Input()
  orders: OrderSummary[] = [];

  @Output()
  edit = new EventEmitter<number>();

  @Output()
  delete = new EventEmitter<number>();

  @Output()
  view = new EventEmitter<number>();

  @Output()
  print = new EventEmitter<number>();

  @Output()
  duplicate = new EventEmitter<number>();


   getStatusColor(order: OrderSummary): StatusColor {

    if (order.estado === 'DELIVERED') {

      return 'green';

    }

    if (order.estado === 'CANCELED') {

      return 'red';

    }

    if (!order.statusChangedAt) {

      return 'green';

    }

    const elapsed =
      Date.now() -
      new Date(order.statusChangedAt).getTime();

    const threshold =
      this.statusThresholds[order.estado];

    if (!threshold) {

      return 'green';

    }

    if (elapsed >= threshold.red) {

      return 'red';

    }

    if (elapsed >= threshold.orange) {

      return 'orange';

    }

    if (elapsed >= threshold.yellow) {

      return 'yellow';

    }

    return 'green';

  }


  getElapsedTime(order: OrderSummary): string {

    if (
      order.estado === 'DELIVERED' ||
      order.estado === 'CANCELED'
    ) {

      return '';

    }

    if (!order.statusChangedAt) {

      return '00:00:00';

    }

    const elapsed =
      Math.max(
        0,
        Date.now() -
        new Date(order.statusChangedAt).getTime()
      );

    const totalSeconds =
      Math.floor(elapsed / 1000);

    const days =
      Math.floor(totalSeconds / 86400);

    const hours =
      Math.floor(
        (totalSeconds % 86400) / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const seconds =
      totalSeconds % 60;


    if (days > 0) {

      return `${days}d ${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;

    }

    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;

  }


  private pad(value: number): string {

    return value
      .toString()
      .padStart(2, '0');

  }

}
