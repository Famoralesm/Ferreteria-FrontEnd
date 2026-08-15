import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-order-toolbar',
  standalone: true,
  imports: [InputTextModule,
ButtonModule,
RouterLink],
  templateUrl: './order-toolbar.html',
  styleUrl: './order-toolbar.scss',
})
export class OrderToolbar {

      constructor(

        private router: Router
    ){

    }


  newOrder(){

    this.router.navigate(['/orders/new']);

}

}
