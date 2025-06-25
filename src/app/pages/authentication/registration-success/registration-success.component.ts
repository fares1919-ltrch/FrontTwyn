import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-registration-success',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  template: `
    <div class="success-container">
      <div class="success-card" [@slideIn]>
        <div class="success-icon">
          <div class="checkmark-circle">
            <mat-icon>check</mat-icon>
          </div>
        </div>
        <h1>Welcome to TWYN!</h1>
        <div class="message-container">
          <p class="main-message">Your account has been created successfully</p>
          <p class="sub-message">You can now log in to your account</p>
        </div>
        <button mat-flat-button color="primary" (click)="navigateToLogin()" class="login-button">
          <span>Go to Login</span>
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .success-container {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
    }

    .success-card {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }

    .success-icon {
      margin-bottom: 30px;
    }

    .checkmark-circle {
      width: 80px;
      height: 80px;
      background: #4CAF50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      animation: scaleIn 0.5s ease-out;
    }

    .checkmark-circle mat-icon {
      color: white;
      font-size: 40px;
      height: 40px;
      width: 40px;
      animation: fadeIn 0.5s ease-out 0.2s both;
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 32px;
      font-weight: 600;
    }

    .message-container {
      margin-bottom: 30px;
    }

    .main-message {
      color: #34495e;
      font-size: 18px;
      margin-bottom: 8px;
    }

    .sub-message {
      color: #7f8c8d;
      font-size: 16px;
    }

    .login-button {
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 30px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      max-width: 200px;
      margin: 0 auto;
    }

    .login-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .login-button mat-icon {
      transition: transform 0.3s ease;
    }

    .login-button:hover mat-icon {
      transform: translateX(5px);
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('0.5s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class RegistrationSuccessComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/authentication/login']);
  }
} 