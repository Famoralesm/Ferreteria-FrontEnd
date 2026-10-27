import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Comuna } from '../models/lists/comuna';
import { CreateCustomerRequest } from '../models/customer/create-customer-request';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComunaService {

  private readonly apiUrl =
    `${environment.apiUrl}/comunas`;

  constructor(
    private http: HttpClient
  ) {}

  findAll(): Observable<Comuna[]> {

    return this.http.get<Comuna[]>(
      this.apiUrl
    );
  }

  findById(id: number): Observable<Comuna> {

    return this.http.get<Comuna>(
      `${this.apiUrl}/${id}`
    );
  }



  
}