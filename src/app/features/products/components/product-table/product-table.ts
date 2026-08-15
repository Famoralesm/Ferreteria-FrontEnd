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

import { Product } from '../../../../core/models/product';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule
  ],
  templateUrl: './product-table.html',
  styleUrl: './product-table.scss'
})
export class ProductTable {

  @Input() products: Product[] = [];

  @Output() edit = new EventEmitter<number>();
  @Output() view = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

}