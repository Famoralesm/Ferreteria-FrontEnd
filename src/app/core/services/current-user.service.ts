import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../models/user/user';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  private readonly apiUrl = `${environment.apiUrl}/auth/me`;

  private currentUser$?: Observable<User>;

  constructor(
    private http: HttpClient
  ) {}

  getCurrentUser(): Observable<User> {

    if (!this.currentUser$) {

      this.currentUser$ = this.http.get<User>(
        this.apiUrl
      ).pipe(
        shareReplay(1)
      );

    }

    return this.currentUser$;

  }

  clear(): void {

    this.currentUser$ = undefined;

  }

  refresh(): Observable<User> {

  this.currentUser$ = undefined;

  return this.getCurrentUser();

}

}