import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  standalone: true,
  templateUrl: './field-error.html',
  styleUrl: './field-error.scss'
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() messages: Record<string, string> = {};

  get message(): string | null {
    if (!this.control?.touched || !this.control.errors) {
      return null;
    }

    for (const key of Object.keys(this.messages)) {
      if (this.control.hasError(key)) {
        return this.messages[key];
      }
    }

    return null;
  }
}
