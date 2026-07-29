import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss'
})
export class StatCard {

  @Input() title = '';

  @Input() value = '';

  @Input() icon = '';

  @Input() color = '#123B63';

  @Input() change = '';

}