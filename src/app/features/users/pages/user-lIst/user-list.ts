import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { User } from '../../../../core/models/user/user';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserList implements OnInit {

  users: User[] = [];

  loading = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {

    this.loading = true;

    this.userService.findAll().subscribe({

      next: users => {
        this.users = users;
        this.loading = false;
      },

      error: err => {
        console.error('Error cargando usuarios:', err);
        this.loading = false;
        this.notificationService.error(
          'No fue posible cargar los usuarios.'
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

  delete(user: User): void {

    const confirmed = confirm(
      `¿Estás seguro de eliminar al usuario "${user.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.userService.delete(user.id).subscribe({

      next: () => {

        this.users = this.users.filter(
          item => item.id !== user.id
        );

        this.notificationService.success(
          `El usuario "${user.name}" fue eliminado correctamente.`
        );

      },

      error: err => {

        console.error('Error eliminando usuario:', err);

        this.notificationService.error(
          err.error?.message ??
          'No fue posible eliminar el usuario.'
        );

      }

    });

  }

}