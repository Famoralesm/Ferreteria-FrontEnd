
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ProductTable } from '../../components/product-table/product-table';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product/product';

@Component({
  selector: 'app-product-list',
  standalone: true,

  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ProductTable
  ],

  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {

  products: Product[] = [];

  // Filtros independientes
  skuSearch = '';
  nameSearch = '';
  categorySearch = '';
  brandSearch = '';

  categories = [
    { label: 'Herramientas', value: 'HERRAMIENTAS' },
    { label: 'Ferretería', value: 'FERRETERIA' },
    { label: 'Plomería', value: 'PLOMERIA' },
    { label: 'Electricidad', value: 'ELECTRICIDAD' },
    { label: 'Pintura', value: 'PINTURA' }
  ];

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {

    this.productService.findAll().subscribe({

      next: data => {

        this.products = data;

        this.cdr.detectChanges();

      },

      error: err => {

        console.error('Error cargando productos:', err);

      }

    });

  }

  // Productos filtrados
  get filteredProducts(): Product[] {

    return this.products.filter(product => {

      const sku = this.normalize(product.sku);
      const name = this.normalize(product.name);
      const brand = this.normalize(product.brand);
      const category = product.category ?? '';

      return (
        sku.includes(this.normalize(this.skuSearch)) &&
        name.includes(this.normalize(this.nameSearch)) &&
        brand.includes(this.normalize(this.brandSearch)) &&
        (
          !this.categorySearch ||
          category === this.categorySearch
        )
      );

    });

  }

  private normalize(value: unknown): string {

    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  }

  onFilterInput(
    field: 'sku' | 'name' | 'brand',
    event: Event
  ): void {

    const value = (event.target as HTMLInputElement).value;

    switch (field) {

      case 'sku':
        this.skuSearch = value;
        break;

      case 'name':
        this.nameSearch = value;
        break;

      case 'brand':
        this.brandSearch = value;
        break;

    }

  }

  clearFilters(): void {

    this.skuSearch = '';
    this.nameSearch = '';
    this.categorySearch = '';
    this.brandSearch = '';

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

}
