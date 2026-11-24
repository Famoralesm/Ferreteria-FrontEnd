import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UnitOfMeasure, UnitOfMeasureRequest } from '../models/product/unit-of-measure';

@Injectable({ providedIn: 'root' })
export class UnitOfMeasureService {
  private readonly api = `${environment.apiUrl}/units-of-measure`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<UnitOfMeasure[]> {
    return this.http.get<UnitOfMeasure[]>(this.api);
  }

  create(request: UnitOfMeasureRequest): Observable<UnitOfMeasure> {
    return this.http.post<UnitOfMeasure>(this.api, request);
  }

  update(id: number, request: UnitOfMeasureRequest): Observable<UnitOfMeasure> {
    return this.http.put<UnitOfMeasure>(`${this.api}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  setActive(id: number, active: boolean): Observable<UnitOfMeasure> {
    return this.http.patch<UnitOfMeasure>(`${this.api}/${id}/active?active=${active}`, {});
  }
}