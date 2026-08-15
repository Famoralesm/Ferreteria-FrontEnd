import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-order-status-tag',
  standalone: true,
  imports: [],
  templateUrl: './order-status-tag.html',
  styleUrl: './order-status-tag.scss',
})
export class OrderStatusTag {

  @Input()
  status=''
}
