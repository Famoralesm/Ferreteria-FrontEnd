import { Component, OnInit, OnDestroy } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { CurrentUserService } from '../../../core/services/current-user.service';
import { Role } from '../../../core/enums/role';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [PanelMenuModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit, OnDestroy {

  items: MenuItem[] = [];

  private subscription?: Subscription;

  constructor(
    private currentUserService: CurrentUserService
  ) {}

  ngOnInit(): void {

    this.subscription = this.currentUserService
      .getCurrentUser()
      .subscribe({

        next: user => {

          this.items = [

            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/dashboard']
            },

            {
              label: 'Pedidos',
              icon: 'pi pi-shopping-cart',
              routerLink: ['/orders']
            },

            {
              label: 'Productos',
              icon: 'pi pi-box',
              routerLink: ['/products']
            },

            {
              label: 'Clientes',
              icon: 'pi pi-users',
              routerLink: ['/customers']
            }

          ];

          if (user.role === Role.ADMIN) {

            this.items.push({

              label: 'Usuarios',
              icon: 'pi pi-user',
              routerLink: ['/users']

            });

          }

        },

        error: err => {
          console.error('Error obteniendo usuario actual:', err);
        }

      });

  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

}