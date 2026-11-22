import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Supplier } from '../models/supplier/supplier';
import {
  ProductSupplier,
  ProductSupplierRequest
} from '../models/supplier/product-supplier';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  private readonly apiUrl = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl);
  }

  findById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  create(request: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, request);
  }

  update(
    id: number,
    request: Partial<Supplier>
  ): Observable<Supplier> {
    return this.http.put<Supplier>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getProductSuppliers(productId: number): Observable<ProductSupplier[]> {
    return this.http.get<ProductSupplier[]>(
      `${this.apiUrl}/products/${productId}`
    );
  }

  getSupplierProducts(supplierId: number): Observable<ProductSupplier[]> {
    return this.http.get<ProductSupplier[]>(
      `${this.apiUrl}/${supplierId}/products`
    );
  }

  associateSupplier(
    productId: number,
    request: ProductSupplierRequest
  ): Observable<ProductSupplier> {
    return this.http.post<ProductSupplier>(
      `${this.apiUrl}/${productId}/`,
      request
    );
  }

  selectSupplier(
    productId: number,
    productSupplierId: number
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${productId}/suppliers/${productSupplierId}/select`,
      {}
    );
  }
}