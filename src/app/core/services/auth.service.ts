import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private api = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

    login(request: LoginRequest): Observable<LoginResponse> {

        return this.http.post<LoginResponse>(
        `${this.api}/login`,
        request
        );

    }
  /*   saveToken(token: string): void {

        localStorage.setItem("token", token);

    }

    getToken(): string |null {

        return localStorage.getItem("token");

    }

    logout(): void {

        localStorage.removeItem("token");

    }
 
    isAuthenticated(): boolean {

        return this.getToken() != null;

    } */

}