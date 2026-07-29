import { Component } from '@angular/core';

import { PageTitle } from '../../shared/components/page-title/page-title';
import { StatCard } from '../../shared/components/stat-card/stat-card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    PageTitle,
    StatCard
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

}