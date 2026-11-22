import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

import { Supplier } from '../../../../core/models/supplier/supplier';
import { NotificationService } from '../../../../core/services/notification.service';
import { SupplierService } from '../../../../core/services/supplier.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TableModule
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss'
})
export class SupplierList implements OnInit {
  suppliers: Supplier[] = [];
  loading = false;
  saving = false;
  dialogVisible = false;
  editingId?: number;
  readonly supplierForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supplierService: SupplierService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.supplierForm = this.fb.group({
      rut: [''],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      razonSocial: [''],
      giro: [''],
      direccion: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading = true;

    this.supplierService.findAll().subscribe({
      next: data => {
        this.suppliers = data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error cargando proveedores:', error);
        this.loading = false;
        this.notificationService.error('No fue posible cargar los proveedores.');
        this.cdr.detectChanges();
      }
    });
  }

  newSupplier(): void {
    this.editingId = undefined;
    this.supplierForm.reset({
      rut: '',
      nombre: '',
      razonSocial: '',
      giro: '',
      direccion: '',
      telefono: '',
      email: '',
      activo: true
    });
    this.dialogVisible = true;
  }

  editSupplier(supplier: Supplier): void {
    this.editingId = supplier.id;
    this.supplierForm.reset({
      rut: supplier.rut ?? '',
      nombre: supplier.nombre ?? '',
      razonSocial: supplier.razonSocial ?? '',
      giro: supplier.giro ?? '',
      direccion: supplier.direccion ?? '',
      telefono: supplier.telefono ?? '',
      email: supplier.email ?? '',
      activo: supplier.activo ?? true
    });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.saving) {
      return;
    }

    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const value = this.supplierForm.getRawValue();
    const request = {
      rut: value.rut?.trim() || '',
      nombre: value.nombre?.trim() ?? '',
      razonSocial: value.razonSocial?.trim() || '',
      giro: value.giro?.trim() || '',
      direccion: value.direccion?.trim() || '',
      telefono: value.telefono?.trim() || '',
      email: value.email?.trim() || '',
      activo: value.activo ?? true
    };

    this.saving = true;
    const operation = this.editingId
      ? this.supplierService.update(this.editingId, request)
      : this.supplierService.create(request);

    operation.subscribe({
      next: () => {
        const message = this.editingId
          ? 'Proveedor actualizado correctamente.'
          : 'Proveedor registrado correctamente.';

        this.dialogVisible = false;
        this.saving = false;
        this.notificationService.success(message);
        this.loadSuppliers();
      },
      error: error => {
        console.error('Error guardando proveedor:', error);
        this.saving = false;
        this.notificationService.error(
          error?.error?.message ?? 'No fue posible guardar el proveedor.'
        );
        this.cdr.detectChanges();
      }
    });
  }

  closeDialog(): void {
    if (this.saving) {
      return;
    }
    this.dialogVisible = false;
  }
}
