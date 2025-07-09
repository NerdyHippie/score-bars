// src/app/components/register/register.component.ts
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  constructor(private authService: AuthService) {}

  onSubmit(formData: any) {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      alert('Please fill out all required fields.');
      return;
    }

    this.authService.register(formData);
  }
}
