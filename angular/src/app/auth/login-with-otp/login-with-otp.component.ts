import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-with-otp',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-with-otp.component.html',
})
export class LoginWithOtpComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Two-step state machine
  readonly step = signal<'email' | 'code'>('email');
  readonly capturedEmail = signal('');

  // Two FormGroups — one per step. Clean separation, easy reset.
  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly codeForm = this.fb.nonNullable.group({
    code: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^[A-Z0-9]+$/i),
      ],
    ],
  });

  readonly loading = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly resending = signal(false);
  readonly resendMessage = signal<string | null>(null);

  requestOtp(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    const { email } = this.emailForm.getRawValue();
    this.auth.requestLoginOtp(email).subscribe({
      next: () => {
        this.capturedEmail.set(email);
        this.step.set('code');
        this.loading.set(false);
      },
      error: (err) => {
        this.serverError.set(err.error?.error ?? err.message ?? 'Request failed');
        this.loading.set(false);
      },
    });
  }

  verifyOtp(): void {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);
    this.resendMessage.set(null);

    const { code } = this.codeForm.getRawValue();
    this.auth.loginWithOtp(this.capturedEmail(), code.toUpperCase()).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => {
        this.serverError.set(err.error?.error ?? err.message ?? 'Login failed');
        this.loading.set(false);
      },
    });
  }

  resend(): void {
    this.resending.set(true);
    this.resendMessage.set(null);
    this.serverError.set(null);

    this.auth.resendOtp(this.capturedEmail(), 'login').subscribe({
      next: () => {
        this.resendMessage.set('A new code has been sent.');
        this.resending.set(false);
      },
      error: (err) => {
        this.serverError.set(err.error?.error ?? err.message ?? 'Resend failed');
        this.resending.set(false);
      },
    });
  }

  useDifferentEmail(): void {
    this.step.set('email');
    this.codeForm.reset();
    this.serverError.set(null);
    this.resendMessage.set(null);
  }
}
