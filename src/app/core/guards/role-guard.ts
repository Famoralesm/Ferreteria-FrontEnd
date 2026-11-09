import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { CurrentUserService } from '../services/current-user.service';
import { Role } from '../enums/role';
import { map, catchError, of } from 'rxjs';

export const roleGuard = (
  allowedRoles: Role[]
): CanActivateFn => {

  return () => {

    const currentUserService = inject(CurrentUserService);
    const router = inject(Router);

    return currentUserService.getCurrentUser().pipe(

      map(user => {

        if (allowedRoles.includes(user.role)) {
          return true;
        }

        return router.createUrlTree(['/dashboard']);

      }),

      catchError(() => {

        return of(router.createUrlTree(['/login']));

      })

    );

  };

};