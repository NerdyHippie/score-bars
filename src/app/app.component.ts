import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
