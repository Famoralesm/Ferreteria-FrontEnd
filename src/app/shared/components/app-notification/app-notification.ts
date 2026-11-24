import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  NotificationService
} from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './app-notification.html',
  styleUrl: './app-notification.scss'
})
export class AppNotification {

  readonly notification$ = this.notificationService.notification$;

  constructor(
    private notificationService: NotificationService
  ) {}

  close(): void {
    this.notificationService.clear();
  }

}
