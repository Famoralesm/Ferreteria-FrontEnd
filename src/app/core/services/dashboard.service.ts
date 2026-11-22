import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dashboard } from '../models/dashboard';
import { environment } from '../../../environments/environment';
import { OrderSummary } from '../models/order/order-summary';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/dashboard`;

  getDashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(this.api);
  }

  getLatestOrders(storeId: number): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(
      `${environment.apiUrl}/orders/latest`,
      { params: { storeId } }
    );
  }

  getAllOrders(storeId: number): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(
      `${environment.apiUrl}/orders/all`,
      { params: { storeId } }
    );
  }
}
