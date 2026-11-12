import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { Role } from '../../../../core/enums/role';
import { UserRequest } from '../../../../core/models/user/user-request';
import { environment } from '../../../../../environments/environment';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';


const passwordConfirmationValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const password = control.get('password')?.value ?? '';
  const confirmation = control.get('confirmPassword')?.value ?? '';

  if (!password && !confirmation) {
    return null;
  }

  if (password && !confirmation) {
    return { confirmationRequired: true };
  }

  if (!password && confirmation) {
    return { passwordRequired: true };
  }

  return password === confirmation
    ? null
    : { passwordMismatch: true };

};


@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserForm implements OnInit {

  id?: number;

  saving = false;

  loadingUser = false;

  roles = [
    { label: 'Administrador', value: Role.ADMIN },
    { label: 'Vendedor', value: Role.SELLER },
    { label: 'Despacho', value: Role.DELIVERY }
  ];

  userForm: FormGroup;
  selectedAvatar?: File;
  avatarPreview?: string;
  currentAvatarUrl?: string | null;
  uploadingAvatar = false;

  private readonly maxAvatarSize = 2 * 1024 * 1024;

  private readonly allowedAvatarTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
  

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private currentUserService: CurrentUserService,
    private notificationService: NotificationService
  ) {

    this.userForm = this.fb.group({

      name: ['', [
        Validators.required,
        Validators.maxLength(150)
      ]],

      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(150)
      ]],

      password: ['', [
        Validators.minLength(8)
      ]],

      confirmPassword: [''],

      role: [Role.SELLER, Validators.required],

      active: [true]

    }, {
      validators: passwordConfirmationValidator
    });

  }

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {

      this.id = Number(idParam);

      if (!Number.isInteger(this.id) || this.id <= 0) {

        this.notificationService.error(
          'El identificador del usuario no es válido.'
        );

        this.router.navigate(['/users']);

        return;

      }

      this.loadUser();

    } else {

      this.userForm.get('password')?.addValidators(
        Validators.required
      );

      this.userForm.get('confirmPassword')?.addValidators(
        Validators.required
      );

      this.userForm.get('password')?.updateValueAndValidity();

      this.userForm.get('confirmPassword')?.updateValueAndValidity();

    }

  }

  private loadUser(): void {

    if (!this.id) {
      return;
    }

    this.loadingUser = true;

    this.userService.findById(this.id).subscribe({

      next: user => {

        this.currentAvatarUrl = user.avatarUrl ?? null;

        this.userForm.patchValue({

          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active

        });

        this.loadingUser = false;

      },

      error: err => {

        console.error('Error cargando usuario:', err);

        this.loadingUser = false;

        this.notificationService.error(
          this.getErrorMessage(
            err,
            'No fue posible cargar el usuario.'
          )
        );

      }

    });

  }

  get nameControl() {
    return this.userForm.get('name');
  }

  get emailControl() {
    return this.userForm.get('email');
  }

  get passwordControl() {
    return this.userForm.get('password');
  }

  get confirmPasswordControl() {
    return this.userForm.get('confirmPassword');
  }

  preventConfirmationPaste(event: ClipboardEvent): void {

    event.preventDefault();

    this.notificationService.info(
      'Por seguridad, escribe nuevamente la contraseña en este campo.'
    );

  }

  preventConfirmationDrop(event: DragEvent): void {

    event.preventDefault();

  }

  save(): void {

    if (this.saving || this.loadingUser) {
      return;
    }

    if (this.userForm.invalid) {

      this.userForm.markAllAsTouched();

      this.notificationService.warning(
        this.getValidationMessage()
      );

      return;

    }

    const value = this.userForm.getRawValue();

    const password = String(value.password ?? '');

    const request: UserRequest = {

      name: String(value.name ?? '').trim(),

      email: String(value.email ?? '').trim().toLowerCase(),

      password: password.length > 0
        ? password
        : undefined,

      role: value.role as Role,

      active: Boolean(value.active)

    };

    this.saving = true;

    const operation = this.id
      ? this.userService.update(this.id, request)
      : this.userService.create(request);

    operation.subscribe({

next: user => {

  if (!this.selectedAvatar) {
    this.saving = false;

    this.notificationService.success(
      this.id
        ? 'Usuario actualizado correctamente.'
        : 'Usuario creado correctamente.'
    );

    this.router.navigate(['/users']);
    return;
  }

  this.uploadingAvatar = true;

  this.userService.uploadAvatar(
    user.id,
    this.selectedAvatar
  ).subscribe({

    next: updatedUser => {
      this.currentAvatarUrl = updatedUser.avatarUrl ?? null;
      this.uploadingAvatar = false;
      this.saving = false;

      if (this.avatarPreview) {
        URL.revokeObjectURL(this.avatarPreview);
      }

      this.notificationService.success(
        'Usuario e imagen actualizados correctamente.'
      );

      this.router.navigate(['/users']);
    },

    error: err => {
      console.error('Error subiendo avatar del usuario:', err);

      this.uploadingAvatar = false;
      this.saving = false;

      this.notificationService.error(
        'El usuario se guardó, pero no fue posible subir su fotografía.'
      );
    }

  });

}

    });

  }

  private getValidationMessage(): string {

    if (this.passwordControl?.hasError('required')) {
      return 'Debes ingresar una contraseña.';
    }

    if (this.passwordControl?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (this.userForm.hasError('confirmationRequired')) {
      return 'Debes confirmar la contraseña.';
    }

    if (this.userForm.hasError('passwordRequired')) {
      return 'Debes ingresar primero la contraseña.';
    }

    if (this.userForm.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden.';
    }

    return 'Revisa los campos obligatorios antes de guardar.';

  }

  private getErrorMessage(error: any, fallback: string): string {

    const body = error?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    const backendMessage = String(
      body?.message ?? body?.detail ?? ''
    );

    if (
      /password|contraseña/i.test(backendMessage) &&
      /(8|size|tamaño|al menos)/i.test(backendMessage)
    ) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (
      backendMessage &&
      !backendMessage.includes('Validation failed for argument')
    ) {
      return backendMessage;
    }

    if (error?.status === 400) {
      return 'Los datos ingresados no cumplen las validaciones del servidor. Revisa el formulario.';
    }

    if (error?.status === 409) {
      return 'Ya existe un usuario con esos datos.';
    }

    if (error?.status === 403) {
      return 'No tienes permisos para realizar esta operación.';
    }

    return fallback;

  }

  cancel(): void {

    this.router.navigate(['/users']);

  }

  onAvatarSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (!this.allowedAvatarTypes.includes(file.type)) {
    this.notificationService.warning(
      'Selecciona una imagen JPG, PNG o WebP.'
    );
    input.value = '';
    return;
  }

  if (file.size > this.maxAvatarSize) {
    this.notificationService.warning(
      'La fotografía no puede superar los 2 MB.'
    );
    input.value = '';
    return;
  }

  if (this.avatarPreview) {
    URL.revokeObjectURL(this.avatarPreview);
  }

  this.selectedAvatar = file;
  this.avatarPreview = URL.createObjectURL(file);
}

get avatarImageUrl(): string | null {
  if (!this.currentAvatarUrl) return null;

  if (/^https?:\/\//i.test(this.currentAvatarUrl)) {
    return this.currentAvatarUrl;
  }

  const backendOrigin = environment.apiUrl
    .replace(/\/api\/?$/, '');

  return `${backendOrigin}${
    this.currentAvatarUrl.startsWith('/')
      ? this.currentAvatarUrl
      : `/${this.currentAvatarUrl}`
  }`;
}

}