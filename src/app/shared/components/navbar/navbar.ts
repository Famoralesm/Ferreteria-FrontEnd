
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { Store } from '../../../core/models/store/store';
import { StoreService } from '../../../core/services/store.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    FormsModule,
    InputTextModule,
    AvatarModule,
    BadgeModule,
    ButtonModule,
    SelectModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {

  stores: Store[] = [];
  selectedStore: Store | null = null;
  loadingStores = false;

  constructor(
    private storeService: StoreService
  ) {}

  ngOnInit(): void {
    this.loadStores();

    this.storeService.selectedStore$.subscribe(store => {
      this.selectedStore = store;
    });
  }

  loadStores(): void {

    this.loadingStores = true;

    this.storeService.findActive().subscribe({

      next: stores => {
        this.stores = stores;
        this.loadingStores = false;
      },

      error: error => {
        console.error('Error al cargar sucursales:', error);
        this.loadingStores = false;
      }

    });
  }

  onStoreChange(store: Store | null): void {

    if (!store) {
      return;
    }

    this.storeService.setSelectedStore(store);
  }

}
