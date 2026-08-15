import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';

import { MainLayout } from './layout/main-layout/main-layout';

import { authGuard } from './core/guards/auth-guard';
import { OrderList } from './features/orders/pages/order-list/order-list';
import { OrderDetail } from './features/orders/pages/order-detail/order-detail';
import { OrderForm } from './features/orders/pages/order-form/order-form'; 
import { ProductList } from './features/products/pages/product-list/product-list';
import { ProductForm } from './features/products/pages/product-form/product-form';

export const routes: Routes = [

    {
        path:'login',
        component:LoginComponent
    },

    {

        path:'',
        component:MainLayout,
        canActivate:[authGuard],

        children:[
                    {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
            },

            {

                path:'dashboard',
                component:Dashboard

            } ,
            //Pedidos
            {
                path: 'orders',
                component: OrderList
            },
            {
                path: 'orders/new',
                component: OrderForm
            },
            {
                path: 'orders/:id',
                component: OrderDetail
            },
            {
                path: 'orders/edit/:id',
                component: OrderForm
            } 
            //Productos 
            ,
            {
            path: 'products',
            component: ProductList
            },

            {
            path: 'products/new',
            component: ProductForm
            },

            {
            path: 'products/:id',
            component: ProductForm
            },

            {
            path: 'products/edit/:id',
            component: ProductForm
            }

        ]

    },

            {

                path:'**',
                redirectTo:'login'

            }

];