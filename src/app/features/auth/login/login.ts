import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.services';

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
  
  constructor(private authService: AuthService, private tokenService: TokenService){}

login() {

  this.authService.login({

      email:this.email,
      password:this.password

  }).subscribe({

      next: response => {

          console.log(response);

          this.tokenService.saveToken(response.accessToken);

          console.log("Login correcto");

      },

      error: error => {

          console.error(error);

      }

  });

}

}