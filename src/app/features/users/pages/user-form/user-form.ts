import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,FormGroup
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';

import { Role } from '../../../../core/enums/role';
import { UserRequest } from '../../../../core/models/user/user-request';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';

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

  roles = [
    { label: 'Administrador', value: Role.ADMIN },
    { label: 'Vendedor', value: Role.SELLER },
    { label: 'Despacho', value: Role.DELIVERY }
  ];

    userForm!: FormGroup;

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private route: ActivatedRoute,
        private router: Router,
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

        password: [''],

        role: [Role.SELLER, Validators.required],

        active: [true]

        }); 
    }

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {

      this.id = Number(idParam);

      this.userService.findById(this.id).subscribe({

        next: user => {

          this.userForm.patchValue({

            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active

          });

        },

        error: err => {

          console.error(err);

          this.notificationService.error(
            'No fue posible cargar el usuario.'
          );

        }

      });

    }

  }

  save(): void {

    if (this.saving || this.userForm.invalid) {

      this.userForm.markAllAsTouched();

      return;

    }

    const value = this.userForm.getRawValue();

    if (!this.id && !value.password?.trim()) {

      this.userForm.get('password')?.setErrors({
        required: true
      });

      return;

    }

    const request: UserRequest = {

      name: value.name!.trim(),

      email: value.email!.trim().toLowerCase(),

      password: value.password?.trim() || undefined,

      role: value.role!,

      active: value.active ?? true

    };

    this.saving = true;

    const operation = this.id
      ? this.userService.update(this.id, request)
      : this.userService.create(request);

    operation.subscribe({

      next: () => {

        this.notificationService.success(
          this.id
            ? 'Usuario actualizado correctamente.'
            : 'Usuario creado correctamente.'
        );

        this.router.navigate(['/users']);

      },

      error: err => {

        console.error(err);

        this.saving = false;

        this.notificationService.error(
          err.error?.message ??
          'No fue posible guardar el usuario.'
        );

      }

    });

  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

}