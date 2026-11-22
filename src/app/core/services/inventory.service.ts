import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ProductStock } from '../models/inventory/product-stock';
import { InventoryMovement } from '../models/inventory/inventory-movement';
import { InventoryMovementRequest } from '../models/inventory/inventory-movement-request';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private readonly apiUrl = `${environment.apiUrl}`;
  private readonly stockChangedSubject = new Subject<void>();
  readonly stockChanged$ = this.stockChangedSubject.asObservable();

  notifyStockChanged(): void {
    this.stockChangedSubject.next();
  }

  constructor(private http: HttpClient) {}

  initializeStock(request: {
    productoId: number;
    sucursalId: number;
    stock: number;
    stockMinimo: number;
    motivo?: string;
  }): Observable<ProductStock> {
    return this.http.post<ProductStock>(
      `${this.apiUrl}/product-stocks/initialization`,
      request
    ).pipe(tap(() => this.notifyStockChanged()));
  }

  updateMinimumStock(productoId: number, sucursalId: number, stockMinimo: number): Observable<ProductStock> {
    return this.http.put<ProductStock>(
      `${this.apiUrl}/product-stocks/${productoId}/minimum`,
      { sucursalId, stockMinimo }
    ).pipe(tap(() => this.notifyStockChanged()));
  }

  getStocks(sucursalId: number): Observable<ProductStock[]> {
    const params = new HttpParams()
      .set('sucursalId', sucursalId);

    return this.http.get<ProductStock[]>(
      `${this.apiUrl}/product-stocks`,
      { params }
    );
  }

  getLowStock(sucursalId: number): Observable<ProductStock[]> {
    const params = new HttpParams()
      .set('sucursalId', sucursalId);

    return this.http.get<ProductStock[]>(
      `${this.apiUrl}/product-stocks/low-stock`,
      { params }
    );
  }

  getProductMovements(
    productoId: number,
    sucursalId: number
  ): Observable<InventoryMovement[]> {

    const params = new HttpParams()
      .set('productoId', productoId)
      .set('sucursalId', sucursalId);

    return this.http.get<InventoryMovement[]>(
      `${this.apiUrl}/inventory/movements`,
      { params }
    );
  }

  registerEntry(
    request: InventoryMovementRequest
  ): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(
      `${this.apiUrl}/inventory/entries`,
      request
    );
  }

  registerExit(
    request: InventoryMovementRequest
  ): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(
      `${this.apiUrl}/inventory/exits`,
      request
    );
  }

  registerAdjustment(
    request: InventoryMovementRequest
  ): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(
      `${this.apiUrl}/inventory/adjustments`,
      request
    );
  }

  
}