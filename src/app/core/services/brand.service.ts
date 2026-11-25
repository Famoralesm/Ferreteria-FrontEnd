import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Brand } from '../models/product/brand';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly api = `${environment.apiUrl}/brands`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.api);
  }

  create(name: string): Observable<Brand> {
    return this.http.post<Brand>(this.api, { name });
  }
}
