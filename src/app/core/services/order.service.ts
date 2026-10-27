import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../../environments/environment';
import { OrderSummary } from '../models/order/order-summary';

import { Order } from '../models/order/order';
import { CreateOrderRequest } from '../models/order/create-order-request';
import { UpdateOrderRequest } from '../models/order/update-order-request';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private readonly API =
      `${environment.apiUrl}/orders`;

findAll(){

    return this.http.get<OrderSummary[]>(this.API+"/all");

}

findById(id:number){

    return this.http.get<Order>(
        `${this.API}/${id}`
    );

}

create(request:CreateOrderRequest){

    return this.http.post<Order>(
        this.API,
        request
    );

}

update(id:number,request:UpdateOrderRequest){

    return this.http.put<Order>(
        `${this.API}/${id}`,
        request
    );

}

delete(id:number){

    return this.http.delete(
        `${this.API}/${id}`
    );

}
latest(){

    return this.http.get<OrderSummary[]>(
        `${this.API}/latest`
    );

}

}

