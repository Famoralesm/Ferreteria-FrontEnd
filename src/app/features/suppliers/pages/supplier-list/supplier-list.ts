import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CiudadService } from '../../../../core/services/ciudad.service';
import { ComunaService } from '../../../../core/services/comuna.service';
import { Ciudad } from '../../../../core/models/lists/ciudad';
import { Comuna } from '../../../../core/models/lists/comuna';
import { Supplier } from '../../../../core/models/supplier/supplier';
import { NotificationService } from '../../../../core/services/notification.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { normalizeRut, rutValidator } from '../../../../core/utils/rut.util';
import { chileanPhoneValidator, normalizeChileanPhone } from '../../../../core/utils/phone.util';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, TableModule, SelectModule],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss'
})
export class SupplierList implements OnInit {
  suppliers: Supplier[] = [];
  searchTerm = '';
  ciudades: Ciudad[] = [];
  comunas: Comuna[] = [];
  comunasFiltradas: Comuna[] = [];
  loading = false;
  saving = false;
  formVisible = false;
  editingId?: number;
  readonly supplierForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supplierService: SupplierService,
    private readonly ciudadService: CiudadService,
    private readonly comunaService: ComunaService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.supplierForm = this.fb.group({
      rut: ['', [Validators.required, rutValidator]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
      giro: ['', [Validators.required, Validators.maxLength(200)]],
      direccion: ['', Validators.required],
      ciudad: [null, Validators.required],
      comuna: [null, Validators.required],
      telefono: ['', [Validators.required, chileanPhoneValidator]],
      email: ['', [Validators.email, Validators.maxLength(150)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.ciudadService.findAll().subscribe({
      next: data => { this.ciudades = data ?? []; this.cdr.detectChanges(); },
      error: error => console.error('Error cargando ciudades:', error)
    });
    this.comunaService.findAll().subscribe({
      next: data => { this.comunas = data ?? []; this.filtrarComunas(); this.cdr.detectChanges(); },
      error: error => console.error('Error cargando comunas:', error)
    });
    this.supplierForm.get('ciudad')?.valueChanges.subscribe(() => this.filtrarComunas());
  }

  get filteredSuppliers(): Supplier[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('es-CL');
    if (!query) return this.suppliers;
    return this.suppliers.filter(s =>
      (s.rut ?? '').toLocaleLowerCase('es-CL').includes(query) ||
      (s.nombre ?? '').toLocaleLowerCase('es-CL').includes(query)
    );
  }

  private filtrarComunas(): void {
    const ciudadId = Number(this.supplierForm.get('ciudad')?.value?.id ?? this.supplierForm.get('ciudad')?.value);
    this.comunasFiltradas = ciudadId ? this.comunas.filter(c => c.id_ciudad === ciudadId) : [];
    const comunaId = this.supplierForm.get('comuna')?.value?.id ?? this.supplierForm.get('comuna')?.value;
    if (this.comunas.length > 0 && comunaId && !this.comunasFiltradas.some(c => c.id === Number(comunaId))) {
      this.supplierForm.get('comuna')?.setValue(null, { emitEvent: false });
    }
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
      direccion: '', ciudad: null, comuna: null, telefono: '', email: '', activo: true
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
      ciudad: supplier.ciudad?.id ?? null,
      comuna: supplier.comuna?.id ?? null,
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
      ciudad: value.ciudad ? { id: Number(value.ciudad) } : null,
      comuna: value.comuna ? { id: Number(value.comuna) } : null,
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

  deleteSupplier(supplier: Supplier): void {
    const confirmed = confirm(`¿Eliminar el proveedor ${supplier.nombre}? Se conservará su historial y quedará inactivo.`);
    if (!confirmed) return;
    this.supplierService.delete(supplier.id).subscribe({
      next: () => {
        this.notificationService.success('Proveedor eliminado (desactivado) correctamente.');
        this.loadSuppliers();
      },
      error: error => {
        console.error('Error eliminando proveedor:', error);
        this.notificationService.error(error?.error?.message ?? 'No fue posible eliminar el proveedor.');
      }
    });
  }

  cancelForm(): void {
    if (this.saving) return;
    this.formVisible = false;
    this.supplierForm.reset();
  }
}
