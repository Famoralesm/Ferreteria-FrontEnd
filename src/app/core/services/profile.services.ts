import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../models/user/user';

export interface UpdateMyProfileRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private readonly apiUrl = `${environment.apiUrl}/auth/me`;

  constructor(private http: HttpClient) {}

  updateProfile(request: UpdateMyProfileRequest): Observable<User> {

    return this.http.put<User>(
      `${this.apiUrl}/profile`,
      request
    );

  }

  uploadAvatar(file: File): Observable<User> {

    const formData = new FormData();

    formData.append('file', file);

    return this.http.put<User>(
      `${this.apiUrl}/avatar`,
      formData
    );

  }

  deleteAvatar(): Observable<User> {

    return this.http.delete<User>(
      `${this.apiUrl}/avatar`
    );

  }

}