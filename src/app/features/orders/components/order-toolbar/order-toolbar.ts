import { Component, EventEmitter, Output } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-order-toolbar',
  standalone: true,
  imports: [
    InputTextModule
  ],
  templateUrl: './order-toolbar.html',
  styleUrl: './order-toolbar.scss',
})
export class OrderToolbar {

  @Output()
  searchChange = new EventEmitter<string>();

  onSearch(event: Event): void {

    const input = event.target as HTMLInputElement;

    this.searchChange.emit(input.value);

  }

}