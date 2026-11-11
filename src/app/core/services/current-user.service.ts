import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  BehaviorSubject,
  Observable,
  shareReplay,
  tap
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../models/user/user';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  private readonly apiUrl = `${environment.apiUrl}/auth/me`;

  private currentUserRequest$?: Observable<User>;

  private readonly currentUserSubject =
    new BehaviorSubject<User | null>(null);

  readonly user$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {}

  getCurrentUser(): Observable<User> {

    if (!this.currentUserRequest$) {

      this.currentUserRequest$ = this.http
        .get<User>(this.apiUrl)
        .pipe(

          tap(user => {
            this.currentUserSubject.next(user);
          }),

          shareReplay(1)

        );

    }

    return this.currentUserRequest$;

  }

  refresh(): Observable<User> {

    this.currentUserRequest$ = undefined;

    return this.getCurrentUser();

  }

  clear(): void {

    this.currentUserRequest$ = undefined;

    this.currentUserSubject.next(null);

  }

}