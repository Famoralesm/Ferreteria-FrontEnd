import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.services';
import { Router } from '@angular/router';

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
  
  constructor(private authService: AuthService, private tokenService: TokenService,
    private router: Router){}

login() {

  this.authService.login({

      email:this.email,
      password:this.password

  }).subscribe({

      next: response => {

        this.tokenService.saveToken(response.accessToken);

        this.router.navigate(['/dashboard']);

    },

      error: error => {

          console.error(error);

      }

  });

}

}