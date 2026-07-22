import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  email = '';

  password = '';
  
  constructor(private authService: AuthService){}

login() {

  this.authService.login({

      email:this.email,
      password:this.password

  }).subscribe({

      next: response => {

          console.log(response);

      },

      error: error => {

          console.error(error);

      }

  });

}

}