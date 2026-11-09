import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { Ciudad } from '../../../../core/models/lists/ciudad';
import { Comuna } from '../../../../core/models/lists/comuna';
import { Customer } from '../../../../core/models/customer/customer';
import { CreateCustomerRequest } from '../../../../core/models/customer/create-customer-request';
import { rutValidator, normalizeRut } from '../../../../core/utils/rut.util';
import { chileanPhoneValidator } from '../../../../core/utils/phone.util';

import { CustomerService } from '../../../../core/services/customer.service';
import { ComunaService } from '../../../../core/services/comuna.service';
import { CiudadService } from '../../../../core/services/ciudad.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,  
    SelectModule
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.scss'
})
export class CustomerForm implements OnInit {

  customerForm: FormGroup;

  ciudades: Ciudad[] = [];
  comunas: Comuna[] = [];
  comunasFiltradas: Comuna[] = [];

  id?: number;
  readonlyMode = false;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private ciudadService: CiudadService,
    private comunaService: ComunaService,
  private notificationService: NotificationService
  ) {

    this.customerForm = this.fb.group({

      rut: [
        '',
        [
          Validators.required,
          rutValidator
        ]
      ],

      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(200)
        ]
      ],

      razonSocial: [''],
      giro: [''],
      tipoCompra: [''],
      direccion: [''],

      comuna: [
        null,
        Validators.required
      ],

      ciudad: [
        null,
        Validators.required
      ],

      contacto: [''],

      email: [
        '',
        [
          Validators.email,
          Validators.maxLength(150)
        ]
      ],

      telefono: [
        '',
        [chileanPhoneValidator]
      ],

      rutSolicita: [''],
      activo: [true]

    });

  }

ngOnInit(): void {

  const idParam = this.route.snapshot.paramMap.get('id');

  this.id = idParam ? Number(idParam) : undefined;

  this.readonlyMode =
    this.route.snapshot.routeConfig?.path === 'customers/:id';

  // Escuchamos cambios manuales de ciudad.
  // emitEvent: false al cargar el cliente evita borrar su comuna.
  this.customerForm.get('ciudad')
    ?.valueChanges
    .subscribe(ciudadId => {

      this.updateComunas(ciudadId);

      this.customerForm.get('comuna')
        ?.setValue(null);

    });

  this.loadInitialData();
}

private loadInitialData(): void {

  this.loading = true;

  forkJoin({

    ciudades: this.ciudadService.findAll(),

    comunas: this.comunaService.findAll()

  }).subscribe({

    next: ({ ciudades, comunas }) => {

      this.ciudades = ciudades;
      this.comunas = comunas;

      // Si estamos creando, dejamos el formulario listo.
      if (!this.id) {

        this.comunasFiltradas = [];
        this.loading = false;

        return;
      }

      // Si estamos editando, ahora cargamos el cliente.
      this.loadCustomer(this.id);

    },

    error: err => {

      console.error(
        'Error cargando ciudades y comunas:',
        err
      );

      this.loading = false;

    }

  });

}



  loadCiudades(): void {

    this.ciudadService.findAll().subscribe({

      next: data => {
        this.ciudades = data;
      },

      error: err => {
        console.error('Error cargando ciudades:', err);
      }

    });

  }

  loadComunas(): void {

    this.comunaService.findAll().subscribe({

      next: data => {

        this.comunas = data;

        const ciudadId =
          this.customerForm.get('ciudad')?.value;
          

        if (ciudadId) {
          this.updateComunas(Number(ciudadId));
        }

      },

      error: err => {
        console.error('Error cargando comunas:', err);
      }

    });

  }

  private updateComunas(
    ciudadId: number | string | null
  ): void {

    if (
      ciudadId === null ||
      ciudadId === undefined ||
      ciudadId === ''
    ) {
      this.comunasFiltradas = [];
      return;
    }

    const idCiudad = Number(ciudadId);

    this.comunasFiltradas =
      this.comunas.filter(
        comuna => Number(comuna.id_ciudad) === idCiudad
      );

  }

  loadCustomer(id: number): void {

  this.customerService.findById(id).subscribe({

    next: (customer: Customer) => {

      const ciudadId = customer.ciudad?.id ?? null;
      const comunaId = customer.comuna?.id ?? null;

      // Primero filtramos las comunas correspondientes.
      this.updateComunas(ciudadId);

      // Comprobamos que la comuna corresponda a la ciudad.
      const comunaValida = this.comunasFiltradas.some(
        comuna => Number(comuna.id) === Number(comunaId)
      );

      this.customerForm.patchValue({

        rut: customer.rut ?? '',
        nombre: customer.nombre ?? '',
        razonSocial: customer.razonSocial ?? '',
        giro: customer.giro ?? '',
        direccion: customer.direccion ?? '',
        email: customer.email ?? '',
        telefono: customer.telefono ?? '',
        activo: customer.activo ?? true,

        ciudad: ciudadId,

        comuna: comunaValida ? comunaId : null

      }, { emitEvent: false });

      if (ciudadId && !comunaValida) {

        console.warn(
          'La comuna guardada no pertenece a la ciudad del cliente.',
          {
            clienteId: id,
            ciudadId,
            comunaId
          }
        );

      }

      if (this.readonlyMode) {
        this.customerForm.disable({ emitEvent: false });
      }

      this.loading = false;

    },

    error: err => {

      console.error('Error cargando cliente:', err);

      this.loading = false;

    }

  });

}

  save(): void {

    if (this.readonlyMode || this.saving) {
      return;
    }

    if (this.customerForm.invalid) {

      this.customerForm.markAllAsTouched();
      return;

    }

    const value = this.customerForm.getRawValue();

    const ciudadId = Number(value.ciudad);
    const comunaId = Number(value.comuna);

    if (
      !Number.isInteger(ciudadId) ||
      ciudadId <= 0 ||
      !Number.isInteger(comunaId) ||
      comunaId <= 0
    ) {

      this.customerForm.get('ciudad')?.markAsTouched();
      this.customerForm.get('comuna')?.markAsTouched();

      return;

    }

    this.saving = true;

    const request: CreateCustomerRequest = {

      rut: normalizeRut(value.rut),

      nombre: String(value.nombre).trim(),

      razonSocial: value.razonSocial?.trim() || '',
      giro: value.giro?.trim() || '',
      //tipoCompra: value.tipoCompra?.trim() || '',
      direccion: value.direccion?.trim() || '',

      ciudad: { id: ciudadId } as any,
      comuna: { id: comunaId } as any,

      //contacto: value.contacto?.trim() || '',
      email: value.email?.trim() || '',
      telefono: value.telefono?.trim() || '',
      //rutSolicita: value.rutSolicita?.trim() || '',

      activo: value.activo ?? true

    };

    const operation = this.id
      ? this.customerService.update(this.id, request)
      : this.customerService.create(request);

    operation.subscribe({

      next: () => {
        const nombreCliente = String(value.nombre).trim();

      this.notificationService.success(
        `Has guardado el cliente "${nombreCliente}" exitosamente.`
      );

      this.router.navigate(['/customers']);
      },

      error: err => {

        console.error(
          this.id
            ? 'Error actualizando cliente:'
            : 'Error creando cliente:',
          err
        );

        this.saving = false;

      }

    });

  }

  cancel(): void {

    this.router.navigate(['/customers']);

  }

  get rut() {
    return this.customerForm.get('rut');
  }

  get nombre() {
    return this.customerForm.get('nombre');
  }

  get email() {
    return this.customerForm.get('email');
  }

  get telefono() {
    return this.customerForm.get('telefono');
  }

}