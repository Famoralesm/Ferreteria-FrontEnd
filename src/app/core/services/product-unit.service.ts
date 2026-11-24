import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductUnit, ProductUnitRequest } from '../models/product/product-unit';

@Injectable({ providedIn: 'root' })
export class ProductUnitService {
  private readonly api = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  findByProduct(productId: number): Observable<ProductUnit[]> {
    return this.http.get<ProductUnit[]>(`${this.api}/${productId}/units`);
  }

  create(productId: number, request: ProductUnitRequest): Observable<ProductUnit> {
    return this.http.post<ProductUnit>(`${this.api}/${productId}/units`, request);
  }

  update(productId: number, unitId: number, request: ProductUnitRequest): Observable<ProductUnit> {
    return this.http.put<ProductUnit>(`${this.api}/${productId}/units/${unitId}`, request);
  }

  setActive(productId: number, unitId: number, active: boolean): Observable<void> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.patch<void>(`${this.api}/${productId}/units/${unitId}/${action}`, {});
  }
}
