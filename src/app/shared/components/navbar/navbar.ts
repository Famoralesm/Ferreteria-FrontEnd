import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Observable, catchError, of } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';

import { MenuItem } from 'primeng/api';

import { User } from '../../../core/models/user/user';
import { Role } from '../../../core/enums/role';

import { CurrentUserService } from '../../../core/services/current-user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    AvatarModule,
    BadgeModule,
    MenuModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {

  readonly currentUser$: Observable<User | null>;

  readonly profileItems: MenuItem[];

  constructor(
    currentUserService: CurrentUserService,
    private authService: AuthService
  ) {

    this.currentUser$ = currentUserService
      .getCurrentUser()
      .pipe(
        catchError(err => {

          console.error('Error obteniendo usuario para navbar:', err);

          return of(null);

        })
      );

    this.profileItems = [

      {
        label: 'Mi perfil',
        icon: 'pi pi-user-edit',
        routerLink: ['/profile']
      },

      {
        separator: true
      },

      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => this.authService.logout()
      }

    ];

  }

  initials(name: string): string {

    return String(name ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');

  }

  roleLabel(role: Role): string {

    const labels: Record<Role, string> = {

      [Role.ADMIN]: 'Administrador',
      [Role.SELLER]: 'Vendedor',
      [Role.DELIVERY]: 'Despacho'

    };

    return labels[role] ?? role;

  }

}