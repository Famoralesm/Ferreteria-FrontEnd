import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Observable, catchError, of } from 'rxjs';

import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem } from 'primeng/api';

import { User } from '../../../core/models/user/user';
import { Role } from '../../../core/enums/role';

import { CurrentUserService } from '../../../core/services/current-user.service';
import { AuthService } from '../../../core/services/auth.service';
import { StoreService } from '../../../core/services/store.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '../../../core/models/store/store';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AvatarModule,
    BadgeModule,
    MenuModule,
    SelectModule,
    InputTextModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {

  readonly currentUser$: Observable<User | null>;

  profileItems: MenuItem[] = [];

  stores: Store[] = [];
  selectedStore: Store | null = null;
  loadingStores = false;

  isEditingOrder = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    currentUserService: CurrentUserService,
    private authService: AuthService,
    private storeService: StoreService,
    private router: Router
  ) {

    this.currentUser$ = currentUserService.user$;

    currentUserService.getCurrentUser()
      .pipe(
        catchError(err => {
          console.error(
            'Error obteniendo usuario para navbar:',
            err
          );

          return of(null);
        })
      )
      .subscribe(user => {

        if (!user) {
          return;
        }

        this.profileItems = [
          {
            label: `Cargo: ${this.roleLabel(user.role)}`,
            icon: 'pi pi-id-card',
            disabled: true
          },
          {
            separator: true
          },
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

      });
  }

  ngOnInit(): void {

    this.loadStores();

    this.storeService.selectedStore$.subscribe(store => {
      this.selectedStore = store;
    });
    this.updateOrderEditLock();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd =>
          event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateOrderEditLock();
      });

  }

  loadStores(): void {

    this.loadingStores = true;

    this.storeService.findActive().subscribe({

      next: stores => {
        this.stores = stores;
        this.loadingStores = false;
      },

      error: error => {
        console.error('Error al cargar sucursales:', error);
        this.loadingStores = false;
      }

    });

  }

  onStoreChange(store: Store | null): void {

    if (!store) {
      return;
    }

    this.storeService.setSelectedStore(store);

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

  avatarImage(url?: string | null): string | undefined {

    if (!url) {
      return undefined;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const backendOrigin = environment.apiUrl
      .replace(/\/api\/?$/, '');

    return `${backendOrigin}${url.startsWith('/') ? url : `/${url}`}`;

  }
  private updateOrderEditLock(): void {
  this.isEditingOrder =
    /^\/orders\/edit\/\d+/.test(this.router.url);
}

}