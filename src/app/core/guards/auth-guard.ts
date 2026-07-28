import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { TokenService } from '../services/token.services';

export const authGuard: CanActivateFn = (route, state) => {

  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isLogged()) {
    return true;
  }

  return router.createUrlTree(['/login']);

};