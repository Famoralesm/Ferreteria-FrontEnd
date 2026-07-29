import { Component } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [PanelMenuModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  items: MenuItem[] = [

    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: ['/dashboard']
    },

    {
      label: 'Productos',
      icon: 'pi pi-box',
      items: [

        {
            label:'Listado',
            icon:'pi pi-list',
            routerLink:'/products'
        },

        {
            label:'Nuevo',
            icon:'pi pi-plus',
            routerLink:'/products/new'
        }

      ]
    },

    {
      label: 'Pedidos',
      icon: 'pi pi-shopping-cart',
      items: [

        {
          label: 'Pendientes',
          icon: 'pi pi-clock'
        },

        {
          label: 'Historial',
          icon: 'pi pi-history'
        }

      ]
    },

    {
      label:'Clientes',
      icon:'pi pi-users',
      routerLink:['/clientes']
    },

    {
      label: 'Proveedores',
      icon: 'pi pi-truck',
      routerLink:['/proveedores']
    },

    {
      label: 'Reportes',
      icon: 'pi pi-chart-line',
      routerLink:['/reportes']
    },

    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      routerLink:['/configuracion']
    }

  ];

}