import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';

import { Observable, catchError, map, of } from 'rxjs';

import { CurrentUserService } from '../../../core/services/current-user.service';
import { Role } from '../../../core/enums/role';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    AsyncPipe,
    PanelMenuModule,
    RouterModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  readonly items$: Observable<MenuItem[]>;

  constructor(
    currentUserService: CurrentUserService
  ) {

    this.items$ = currentUserService
      .getCurrentUser()
      .pipe(

        map(user => {

          const items: MenuItem[] = [

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

            items.push({

              label: 'Usuarios',
              icon: 'pi pi-user',
              routerLink: ['/users']

            });

          }

          return items;

        }),

        catchError(err => {

          console.error(
            'Error obteniendo usuario actual:',
            err
          );

          return of([] as MenuItem[]);

        })

      );

  }

}