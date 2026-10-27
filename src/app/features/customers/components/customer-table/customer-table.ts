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

import { Customer } from '../../../../core/models/customer/customer';

@Component({
  selector: 'app-customer-table',
  standalone: true,

  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule
  ],

  templateUrl: './customer-table.html',
  styleUrl: './customer-table.scss'
})
export class CustomerTable {

  @Input()
  customers: Customer[] = [];

  @Output()
  view = new EventEmitter<number>();

  @Output()
  edit = new EventEmitter<number>();

  @Output()
  delete = new EventEmitter<number>();

}
