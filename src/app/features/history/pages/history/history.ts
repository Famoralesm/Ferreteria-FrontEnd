import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AuditLog, AuditLogFilters, AuditLogPage } from '../../../../core/models/audit-log/audit-log';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface HistoryModule {
  label: string;
  value: string;
}

interface HistoryColumn {
  key: 'date' | 'action' | 'description' | 'user' | 'store';
  label: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, ButtonModule],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  readonly pageSize = 20;

  readonly modules: HistoryModule[] = [
    { label: 'Pedidos', value: 'ORDERS' },
    { label: 'Productos', value: 'PRODUCTS' },
    { label: 'Clientes', value: 'CUSTOMERS' },
    { label: 'Usuarios', value: 'USERS' },
    { label: 'Proveedores', value: 'SUPPLIERS' }
  ];

  readonly initialColumns: HistoryColumn[] = [
    { key: 'date', label: 'Fecha de actualización' },
    { key: 'action', label: 'Acción' },
    { key: 'description', label: 'Observación' },
    { key: 'user', label: 'Usuario' },
    { key: 'store', label: 'Sucursal' }
  ];

  selectedModule = '';
  currentPage = 0;
  result: AuditLogPage | null = null;
  loading = false;

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {}

  selectModule(module: string): void {
    if (this.selectedModule === module) return;
    this.selectedModule = module;
    this.currentPage = 0;
    this.result = null;
    this.search();
  }

  search(): void {
    if (!this.selectedModule) {
      this.result = null;
      return;
    }

    const filters: AuditLogFilters = {
      module: this.selectedModule,
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

  changePage(page: number): void {
    if (!this.result || page < 0 || page >= this.result.totalPages) return;
    this.currentPage = page;
    this.search();
  }

  cellValue(event: AuditLog, column: HistoryColumn): string {
    switch (column.key) {
      case 'action': return this.actionLabel(event);
      case 'description': return event.description || '—';
      case 'user': return event.userName || 'Proceso automático';
      case 'store': return event.storeName || '—';
      default: return '';
    }
  }

  actionLabel(event: AuditLog): string {
    const actions: Record<string, string> = {
      CREATED: 'Creación',
      UPDATED: 'Actualización',
      DEACTIVATED: 'Desactivación',
      ACTIVATED: 'Activación',
      ITEMS_UPDATED: 'Actualización de productos',
      CUSTOMER_DATA_UPDATED: 'Actualización de datos del cliente',
      STATUS_CHANGED: 'Actualización de estado',
      PAYMENT_CONFIRMED: 'Confirmación de pago',
      PAYMENT_REVERSED: 'Reversa de pago'
    };
    return actions[event.action] ?? event.action.replaceAll('_', ' ').toLowerCase();
  }

  trackById(_index: number, event: AuditLog): number {
    return event.id;
  }
}
