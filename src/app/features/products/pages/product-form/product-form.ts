import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';

import { CreateProductRequest } from '../../../../core/models/create-product-request';
import { UpdateProductRequest } from '../../../../core/models/update-product-request';
import {  ProductService} from '../../../../core/services/product.service';


@Component({
  selector: 'app-product-form',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
    CheckboxModule
  ],

  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {

  id?: number;

  form!: FormGroup;

  private fb = inject(FormBuilder);

  private route = inject(
    ActivatedRoute
  );

  private productService = inject(
    ProductService
  );

  private router = inject(
    Router
  );


  categories = [

    {
      label: 'Herramientas',
      value: 'HERRAMIENTAS'
    },

    {
      label: 'Ferretería',
      value: 'FERRETERIA'
    },

    {
      label: 'Plomería',
      value: 'PLOMERIA'
    },

    {
      label: 'Electricidad',
      value: 'ELECTRICIDAD'
    },

    {
      label: 'Pintura',
      value: 'PINTURA'
    }

  ];


  units = [

    {
      label: 'Unidad',
      value: 'UNIDAD'
    },

    {
      label: 'Metro',
      value: 'METRO'
    },

    {
      label: 'Caja',
      value: 'CAJA'
    },

    {
      label: 'Bolsa',
      value: 'BOLSA'
    },

    {
      label: 'Galón',
      value: 'GALON'
    }

  ];


  constructor() {

    this.form = this.fb.group({

      sku: [
        '',
        Validators.required
      ],

      name: [
        '',
        Validators.required
      ],

      description: [
        ''
      ],

      price: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      stock: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      active: [
        true
      ],

      category: [
        ''
      ],

      brand: [
        ''
      ],

      unit: [
        'UNIDAD'
      ],

      createdAt: [
        {
          value: '',
          disabled: true
        }
      ],

      updatedAt: [
        {
          value: '',
          disabled: true
        }
      ]

    });

  }


  ngOnInit(): void {

    const paramId =
      this.route.snapshot.paramMap.get('id');

    if (paramId) {

      this.id = Number(paramId);

      this.loadProduct(this.id);

    }

  }


  loadProduct(id: number): void {

    this.productService
      .findById(id)
      .subscribe({

        next: product => {

          console.log(
            'PRODUCTO:',
            product
          );

          this.form.patchValue({

            sku: product.sku,

            name: product.name,

            description:
              product.description,

            price: product.price,

            stock: product.stock,

            active: product.active,

            category: product.category,

            brand: product.brand,

            unit: product.unit,

            createdAt:
              product.createdAt,

            updatedAt:
              product.updatedAt

          });

        },

        error: err => {

          console.error(
            'Error cargando producto:',
            err
          );

        }

      });

  }


  save(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    const value =
      this.form.getRawValue();


    if (this.id) {

      const request:
        UpdateProductRequest = {

          sku: value.sku,

          name: value.name,

          description:
            value.description,

          price: value.price,

          stock: value.stock,

          active: value.active,

          category: value.category,

          brand: value.brand,

          unit: value.unit

        };


      this.productService
        .update(
          this.id,
          request
        )
        .subscribe({

          next: () => {

            this.router.navigate([
              '/products'
            ]);

          },

          error: err => {

            console.error(
              'Error actualizando producto:',
              err
            );

          }

        });

      return;
    }


    const request:
      CreateProductRequest = {

        sku: value.sku,

        name: value.name,

        description:
          value.description,

        price: value.price,

        stock: value.stock,

        active: value.active,

        category: value.category,

        brand: value.brand,

        unit: value.unit

      };


    this.productService
      .create(request)
      .subscribe({

        next: () => {

          this.router.navigate([
            '/products'
          ]);

        },

        error: err => {

          console.error(
            'Error creando producto:',
            err
          );

        }

      });

  }


  cancel(): void {

    this.router.navigate([
      '/products'
    ]);

  }

}