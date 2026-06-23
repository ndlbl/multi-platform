import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: [
      this.route.snapshot.queryParamMap.get('email') ?? '',
      [Validators.required, Validators.email],
    ],
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
  readonly resendError = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);
    this.resendMessage.set(null);

    const { email, code } = this.form.getRawValue();
    this.auth.verifyEmail(email, code.toUpperCase()).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => {
        this.serverError.set(err.error?.error ?? err.message ?? 'Verification failed');
        this.loading.set(false);
      },
    });
  }

  resend(): void {
    const email = this.form.controls.email.value;
    if (!email) return;

    this.resending.set(true);
    this.resendMessage.set(null);
    this.resendError.set(null);

    this.auth.resendOtp(email, 'register').subscribe({
      next: () => {
        this.resendMessage.set('A new code has been sent. Check your email.');
        this.resending.set(false);
      },
      error: (err) => {
        this.resendError.set(err.error?.error ?? err.message ?? 'Resend failed');
        this.resending.set(false);
      },
    });
  }
}
