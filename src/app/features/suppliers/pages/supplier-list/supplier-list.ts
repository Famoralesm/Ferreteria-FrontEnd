import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Supplier } from '../../../../core/models/supplier/supplier';
import { NotificationService } from '../../../../core/services/notification.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { normalizeRut, rutValidator } from '../../../../core/utils/rut.util';
import { chileanPhoneValidator, normalizeChileanPhone } from '../../../../core/utils/phone.util';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, TableModule],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss'
})
export class SupplierList implements OnInit {
  suppliers: Supplier[] = [];
  loading = false;
  saving = false;
  formVisible = false;
  editingId?: number;
  readonly supplierForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supplierService: SupplierService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.supplierForm = this.fb.group({
      rut: ['', [Validators.required, rutValidator]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
      giro: ['', [Validators.required, Validators.maxLength(200)]],
      direccion: ['', Validators.required],
      ciudad: ['', Validators.maxLength(100)],
      comuna: ['', Validators.maxLength(100)],
      telefono: ['', [Validators.required, chileanPhoneValidator]],
      email: ['', [Validators.email, Validators.maxLength(150)]],
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
      rut: '', nombre: '', razonSocial: '', giro: '',
      direccion: '', ciudad: '', comuna: '', telefono: '', email: '', activo: true
    });
    this.formVisible = true;
  }

  editSupplier(supplier: Supplier): void {
    this.editingId = supplier.id;
    this.supplierForm.reset({
      rut: supplier.rut ?? '',
      nombre: supplier.nombre ?? '',
      razonSocial: supplier.razonSocial ?? '',
      giro: supplier.giro ?? '',
      direccion: supplier.direccion ?? '',
      ciudad: supplier.ciudad?.nombre ?? supplier.ciudad ?? '',
      comuna: supplier.comuna?.nombre ?? supplier.comuna ?? '',
      telefono: supplier.telefono ?? '',
      email: supplier.email ?? '',
      activo: supplier.activo ?? true
    });
    this.formVisible = true;
  }

  save(): void {
    if (this.saving) return;
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const value = this.supplierForm.getRawValue();
    const request = {
      rut: normalizeRut(value.rut),
      nombre: String(value.nombre).trim(),
      razonSocial: String(value.razonSocial).trim(),
      giro: String(value.giro).trim(),
      direccion: String(value.direccion).trim(),
      ciudad: String(value.ciudad).trim(),
      comuna: String(value.comuna).trim(),
      telefono: normalizeChileanPhone(value.telefono),
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
        this.formVisible = false;
        this.saving = false;
        this.notificationService.success(message);
        this.loadSuppliers();
      },
      error: error => {
        console.error('Error guardando proveedor:', error);
        this.saving = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible guardar el proveedor.');
        this.cdr.detectChanges();
      }
    });
  }

  cancelForm(): void {
    if (this.saving) return;
    this.formVisible = false;
    this.supplierForm.reset();
  }
}
