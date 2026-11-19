
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Product,
  CreateProductRequest,
  UpdateProductRequest
} from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly api = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  findAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.api);
  }

  findById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.api}/${id}`);
  }

  search(query: string): Observable<Product[]> {

    const params = new HttpParams()
      .set('query', query);

    return this.http.get<Product[]>(
      `${this.api}/search`,
      { params }
    );
  }

  create(request: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.api, request);
  }

  update(
    id: number,
    request: UpdateProductRequest
  ): Observable<Product> {
    return this.http.put<Product>(
      `${this.api}/${id}`,
      request
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  uploadImage(id: number, file: File): Observable<Product> {

    const formData = new FormData();
    formData.append('file', file);

    return this.http.put<Product>(
      `${this.api}/${id}/image`,
      formData
    );
  }

  deleteImage(id: number): Observable<Product> {
    return this.http.delete<Product>(
      `${this.api}/${id}/image`
    );
  }

}
