import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Dashboard,
  DashboardOrderStatus,
  DashboardProductStatus
} from '../models/dashboard';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/dashboard`;

  getDashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(this.api);
  }

  getOrdersByStatus(
    storeId: number,
    from: string,
    to: string
  ): Observable<DashboardOrderStatus> {
    return this.http.get<DashboardOrderStatus>(
      `${this.api}/orders-by-status`,
      { params: { storeId, from, to } }
    );
  }

  getProductStatus(storeId: number): Observable<DashboardProductStatus> {
    return this.http.get<DashboardProductStatus>(
      `${this.api}/products-status`,
      { params: { storeId } }
    );
  }
}
