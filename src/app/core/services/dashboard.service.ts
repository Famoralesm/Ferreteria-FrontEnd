import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dashboard } from '../models/dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly API =
    'http://localhost:8080/api/dashboard';

  constructor(
    private http: HttpClient
  ) {}

  getDashboard(): Observable<Dashboard>{

      return this.http.get<Dashboard>(this.API);

  }

}