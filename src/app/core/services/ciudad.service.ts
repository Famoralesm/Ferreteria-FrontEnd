import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Ciudad } from '../models/lists/ciudad';
import { CreateCustomerRequest } from '../models/customer/create-customer-request';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CiudadService {

  private readonly apiUrl =
    `${environment.apiUrl}/ciudades`;

  constructor(
    private http: HttpClient
  ) {}

  findAll(): Observable<Ciudad[]> {

    return this.http.get<Ciudad[]>(
      this.apiUrl
    );
  }

  findById(id: number): Observable<Ciudad> {

    return this.http.get<Ciudad>(
      `${this.apiUrl}/${id}`
    );
  }



  
}