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
import { CreateProductRequest } from '../../../../core/models/product/create-product-request';
import { UpdateProductRequest } from '../../../../core/models/product/update-product-request';
import {  ProductService} from '../../../../core/services/product.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';
import { StoreService } from '../../../../core/services/store.service';
import { Store } from '../../../../core/models/store/store';
import { Subject, filter, distinctUntilChanged, takeUntil } from 'rxjs';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error';
import { BrandService } from '../../../../core/services/brand.service';
import { Brand } from '../../../../core/models/product/brand';

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
    CheckboxModule,
    FieldErrorComponent
  ],

  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {

  id?: number;
  readOnlyMode = false;

  form!: FormGroup;

  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private destroy$ = new Subject<void>();
  brands: Brand[] = [];
  showBrandDialog = false;
  newBrandName = '';
  savingBrand = false;
  currentStock = 0;
  currentStockMinimo = 0;
  currentStoreName = '';
  baseUnitName: string | null = null;
  baseUnitSymbol: string | null = null;
  private route = inject(
    ActivatedRoute
  );

  private productService = inject(
    ProductService
  );

  private brandService = inject(BrandService);

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

      active: [
        true
      ],

      category: [
        '', Validators.required
      ],

      brand: [''],
      brandId: [null, Validators.required],

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
      ],

      wholesalePrice: [null, Validators.min(0)],
      
      minimumSaleQuantity: [1, [Validators.required, Validators.min(0.0001)]],
      saleQuantityIncrement: [1, [Validators.required, Validators.min(0.0001)]],
      wholesaleMinQuantity: [null, Validators.min(0.0001)],

    });

  }


ngOnInit(): void {

  this.loadBrands();
  const paramId = this.route.snapshot.paramMap.get('id');

  if (!paramId) {
    return;
  }

  this.id = Number(paramId);
  this.readOnlyMode = this.route.snapshot.routeConfig?.path === 'products/view/:id' || this.route.snapshot.routeConfig?.path === 'products/:id';
  if (this.readOnlyMode) this.form.disable({ emitEvent: false });

  let previousStore: Store | null = null;

  this.storeService.selectedStore$
    .pipe(
      filter((store): store is Store => store !== null),
      distinctUntilChanged((a, b) => a.id === b.id),
      takeUntil(this.destroy$)
    )
    .subscribe(store => {

      if (
        previousStore &&
        previousStore.id !== store.id &&
        this.form.dirty
      ) {

        const confirmed = confirm(
          'Cambiar de sucursal recargará el producto y se perderán los cambios no guardados. ¿Deseas continuar?'
        );

        if (!confirmed) {
          this.storeService.setSelectedStore(previousStore);
          return;
        }

      }

      previousStore = store;

      this.currentStoreName = store.nombre;

      this.loadProduct(this.id!, store.id);

    });

}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}


  loadProduct(id: number, sucursalId: number): void {

  this.productService
    .findById(id, sucursalId)
    .subscribe({

      next: product => {

        this.currentStock = product.stock ?? 0;
        this.currentStock = product.stock ?? 0;
        this.currentStockMinimo = product.stockMinimo ?? 0;
        this.baseUnitName = product.baseUnitName ?? null;
        this.baseUnitSymbol = product.baseUnitSymbol ?? null;

        this.currentImageUrl = product.imageUrl ?? null;

        this.form.patchValue({
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: product.price,
          active: product.active,
          category: product.category,
          brand: product.brand,
          brandId: product.brandId ?? null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          wholesalePrice: product.wholesalePrice,
          wholesaleMinQuantity: product.wholesaleMinQuantity,
          minimumSaleQuantity: product.minimumSaleQuantity ?? 1,
          saleQuantityIncrement: product.saleQuantityIncrement ?? 1
        });

        if (this.readOnlyMode) this.form.disable({ emitEvent: false });
        this.form.markAsPristine();

      },

      error: err => {
        console.error('Error cargando producto:', err);

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
    active: value.active,
    category: value.category,
    brand: value.brand,
    brandId: value.brandId,
    wholesalePrice: value.wholesalePrice,
    wholesaleMinQuantity: value.wholesaleMinQuantity,
    minimumSaleQuantity: value.minimumSaleQuantity,
    saleQuantityIncrement: value.saleQuantityIncrement
  };

  const formValue = this.form.getRawValue();
const updateRequest: UpdateProductRequest = {
  // Mantén aquí el resto de las propiedades que ya tienes.
  sku: formValue.sku,
  name: formValue.name,
  description: formValue.description,
  price: formValue.price,
  wholesalePrice: formValue.wholesalePrice,
  wholesaleMinQuantity: formValue.wholesaleMinQuantity,
  active: formValue.active ?? true,
  category: formValue.category,
  brand: formValue.brand,
  brandId: formValue.brandId,
  minimumSaleQuantity: formValue.minimumSaleQuantity,
  saleQuantityIncrement: formValue.saleQuantityIncrement
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


  managePresentations(): void {
    if (!this.id) return;
    this.router.navigate(['/products/units'], { queryParams: { tab: 'presentations', productId: this.id } });
  }

  loadBrands(): void {
    this.brandService.findAll().subscribe({
      next: brands => this.brands = brands ?? [],
      error: error => {
        console.error('Error cargando marcas:', error);
        this.notificationService.error('No fue posible cargar el catálogo de marcas.');
      }
    });
  }

  openBrandDialog(): void {
    this.newBrandName = '';
    this.showBrandDialog = true;
  }

  createBrand(): void {
    const name = this.newBrandName.trim().replace(/\\s+/g, ' ');
    if (!name) {
      this.notificationService.warning('Ingresa el nombre de la marca.');
      return;
    }
    this.savingBrand = true;
    this.brandService.create(name).subscribe({
      next: brand => {
        this.brands = [...this.brands, brand].sort((a, b) => a.name.localeCompare(b.name, 'es'));
        this.form.patchValue({ brandId: brand.id, brand: brand.name });
        this.showBrandDialog = false;
        this.savingBrand = false;
        this.notificationService.success('Marca creada y asociada al producto.');
      },
      error: error => {
        this.savingBrand = false;
        this.notificationService.error(error?.error?.message ?? 'No fue posible crear la marca.');
      }
    });
  }

  onBrandChange(brandId: number | null): void {
    const brand = this.brands.find(item => item.id === Number(brandId));
    this.form.patchValue({ brand: brand?.name ?? '' });
  }

  compareSupplierPrices(): void {
    if (this.id) {
      this.router.navigate(['/products', this.id, 'suppliers']);
    }
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

get isStockAtMinimum(): boolean {
  return this.currentStock <= this.currentStockMinimo;
}

get stockStatusMessage(): string {
  return this.isStockAtMinimum
    ? 'Está en el límite de existencias mínimas.'
    : 'Stock disponible por encima del mínimo establecido.';
}

}