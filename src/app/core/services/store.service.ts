
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { Store } from '../models/store/store';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  private readonly api = 'http://localhost:8080/api/stores';
  private readonly STORAGE_KEY = 'fc_selected_store';

  private readonly selectedStoreSubject =
    new BehaviorSubject<Store | null>(null);

  readonly selectedStore$ = this.selectedStoreSubject.asObservable();

  constructor(private http: HttpClient) {}

  findActive(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.api}/active`).pipe(
      tap(stores => this.restoreSelection(stores))
    );
  }

  get selectedStore(): Store | null {
    return this.selectedStoreSubject.value;
  }

  get selectedStoreId(): number | null {
    return this.selectedStore?.id ?? null;
  }

  setSelectedStore(store: Store): void {
    this.selectedStoreSubject.next(store);

    localStorage.setItem(
      this.STORAGE_KEY,
      String(store.id)
    );
  }

  private restoreSelection(stores: Store[]): void {

    if (!stores.length) {
      this.selectedStoreSubject.next(null);
      localStorage.removeItem(this.STORAGE_KEY);
      return;
    }

    const savedId = Number(
      localStorage.getItem(this.STORAGE_KEY)
    );

    const savedStore = stores.find(
      store => store.id === savedId
    );

    const selected = savedStore ?? stores[0];

    this.setSelectedStore(selected);
  }

}
