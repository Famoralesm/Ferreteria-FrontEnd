import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { Product } from '../models/product/product';
import { CreateProductRequest } from '../models/product/create-product-request';
import { UpdateProductRequest } from '../models/product/update-product-request';
import { Observable } from 'rxjs';




@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);

  private readonly API =
    `${environment.apiUrl}/products`;


  findAll() {

    return this.http.get<Product[]>(
      this.API
    );

  }


  findById(id: number) {

    return this.http.get<Product>(
      `${this.API}/${id}`
    );

  }


  create(request: CreateProductRequest) {

    return this.http.post<Product>(
      this.API,
      request
    );

  }


  update(
    id: number,
    request: UpdateProductRequest
  ) {

    return this.http.put<Product>(
      `${this.API}/${id}`,
      request
    );

  }


  patch(
    id: number,
    request: Partial<UpdateProductRequest>
  ) {

    return this.http.patch<Product>(
      `${this.API}/${id}`,
      request
    );

  }


  delete(id: number) {

    return this.http.delete(
      `${this.API}/${id}`
    );

  }

  search(query: string): Observable<Product[]> {

  return this.http.get<Product[]>(
    `${this.API}/search`,
    {
      params: {
        query
      }
    }
  );

}
  uploadImage(id: number, file: File): Observable<Product> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.put<Product>(
      `${this.API}/${id}/image`,
      formData
    );
  }

  deleteImage(id: number): Observable<Product> {
    return this.http.delete<Product>(
      `${this.API}/${id}/image`
    );
  }

}