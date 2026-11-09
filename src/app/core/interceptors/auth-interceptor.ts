import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);

  const isLoginRequest = req.url.includes('/api/auth/login');

  const token = isLoginRequest
    ? null
    : localStorage.getItem('access_token');

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(

    catchError(error => {

      if (error.status === 401 && !isLoginRequest) {

        console.warn('Sesión no válida o expirada');

        localStorage.removeItem('access_token');

        router.navigate(['/login']);

      } else if (error.status === 403) {

        console.warn(
          'Acceso denegado: el usuario no tiene permisos.'
        );

      }

      return throwError(() => error);

    })

  );

};