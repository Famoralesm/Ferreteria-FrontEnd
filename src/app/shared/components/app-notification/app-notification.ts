import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import {
  AppNotification as NotificationData,
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

  readonly notification$: Observable<NotificationData | null>;

  constructor(
    private notificationService: NotificationService
  ) {
    this.notification$ = this.notificationService.notification$;
  }

  close(): void {
    this.notificationService.clear();
  }

}
