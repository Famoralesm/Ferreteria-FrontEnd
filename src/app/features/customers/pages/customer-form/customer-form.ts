import { Component } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { Ciudad } from '../../../../core/models/lists/ciudad';
import { Comuna } from '../../../../core/models/lists/comuna';
import { CustomerService } from '../../../../core/services/customer.service';
import { ComunaService } from '../../../../core/services/comuna.service';
import { CiudadService } from '../../../../core/services/ciudad.service';
import { OnInit } from '@angular/core';
import { SelectModule } from 'primeng/select';

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

  saving = false;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private ciudadService: CiudadService,
    private comunaService: ComunaService,
  ) {

    this.customerForm = this.fb.group({

      rut: [
        '',
        [
          Validators.required
        ]
      ],

      nombre: [
        '',
        [
          Validators.required
        ]
      ],

      razonSocial: [''],

      giro: [''],

      tipoCompra: [''],

      direccion: [''],

      comuna: [''],

      ciudad: [''],

      contacto: [''],

      email: [
        '',
        [
          Validators.email
        ]
      ],

      telefono: [''],

      rutSolicita: [''],

      activo: [true]

    });

  }
  ngOnInit(): void {

    this.loadCiudades();
    this.loadComunas();

  this.customerForm
  .get('ciudad')
  ?.valueChanges
  .subscribe(ciudadId => {

    this.updateComunas(ciudadId);

    this.customerForm
      .get('comuna')
      ?.setValue(null);

  });
  }

  private updateComunas(ciudadId: number | null): void {

  if (!ciudadId) {
    this.comunasFiltradas = [];
    return;
  }

  this.comunasFiltradas =
    this.comunas.filter(
      comuna => comuna.id_ciudad === ciudadId
    );
}
  loadCiudades(): void {

    this.ciudadService
      .findAll()
      .subscribe({

        next: data => {
          this.ciudades = data;
        },

        error: err => {
          console.error(
            'Error cargando ciudades:',
            err
          );
        }

      });

  }
  loadComunas(): void {

    this.comunaService
      .findAll()
      .subscribe({

        next: data => {
          this.comunas = data;
          const ciudadId = this.customerForm.get('ciudad')?.value;
          this.updateComunas(ciudadId);
        },

        error: err => {
          console.error(
            'Error cargando comunas:',
            err
          );
        }

      });

  }


  save(): void {

    if (this.customerForm.invalid) {

      this.customerForm.markAllAsTouched();

      return;
    }

    this.saving = true;

    this.customerService
      .create(this.customerForm.value)
      .subscribe({

        next: customer => {

          console.log(
            'CLIENTE CREADO:',
            customer
          );

          this.router.navigate([
            '/customers'
          ]);

        },

        error: err => {

          console.error(
            'Error creando cliente:',
            err
          );

          this.saving = false;

        }

      });

  }


  cancel(): void {

    this.router.navigate([
      '/customers'
    ]);

  }


  get rut() {

    return this.customerForm.get('rut');

  }


  get nombre() {

    return this.customerForm.get('nombre');

  }

}