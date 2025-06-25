import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './side-register.component.html',
  styles: [`
    .password-requirements {
      margin-top: -10px;
      margin-bottom: 20px;
      padding: 10px;
      border-radius: 4px;
      background-color: #f5f5f5;
    }
    
    .requirement {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
      margin: 4px 0;
    }
    
    .requirement.met {
      color: #4caf50;
    }
    
    .requirement mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .requirement.met mat-icon {
      color: #4caf50;
    }
    
    .requirement:not(.met) mat-icon {
      color: #666;
    }
  `]
})
export class AppSideRegisterComponent {
  hidePassword = true;
  hideConfirmPassword = true;

  // Password requirements status
  passwordRequirements = {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false
  };

  // Add error message property
  errorMessage: string = '';
  registrationSuccess: boolean = false;

  form = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      Validators.minLength(3)
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      this.createPasswordStrengthValidator()
    ]),
    confirmPassword: new FormControl('', [
      Validators.required
    ])
  }, { validators: this.passwordMatchValidator });

  constructor(private http: HttpClient, private router: Router) {
    // Subscribe to password changes to update requirements status
    this.form.get('password')?.valueChanges.subscribe(password => {
      if (password) {
        this.updatePasswordRequirements(password);
      }
    });
  }

  // Custom validator for password strength
  createPasswordStrengthValidator(): any {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSymbol;

      return !passwordValid ? {
        passwordStrength: {
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSymbol
        }
      } : null;
    };
  }

  // Update password requirements status
  updatePasswordRequirements(password: string): void {
    this.passwordRequirements = {
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }

  // Password match validator
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  // Helper methods to check field state
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (fieldName === 'username') {
      if (control.errors['required']) {
        return 'Username is required';
      }
      if (control.errors['minlength']) {
        return 'Username must be at least 3 characters';
      }
    }

    if (fieldName === 'email') {
      if (control.errors['required']) {
        return 'Email is required';
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
    }

    if (fieldName === 'password') {
      if (control.errors['required']) {
        return 'Password is required';
      }
      if (control.errors['minlength']) {
        return 'Password must be at least 6 characters';
      }
    }

    if (fieldName === 'confirmPassword') {
      if (control.errors['required']) {
        return 'Please confirm your password';
      }
      if (control.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }

    return '';
  }

  onRegister(): void {
    if (this.form.valid) {
      const formData = {
        Username: this.form.get('username')?.value,
        Email: this.form.get('email')?.value,
        Password: this.form.get('password')?.value,
        Confirmpassword: this.form.get('confirmPassword')?.value
      };

      this.http.post(`${environment.apiUrl}/auth/register`, formData, {
        headers: { 'Content-Type': 'application/json' }
      }).subscribe({
        next: (response: any) => {
          this.registrationSuccess = true;
          // Redirect to success page instead of login page
          this.router.navigate(['/authentication/registration-success']);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          // Mark all fields as touched to show validation errors
          Object.keys(this.form.controls).forEach(key => {
            const control = this.form.get(key);
            control?.markAsTouched();
          });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
      });
    }
  }

  onLogin() {
    alert("Redirection vers la connexion...");
    this.router.navigate(['/login']);
  }
}
