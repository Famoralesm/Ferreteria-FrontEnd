
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, filter, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';

import { ProductTable } from '../../components/product-table/product-table';

import { ProductService } from '../../../../core/services/product.service';
import { StoreService } from '../../../../core/services/store.service';

import { Product } from '../../../../core/models/product/product';
import { Store } from '../../../../core/models/store/store';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-product-list',
  standalone: true,

  imports: [
    CommonModule,
    ButtonModule,
    ProductTable
  ],

  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit, OnDestroy {

  products: Product[] = [];

  selectedStore: Store | null = null;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private storeService: StoreService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {

    this.storeService.selectedStore$
      .pipe(
        filter((store): store is Store => store !== null),

        switchMap(store => {
          this.selectedStore = store;
          this.loading = true;
          this.products = [];

          return this.productService.findAll(store.id);
        }),

        takeUntil(this.destroy$)
      )
      .subscribe({

        next: data => {
          this.products = data;
          this.loading = false;
          this.cdr.detectChanges();
        },

        error: err => {
          console.error('Error cargando productos:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }

      });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    const storeId = this.storeService.selectedStoreId;

    if (storeId === null) {
      return;
    }

    this.productService.findAll(storeId).subscribe({
      next: data => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error cargando productos:', err);
      }
    });
  }

  newProduct(): void {
    this.router.navigate(['/products/new']);
  }

  edit(id: number): void {
    this.router.navigate(['/products/edit', id]);
  }

  view(id: number): void {
    this.router.navigate(['/products', id]);
  }

  delete(id: number): void {

    if (!confirm('¿Eliminar producto?')) {
      return;
    }

    this.productService.delete(id).subscribe({

      next: () => {
        this.loadProducts();
      },

      error: err => {
        console.error('Error eliminando producto:', err);
      }

    });

  }

  changeProductStatus(event: {
      id: number;
      active: boolean;
  }): void {

    this.productService.patch(event.id, {
      active: event.active
    }).subscribe({

      next: () => {

        this.products = this.products.map(product =>
          product.id === event.id
            ? { ...product, active: event.active }
            : product
        );

        this.cdr.detectChanges();

      },

      error: err => {

        console.error('Error cambiando estado:', err);

        this.notificationService.error(
          'No fue posible cambiar el estado del producto.'
        );

        this.loadProducts();

      }

    });

  }
}
