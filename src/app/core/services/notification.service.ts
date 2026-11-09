import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  message: string;
  type: NotificationType;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly notificationSubject =
    new BehaviorSubject<AppNotification | null>(null);

  readonly notification$ =
    this.notificationSubject.asObservable();

  private timer?: ReturnType<typeof setTimeout>;

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  show(
    message: string,
    type: NotificationType,
    duration = 3000
  ): void {

    this.clearTimer();

    this.notificationSubject.next({
      message,
      type
    });

    this.timer = setTimeout(() => {
      this.clear();
    }, duration);

  }

  clear(): void {

    this.clearTimer();

    this.notificationSubject.next(null);

  }

  private clearTimer(): void {

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

  }

}