import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AuditLog, AuditLogFilters, AuditLogPage } from '../../../../core/models/audit-log/audit-log';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, JsonPipe, ButtonModule],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  readonly pageSize = 20;
  readonly modules = [
    { label: 'Todos los módulos', value: '' },
    { label: 'Pedidos', value: 'ORDERS' },
    { label: 'Productos', value: 'PRODUCTS' },
    { label: 'Inventario', value: 'INVENTORY' },
    { label: 'Clientes', value: 'CUSTOMERS' },
    { label: 'Proveedores', value: 'SUPPLIERS' },
    { label: 'Compras', value: 'PURCHASES' }
  ];

  selectedModule = '';
  entityId = '';
  action = '';
  fromDate = '';
  toDate = '';
  currentPage = 0;
  result: AuditLogPage | null = null;
  loading = false;
  expandedEventId: number | null = null;

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const filters: AuditLogFilters = {
      module: this.selectedModule || undefined,
      entityId: this.entityId.trim() || undefined,
      action: this.action.trim() || undefined,
      fromDate: this.fromDate ? (this.fromDate.length === 16 ? this.fromDate + ':00' : this.fromDate) : undefined,
      toDate: this.toDate ? (this.toDate.length === 16 ? this.toDate + ':59' : this.toDate) : undefined,
      page: this.currentPage,
      size: this.pageSize
    };
    this.loading = true;
    this.auditLogService.search(filters).subscribe({
      next: page => {
        this.result = page;
        this.loading = false;
      },
      error: error => {
        console.error('Error consultando historial:', error);
        this.loading = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible cargar el historial.');
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.expandedEventId = null;
    this.search();
  }

  clearFilters(): void {
    this.selectedModule = '';
    this.entityId = '';
    this.action = '';
    this.fromDate = '';
    this.toDate = '';
    this.applyFilters();
  }

  changePage(page: number): void {
    if (!this.result || page < 0 || page >= this.result.totalPages) return;
    this.currentPage = page;
    this.search();
  }

  toggleDetails(event: AuditLog): void {
    this.expandedEventId = this.expandedEventId === event.id ? null : event.id;
  }

  moduleLabel(module: string): string {
    const labels: Record<string, string> = {
      ORDERS: 'Pedidos', PRODUCTS: 'Productos', INVENTORY: 'Inventario',
      CUSTOMERS: 'Clientes', SUPPLIERS: 'Proveedores', PURCHASES: 'Compras'
    };
    return labels[module] ?? module;
  }

  actionLabel(action: string): string {
    const labels: Record<string, string> = {
      CREATED: 'Creado', UPDATED: 'Modificado', DEACTIVATED: 'Desactivado',
      ACTIVATED: 'Activado', ITEMS_UPDATED: 'Productos del pedido modificados',
      CUSTOMER_DATA_UPDATED: 'Datos del cliente modificados', STATUS_CHANGED: 'Estado cambiado'
    };
    return labels[action] ?? action.replaceAll('_', ' ');
  }

  trackById(_index: number, event: AuditLog): number {
    return event.id;
  }
}
