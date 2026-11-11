import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { take } from 'rxjs';

import { User } from '../../core/models/user/user';
import { Role } from '../../core/enums/role';

import { CurrentUserService } from '../../core/services/current-user.service';
import { ProfileService } from '../../core/services/profile.services';
import { NotificationService } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment.development';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit, OnDestroy {

  currentUser?: User;

  profileForm: FormGroup;

  loading = false;

  saving = false;

  uploadingAvatar = false;

  deletingAvatar = false;

  selectedAvatar?: File;

  avatarPreview?: string;

  private readonly maxAvatarSize = 2 * 1024 * 1024;

  private readonly allowedAvatarTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  constructor(
    private fb: FormBuilder,
    private currentUserService: CurrentUserService,
    private profileService: ProfileService,
    private notificationService: NotificationService,
    private router: Router
  ) {

    this.profileForm = this.fb.group({

      name: ['', [
        Validators.required,
        Validators.maxLength(150)
      ]]

    });

  }

  ngOnInit(): void {

    this.loadProfile();

  }

  ngOnDestroy(): void {

    this.revokePreview();

  }

get avatarSrc(): string | null {

  if (this.avatarPreview) {
    return this.avatarPreview;
  }

  const url = this.currentUser?.avatarUrl;

  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const backendOrigin = environment.apiUrl
    .replace(/\/api\/?$/, '');

  return `${backendOrigin}${url.startsWith('/') ? url : `/${url}`}`;

}

  get initials(): string {

    return String(this.currentUser?.name ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');

  }

  get roleLabel(): string {

    const labels: Record<Role, string> = {

      [Role.ADMIN]: 'Administrador',
      [Role.SELLER]: 'Vendedor',
      [Role.DELIVERY]: 'Despacho'

    };

    const role = this.currentUser?.role;

    return role ? labels[role] ?? role : '';

  }

  loadProfile(): void {

    this.loading = true;

    this.currentUserService.getCurrentUser()
      .pipe(take(1))
      .subscribe({

        next: user => {

          this.currentUser = user;

          this.profileForm.patchValue({
            name: user.name
          });

          this.profileForm.markAsPristine();

          this.loading = false;

        },

        error: err => {

          console.error('Error cargando perfil:', err);

          this.loading = false;

          this.notificationService.error(
            this.getErrorMessage(
              err,
              'No fue posible cargar tu perfil.'
            )
          );

        }

      });

  }

  onAvatarSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

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

    this.revokePreview();

    this.selectedAvatar = file;

    this.avatarPreview = URL.createObjectURL(file);

  }

  uploadAvatar(): void {

    if (!this.selectedAvatar || this.uploadingAvatar) {
      return;
    }

    this.uploadingAvatar = true;

    this.profileService.uploadAvatar(this.selectedAvatar)
      .pipe(take(1))
      .subscribe({

        next: user => {

          this.currentUser = user;

          this.selectedAvatar = undefined;

          this.revokePreview();

          this.uploadingAvatar = false;

          this.refreshProfile();

          this.notificationService.success(
            'Fotografía actualizada correctamente.'
          );

        },

        error: err => {

          console.error('Error subiendo fotografía:', err);

          this.uploadingAvatar = false;

          this.notificationService.error(
            this.getErrorMessage(
              err,
              'No fue posible actualizar la fotografía.'
            )
          );

        }

      });

  }

  deleteAvatar(): void {

    if (!this.currentUser?.avatarUrl || this.deletingAvatar) {
      return;
    }

    this.deletingAvatar = true;

    this.profileService.deleteAvatar()
      .pipe(take(1))
      .subscribe({

        next: user => {

          this.currentUser = user;

          this.selectedAvatar = undefined;

          this.revokePreview();

          this.deletingAvatar = false;

          this.refreshProfile();

          this.notificationService.success(
            'Fotografía eliminada correctamente.'
          );

        },

        error: err => {

          console.error('Error eliminando fotografía:', err);

          this.deletingAvatar = false;

          this.notificationService.error(
            this.getErrorMessage(
              err,
              'No fue posible eliminar la fotografía.'
            )
          );

        }

      });

  }

  saveProfile(): void {

    if (this.saving || this.profileForm.invalid) {

      this.profileForm.markAllAsTouched();

      return;

    }

    if (!this.profileForm.dirty) {

      this.notificationService.info(
        'No hay cambios para guardar.'
      );

      return;

    }

    const request = {

      name: String(
        this.profileForm.get('name')?.value ?? ''
      ).trim()

    };

    this.saving = true;

    this.profileService.updateProfile(request)
      .pipe(take(1))
      .subscribe({

        next: user => {

          this.currentUser = user;

          this.profileForm.patchValue({
            name: user.name
          });

          this.profileForm.markAsPristine();

          this.saving = false;

          this.refreshProfile();

          this.notificationService.success(
            'Tu perfil fue actualizado correctamente.'
          );

        },

        error: err => {

          console.error('Error actualizando perfil:', err);

          this.saving = false;

          this.notificationService.error(
            this.getErrorMessage(
              err,
              'No fue posible actualizar tu perfil.'
            )
          );

        }

      });

  }

  private refreshProfile(): void {

    this.currentUserService.refresh()
      .pipe(take(1))
      .subscribe({

        next: user => {

          this.currentUser = user;

          this.profileForm.patchValue({
            name: user.name
          });

          this.profileForm.markAsPristine();

        },

        error: err => {

          console.error(
            'No fue posible refrescar los datos del perfil:',
            err
          );

        }

      });

  }

  private revokePreview(): void {

    if (this.avatarPreview) {

      URL.revokeObjectURL(this.avatarPreview);

      this.avatarPreview = undefined;

    }

  }

  cancel(): void {

    this.router.navigate(['/dashboard']);

  }

  private getErrorMessage(error: any, fallback: string): string {

    const body = error?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body?.message) {
      return body.message;
    }

    if (error?.status === 400) {
      return 'La información enviada no es válida.';
    }

    if (error?.status === 401) {
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    }

    if (error?.status === 403) {
      return 'No tienes permiso para realizar esta operación.';
    }

    if (error?.status === 413) {
      return 'La fotografía supera el tamaño permitido.';
    }

    return fallback;

  }

}