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
import { Product } from '../../../../core/models/product/product';
import { CreateProductRequest } from '../../../../core/models/product/create-product-request';
import { UpdateProductRequest } from '../../../../core/models/product/update-product-request';
import {  ProductService} from '../../../../core/services/product.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

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

  selectedImage?: File;
  imagePreview?: string;
  currentImageUrl?: string | null;
  uploadingImage = false;

  private readonly maxImageSize = 5 * 1024 * 1024;

  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];


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


  constructor(

    private notificationService: NotificationService
  ) {

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

          this.currentImageUrl = product.imageUrl ?? null;
          
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

       this.notificationService.error(
            'Error cargando producto.'
          );

        }

      });

  }


  save(): void {
  if (this.form.invalid || this.uploadingImage) {
    this.form.markAllAsTouched();
    return;
  }

  const value = this.form.getRawValue();

  const request: CreateProductRequest = {
    sku: value.sku,
    name: value.name,
    description: value.description,
    price: value.price,
    stock: value.stock,
    active: value.active,
    category: value.category,
    brand: value.brand,
    unit: value.unit
  };

  const updateRequest: UpdateProductRequest = {
    ...request
  };

  const finish = () => {
    this.notificationService.success(
      'Producto guardado correctamente.'
    );

    this.router.navigate(['/products']);
  };

  if (this.id) {
    this.productService.update(
      this.id,
      updateRequest
    ).subscribe({
      next: product => {
        this.uploadSelectedImage(product.id, finish);
      },
      error: err => {
        console.error('Error actualizando producto:', err);
        this.notificationService.error(
          'Error guardando producto.'
        );
      }
    });

    return;
  }

  this.productService.create(request).subscribe({
    next: product => {
      this.uploadSelectedImage(product.id, finish);
    },
    error: err => {
      console.error('Error creando producto:', err);
      this.notificationService.error(
        'Error creando producto.'
      );
    }
  });
}


  cancel(): void {

    this.router.navigate([
      '/products'
    ]);

  }

  onImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (!this.allowedImageTypes.includes(file.type)) {
    this.notificationService.warning(
      'Selecciona una imagen JPG, PNG o WebP.'
    );
    input.value = '';
    return;
  }

  if (file.size > this.maxImageSize) {
    this.notificationService.warning(
      'La imagen no puede superar los 5 MB.'
    );
    input.value = '';
    return;
  }

  if (this.imagePreview) {
    URL.revokeObjectURL(this.imagePreview);
  }

  this.selectedImage = file;
  this.imagePreview = URL.createObjectURL(file);
}

private uploadSelectedImage(
  productId: number,
  onSuccess: () => void
): void {
  if (!this.selectedImage) {
    onSuccess();
    return;
  }

  this.uploadingImage = true;

  this.productService.uploadImage(
    productId,
    this.selectedImage
  ).subscribe({
    next: product => {
      this.currentImageUrl = product.imageUrl ?? null;
      this.selectedImage = undefined;

      if (this.imagePreview) {
        URL.revokeObjectURL(this.imagePreview);
        this.imagePreview = undefined;
      }

      this.uploadingImage = false;
      onSuccess();
    },
    error: err => {
      console.error('Error subiendo imagen del producto:', err);
      this.uploadingImage = false;

      this.notificationService.error(
        'El producto se guardó, pero no fue posible subir su imagen.'
      );
    }
  });
}

get productImageSrc(): string | null {
  if (!this.currentImageUrl) return null;

  if (/^https?:\/\//i.test(this.currentImageUrl)) {
    return this.currentImageUrl;
  }

  const backendOrigin = environment.apiUrl
    .replace(/\/api\/?$/, '');

  return `${backendOrigin}${
    this.currentImageUrl.startsWith('/')
      ? this.currentImageUrl
      : `/${this.currentImageUrl}`
  }`;
}

}