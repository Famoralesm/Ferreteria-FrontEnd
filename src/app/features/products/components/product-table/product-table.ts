
import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { Product } from '../../../../core/models/product/product';

@Component({
  selector: 'app-product-table',
  standalone: true,

  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule
  ],

  templateUrl: './product-table.html',
  styleUrl: './product-table.scss'
})
export class ProductTable {

  @Input() products: Product[] = [];

  @Output() edit = new EventEmitter<number>();
  @Output() view = new EventEmitter<number>();
  @Output() toggleStatus = new EventEmitter<{ id: number; active: boolean }>();

  // Filtros por columna
  skuSearch = '';
  nameSearch = '';
  categorySearch = '';
  brandSearch = '';
  statusSearch: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  categories = [
    { label: 'Herramientas', value: 'HERRAMIENTAS' },
    { label: 'Ferretería', value: 'FERRETERIA' },
    { label: 'Plomería', value: 'PLOMERIA' },
    { label: 'Electricidad', value: 'ELECTRICIDAD' },
    { label: 'Pintura', value: 'PINTURA' }
  ];

  get filteredProducts(): Product[] {

    return this.products.filter(product => {

      const sku = this.normalize(product.sku);
      const name = this.normalize(product.name);
      const brand = this.normalize(product.brand);

      return (
        sku.includes(this.normalize(this.skuSearch)) &&
        name.includes(this.normalize(this.nameSearch)) &&
        brand.includes(this.normalize(this.brandSearch)) &&
        (
          !this.categorySearch ||
          product.category === this.categorySearch
        )&&
        (
          this.statusSearch === 'ALL' ||
          (this.statusSearch === 'ACTIVE' && product.active) ||
          (this.statusSearch === 'INACTIVE' && !product.active)
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

  clearFilters(): void {

    this.skuSearch = '';
    this.nameSearch = '';
    this.categorySearch = '';
    this.brandSearch = '';

  }

}
