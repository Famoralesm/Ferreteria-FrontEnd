import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

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
export class AppNotification implements OnInit, OnDestroy {

  notification: NotificationData | null = null;

  private subscription?: Subscription;

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {

    this.subscription = this.notificationService
      .notification$
      .subscribe(notification => {

        this.notification = notification;

      });

  }

  close(): void {
    this.notificationService.clear();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

}