import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { LoginRequest } from '../models/login/login-request';
import { LoginResponse } from '../models/login/login-response';

import { environment } from '../../../environments/environment';

import { TokenService } from './token.services';
import { CurrentUserService } from './current-user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService,
    private currentUserService: CurrentUserService
  ) {}

  login(request: LoginRequest): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.API}/login`,
      request
    );

  }

  logout(): void {

    this.tokenService.removeToken();

    this.currentUserService.clear();

    this.router.navigate(['/login'], {
      replaceUrl: true
    });

  }

}