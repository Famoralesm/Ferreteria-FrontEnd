import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BehaviorSubject, finalize, take } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { User } from '../../../../core/models/user/user';
import { Role } from '../../../../core/enums/role';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { UserService } from '../../../../core/services/user.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    TagModule,
    ConfirmDialogModule
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserList implements OnInit {

  private readonly usersSubject = new BehaviorSubject<User[]>([]);

  readonly users$ = this.usersSubject.asObservable();

  loading = false;

  deletingUserId: number | null = null;

  currentUserId: number | null = null;

  constructor(
    private userService: UserService,
    private currentUserService: CurrentUserService,
    private router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

    @ViewChild('dt')
    dt!: Table;

  filterUsers(event: Event): void {

    const value = (event.target as HTMLInputElement).value;

    this.dt.filterGlobal(value, 'contains');

  }

  ngOnInit(): void {

    this.currentUserService.getCurrentUser()
      .pipe(take(1))
      .subscribe({

        next: user => {
          this.currentUserId = user.id;
        },

        error: err => {
          console.error('Error obteniendo usuario actual:', err);
        }

      });

    this.loadUsers();

  }

  loadUsers(): void {

    this.loading = true;

    this.userService.findAll()
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: users => {
          this.usersSubject.next(users ?? []);
        },

        error: err => {

          console.error('Error cargando usuarios:', err);

          this.notificationService.error(
            this.getErrorMessage(
              err,
              'No fue posible cargar los usuarios.'
            )
          );

        }

      });

  }

  newUser(): void {

    this.router.navigate(['/users/new']);

  }

  edit(id: number): void {

    this.router.navigate(['/users/edit', id]);

  }

  confirmDelete(user: User): void {

    if (user.id === this.currentUserId) {

      this.notificationService.warning(
        'No puedes eliminar la cuenta con la que has iniciado sesión.'
      );

      return;

    }

    this.confirmationService.confirm({

      key: 'user-delete',

      header: 'Eliminar usuario',

      message:
        `¿Estás seguro de eliminar a ${user.name} (${user.email})?`,

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: 'Sí, eliminar',

      rejectLabel: 'Cancelar',

      acceptButtonStyleClass: 'p-button-danger',

      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteUser(user)

    });

  }

  private deleteUser(user: User): void {

    this.deletingUserId = user.id;

    this.userService.delete(user.id)
      .pipe(
        finalize(() => this.deletingUserId = null)
      )
      .subscribe({

        next: () => {

          const currentUsers = this.usersSubject.value;

          this.usersSubject.next(
            currentUsers.filter(item => item.id !== user.id)
          );

          this.notificationService.success(
            `El usuario "${user.name}" fue eliminado correctamente.`
          );

        },

        error: err => {

          console.error('Error eliminando usuario:', err);

          this.notificationService.error(
            this.getErrorMessage(
              err,
              'No fue posible eliminar el usuario.'
            )
          );

        }

      });

  }

  roleLabel(role: Role): string {

    const labels: Record<Role, string> = {

      [Role.ADMIN]: 'Administrador',
      [Role.SELLER]: 'Vendedor',
      [Role.DELIVERY]: 'Despacho'

    };

    return labels[role] ?? role;

  }

  roleSeverity(role: Role): 'success' | 'info' | 'warn' {

    switch (role) {

      case Role.ADMIN:
        return 'success';

      case Role.SELLER:
        return 'info';

      case Role.DELIVERY:
        return 'warn';

      default:
        return 'info';

    }

  }

  private getErrorMessage(error: any, fallback: string): string {

    const body = error?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body?.message && typeof body.message === 'string') {
      return body.message;
    }

    if (body?.detail && typeof body.detail === 'string') {
      return body.detail;
    }

    if (error?.status === 403) {
      return 'No tienes permisos para realizar esta operación.';
    }

    return fallback;

  }

}