import { Component, AfterViewInit, NgZone, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

declare var google: any;

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent implements AfterViewInit, OnDestroy {
  hidePassword = true;
  loginError = '';
  loginWithEmail = true;
  private googleInitialized = false;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl(''),
    password: new FormControl('', [Validators.required])
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone,
    private snackBar: MatSnackBar
  ) {}

  ngAfterViewInit() {
    // Delay the initialization slightly to ensure DOM is ready
    setTimeout(() => {
      this.initializeGoogleSignIn();
    }, 100);
  }

  ngOnDestroy() {
    // Cleanup Google Sign-In
    if (this.googleInitialized && typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.cancel();
      this.googleInitialized = false;
    }
  }

  private initializeGoogleSignIn() {
    if (this.googleInitialized) {
      return; // Prevent multiple initializations
    }

    if (typeof google !== 'undefined' && google.accounts) {
      try {
        google.accounts.id.cancel(); // Cancel any existing prompt

        google.accounts.id.initialize({
          client_id: '110137029112-7u7utdicqfi6ps38i7tg07mnad941npq.apps.googleusercontent.com',
          callback: (response: any) => {
            this.ngZone.run(() => this.handleGoogleSignIn(response));
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
          itp_support: true,
          allowed_parent_origin: window.location.origin,
          error_callback: (error: any) => {
            console.error('Google Sign-In Error:', error);
            this.ngZone.run(() => {
              this.snackBar.open(`Google Sign-In Error: ${error.type}`, 'Close', {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top'
              });
            });
          }
        });

        const buttonElement = document.getElementById('googleBtn');
        if (buttonElement) {
          google.accounts.id.renderButton(buttonElement, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: buttonElement.offsetWidth || 250
          });
        }

        this.googleInitialized = true;
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        this.snackBar.open('Failed to initialize Google Sign-In. Please try again later.', 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    } else {
      console.error('Google Sign-In SDK not loaded');
      this.snackBar.open('Google Sign-In is not available at the moment. Please try again later.', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  onLoginGoogle() {
    if (!this.googleInitialized) {
      this.initializeGoogleSignIn();
    }

    if (typeof google !== 'undefined' && google.accounts) {
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.error('Prompt not displayed:', notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.error('Prompt skipped:', notification.getSkippedReason());
          } else if (notification.isDismissedMoment()) {
            console.error('Prompt dismissed:', notification.getDismissedReason());
          }
        });
      } catch (error) {
        console.error('Error prompting Google Sign-In:', error);
        this.snackBar.open('Failed to show Google Sign-In prompt. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    } else {
      this.snackBar.open('Google Sign-In is not available at the moment. Please try again later.', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  handleGoogleSignIn(response: any) {
    if (!response.credential) {
      this.snackBar.open('Google Sign-In failed. Please try again.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    this.authService.googleLogin(response.credential).subscribe({
      next: (response: any) => {
        this.snackBar.open('Successfully signed in with Google!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.router.navigate(['/features/dashboard']);
      },
      error: (error) => {
        console.error('Google login failed', error);
        this.snackBar.open(
          error.error?.message || 'Google login failed. Please try again.',
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          }
        );
      }
    });
  }

  toggleLoginMethod() {
    this.loginWithEmail = !this.loginWithEmail;
    if (this.loginWithEmail) {
      this.loginForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.loginForm.get('username')?.clearValidators();
    } else {
      this.loginForm.get('username')?.setValidators([Validators.required]);
      this.loginForm.get('email')?.clearValidators();
    }
    this.loginForm.get('email')?.updateValueAndValidity();
    this.loginForm.get('username')?.updateValueAndValidity();
  }

  onLogin() {
    if (this.loginForm.valid) {
      const credentials = {
        email: this.loginWithEmail ? this.loginForm.get('email')?.value : '',
        username: !this.loginWithEmail ? this.loginForm.get('username')?.value : '',
        password: this.loginForm.get('password')?.value
      };

      const loginObservable = this.loginWithEmail
        ? this.authService.login(credentials.email || '', credentials.password || '')
        : this.authService.loginWithUsername(credentials.username || '', credentials.password || '');

      loginObservable.subscribe({
        next: (response) => {
          this.snackBar.open('Successfully logged in!', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate([response.redirectUrl || '/features/dashboard']);
        },
        error: (error: HttpErrorResponse) => {
          this.loginError = error.error?.message || 'Login failed. Please check your credentials.';
          this.snackBar.open(this.loginError, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }
}
