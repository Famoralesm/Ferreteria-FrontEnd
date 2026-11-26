import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Purchase, PurchaseRequest } from '../models/purchase/purchase';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly api = `${environment.apiUrl}/purchases`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(this.api);
  }

  findById(id: number): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.api}/${id}`);
  }

  create(request: PurchaseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(this.api, request);
  }

  receive(id: number): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.api}/${id}/receive`, {});
  }
}