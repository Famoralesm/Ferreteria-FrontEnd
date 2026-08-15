import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Dashboard } from '../models/dashboard';
import { environment } from './../../../environments/environment';
import { OrderSummary } from '../models/order-summary';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private http = inject(HttpClient);

  private readonly API =
      `${environment.apiUrl}/dashboard`;

  getDashboard(): Observable<Dashboard>{

      return this.http.get<Dashboard>(this.API);

  }
  getLatestOrders(){

   return this.http.get<OrderSummary[]>(
      `${environment.apiUrl}/orders/latest`
   );

}

}