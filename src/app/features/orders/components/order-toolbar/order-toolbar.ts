import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-order-toolbar',
  standalone: true,
  imports: [InputTextModule,
ButtonModule,
],
  templateUrl: './order-toolbar.html',
  styleUrl: './order-toolbar.scss',
})
export class OrderToolbar {

      constructor(

        private router: Router
    ){

    }




}
