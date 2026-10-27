import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { LoginRequest } from './../models/login/login-request';
import { LoginResponse } from './../models/login/login-response';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

private readonly API =  `${environment.apiUrl}/auth`;
  constructor(private http: HttpClient) {}

    login(request: LoginRequest): Observable<LoginResponse> {

        return this.http.post<LoginResponse>(
        `${this.API}/login`,
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