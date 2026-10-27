import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Customer } from '../models/customer/customer';
import { CreateCustomerRequest } from '../models/customer/create-customer-request';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private readonly apiUrl =
    `${environment.apiUrl}/customers`;

  constructor(
    private http: HttpClient
  ) {}

  findAll(): Observable<Customer[]> {

    return this.http.get<Customer[]>(
      this.apiUrl
    );
  }

  findById(id: number): Observable<Customer> {

    return this.http.get<Customer>(
      `${this.apiUrl}/${id}`
    );
  }

  create(
    request: CreateCustomerRequest
  ): Observable<Customer> {

    return this.http.post<Customer>(
      this.apiUrl,
      request
    );
  }

  delete(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}