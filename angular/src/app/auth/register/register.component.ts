import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { matchValidator, passwordComplexityValidator } from '../../core/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordComplexityValidator]],
      confirm: ['', [Validators.required]],
    },
    {
      validators: [matchValidator('password', 'confirm')],
    },
  );

  readonly loading = signal(false);
  readonly serverError = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.register(email, password).subscribe({
      next: (res) => {
        this.router.navigate(['/verify-email'], {
          queryParams: { email: res.email },
        });
      },
      error: (err) => {
        this.serverError.set(err.error?.error ?? err.message ?? 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}
