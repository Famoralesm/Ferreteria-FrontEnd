import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ProductTable } from '../../components/product-table/product-table';

import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product/product';

@Component({
  selector: 'app-product-list',
  standalone: true,

  imports: [
    CommonModule,
    ProductTable
  ],

  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {

  products: Product[] = [];


  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}


  ngOnInit(): void {

    this.loadProducts();

  }


  loadProducts(): void {

    this.productService.findAll()

      .subscribe({

        next: data => {

          console.log(
            'PRODUCTOS RECIBIDOS:',
            data
          );

          this.products = data;

          this.cdr.detectChanges();

        },

        error: err => {

          console.error(
            'Error cargando productos:',
            err
          );

        }

      });

  }


  newProduct(): void {

    this.router.navigate([
      '/products/new'
    ]);

  }


  edit(id: number): void {

    this.router.navigate([
      '/products/edit',
      id
    ]);

  }


  view(id: number): void {

    this.router.navigate([
      '/products',
      id
    ]);

  }


  delete(id: number): void {

    if (!confirm('¿Eliminar producto?')) {
      return;
    }

    this.productService
      .delete(id)
      .subscribe({

        next: () => {

          this.loadProducts();

        },

        error: err => {

          console.error(
            'Error eliminando producto:',
            err
          );

        }

      });

  }

}