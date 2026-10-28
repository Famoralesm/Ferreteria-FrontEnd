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

import { Ciudad } from '../../../../core/models/lists/ciudad';
import { Comuna } from '../../../../core/models/lists/comuna';
import { Customer } from '../../../../core/models/customer/customer';
import { CreateCustomerRequest } from '../../../../core/models/customer/create-customer-request';

import { CustomerService } from '../../../../core/services/customer.service';
import { ComunaService } from '../../../../core/services/comuna.service';
import { CiudadService } from '../../../../core/services/ciudad.service';

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
    private comunaService: ComunaService
  ) {

    this.customerForm = this.fb.group({

      rut: [
        '',
        [
          Validators.required,
          CustomerForm.validateRut
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
        [CustomerForm.validateChileanPhone]
      ],

      rutSolicita: [''],
      activo: [true]

    });

  }

  ngOnInit(): void {

    this.loadCiudades();
    this.loadComunas();

    this.customerForm.get('ciudad')
      ?.valueChanges
      .subscribe(ciudadId => {

        this.updateComunas(ciudadId);

        this.customerForm.get('comuna')
          ?.setValue(null);

      });

    const idParam =
      this.route.snapshot.paramMap.get('id');

    if (idParam) {

      this.id = Number(idParam);

      this.readonlyMode =
      this.route.snapshot.routeConfig?.path === 'customers/:id';

      this.loadCustomer(this.id);
    }

  }

  /**
   * Valida el RUT chileno mediante módulo 11.
   * Acepta puntos opcionales y K mayúscula/minúscula.
   */
  static validateRut(
    control: AbstractControl
  ): ValidationErrors | null {

    const value = String(control.value ?? '')
      .trim()
      .replace(/\./g, '')
      .replace(/-/g, '')
      .toUpperCase();

    if (!value) {
      return null;
    }

    if (!/^\d{7,8}[0-9K]$/.test(value)) {
      return { rutInvalido: true };
    }

    const cuerpo = value.slice(0, -1);
    const dvIngresado = value.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {

      suma += Number(cuerpo[i]) * multiplicador;

      multiplicador =
        multiplicador === 7 ? 2 : multiplicador + 1;

    }

    const resto = 11 - (suma % 11);

    const dvCalculado =
      resto === 11
        ? '0'
        : resto === 10
          ? 'K'
          : String(resto);

    return dvIngresado === dvCalculado
      ? null
      : { rutInvalido: true };
  }

  /**
   * Acepta teléfonos móviles y fijos chilenos
   * de 9 dígitos, con prefijo +56 opcional.
   */
  static validateChileanPhone(
    control: AbstractControl
  ): ValidationErrors | null {

    const raw = String(control.value ?? '').trim();

    // El teléfono es opcional.
    if (!raw) {
      return null;
    }

    const normalized = raw.replace(/[\s().-]/g, '');

    const valid =
      /^(?:\+?56)?[2-9]\d{8}$/.test(normalized);

    return valid
      ? null
      : { telefonoChilenoInvalido: true };
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

    this.loading = true;

    this.customerService.findById(id).subscribe({

      next: (customer: Customer) => {

        const ciudadId = customer.ciudad?.id ?? null;
        const comunaId = customer.comuna?.id ?? null;

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
          comuna: comunaId

        }, { emitEvent: false });

        this.updateComunas(ciudadId);

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

      rut: String(value.rut)
        .trim()
        .replace(/\./g, '')
        .replace(/-/g, '')
        .toUpperCase(),

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

        this.router.navigate(['/customers'], {
            state: {
              notification: {
                type: 'success',
                message: `Has guardado el cliente "${nombreCliente}" exitosamente.`
              }
            }
          });
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