import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { MainLayout } from './layout/main-layout/main-layout';
import { roleGuard } from './core/guards/role-guard';
import { Role } from './core/enums/role';
import { UserList } from './features/users/pages/user-lIst/user-list';
import { UserForm } from './features/users/pages/user-form/user-form';
import { authGuard } from './core/guards/auth-guard';
import { OrderList } from './features/orders/pages/order-list/order-list';
import { OrderDetail } from './features/orders/pages/order-detail/order-detail';
import { OrderForm } from './features/orders/pages/order-form/order-form';
import { ProductList } from './features/products/pages/product-list/product-list';
import { ProductForm } from './features/products/pages/product-form/product-form';
import { ProductUnits } from './features/products/pages/product-units/product-units';
import { CustomerList } from './features/customers/pages/customer-list/customer-list';
import { CustomerForm } from './features/customers/pages/customer-form/customer-form';
import { SupplierList } from './features/suppliers/pages/supplier-list/supplier-list';
import { Profile } from './features/profile/profile';
import { InitialStock } from './features/inventory/pages/initial-stock/initial-stock';
import { SupplierPriceComparison } from './features/suppliers/pages/supplier-price-comparison/supplier-price-comparison';
import { PurchaseList } from './features/purchases/pages/purchase-list/purchase-list';
import { PurchaseDetail } from './features/purchases/pages/purchase-detail/purchase-detail';
import { PurchaseForm } from './features/purchases/pages/purchase-form/purchase-form';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      // Pedidos
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
      },
      // Compras
      {
        path: 'purchases',
        component: PurchaseList,
        canActivate: [roleGuard([Role.ADMIN, Role.SELLER])]
      },
      {
        path: 'purchases/new',
        component: PurchaseForm,
        canActivate: [roleGuard([Role.ADMIN, Role.SELLER])]
      },
      {
        path: 'purchases/:id/edit',
        component: PurchaseForm,
        canActivate: [roleGuard([Role.ADMIN, Role.SELLER])]
      },
      {
        path: 'purchases/:id',
        component: PurchaseDetail,
        canActivate: [roleGuard([Role.ADMIN, Role.SELLER])]
      },
      // Productos
      {
        path: 'products',
        component: ProductList
      },
      {
        path: 'products/units',
        component: ProductUnits,
        canActivate: [roleGuard([Role.ADMIN])]
      },
      {
        path: 'products/new',
        component: ProductForm
      },
      {
        path: 'products/view/:id',
        component: ProductForm
      },
      {
        path: 'products/:id',
        component: ProductForm
      },
      {
        path: 'products/edit/:id',
        component: ProductForm
      },
      {
        path: 'products/:id/suppliers',
        component: SupplierPriceComparison,
        canActivate: [roleGuard([Role.ADMIN])]
      },
      // Clientes
      {
        path: 'customers',
        component: CustomerList
      },
      {
        path: 'customers/new',
        component: CustomerForm
      },
      {
        path: 'customers/:id',
        component: CustomerForm
      },
      {
        path: 'customers/edit/:id',
        component: CustomerForm
      },
      // Proveedores
      {
        path: 'suppliers',
        component: SupplierList,
        canActivate: [roleGuard([Role.ADMIN])]
      },
      // Inventario inicial
      {
        path: 'inventory/initial-stock',
        component: InitialStock,
        canActivate: [roleGuard([Role.ADMIN])]
      },
      // Usuarios
      {
        path: 'users',
        component: UserList,
        canActivate: [roleGuard([Role.ADMIN])]
      },
      {
        path: 'users/new',
        component: UserForm,
        canActivate: [roleGuard([Role.ADMIN])]
      },
      {
        path: 'users/edit/:id',
        component: UserForm,
        canActivate: [roleGuard([Role.ADMIN])]
      },
      {
        path: 'profile',
        component: Profile
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
