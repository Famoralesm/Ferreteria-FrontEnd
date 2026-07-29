import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';

import { MainLayout } from './layout/main-layout/main-layout';

import { authGuard } from './core/guards/auth-guard';

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

                path:'dashboard',
                component:Dashboard

            }

        ]

    },

    {

        path:'**',
        redirectTo:'login'

    }

];