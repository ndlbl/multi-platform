import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { tap } from 'rxjs';

const TOKEN_KEY = 'auth-token';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}

export type OtpPurpose = 'register' | 'login';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Hydrate from localStorage. Service providedIn: 'root', so this runs once at the first inject.
  // Guarded for SSR/prerender where there isn't any localStorage — on the server the token is null.
  private readonly _token = signal<string | null>(
    this.isBrowser ? localStorage.getItem(TOKEN_KEY) : null,
  );
  private readonly _currentUser = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();

  // Derived signals, similar idea to React's `useMemo` for auth state.
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((res) => this.applyAuth(res)));
  }

  register(email: string, password: string) {
    return this.http.post<RegisterResponse>('/api/auth/register', { email, password });
  }

  verifyEmail(email: string, code: string) {
    return this.http
      .post<AuthResponse>('/api/auth/verify-email', { email, code })
      .pipe(tap((res) => this.applyAuth(res)));
  }

  requestLoginOtp(email: string) {
    return this.http.post<MessageResponse>('/api/auth/request-login-otp', { email });
  }

  loginWithOtp(email: string, code: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login-with-otp', { email, code })
      .pipe(tap((res) => this.applyAuth(res)));
  }

  resendOtp(email: string, purpose: OtpPurpose) {
    return this.http.post<MessageResponse>('/api/auth/resend-otp', { email, purpose });
  }

  loadCurrentUser() {
    return this.http.get<User>('/api/auth/me').pipe(tap((user) => this._currentUser.set(user)));
  }

  logout(): void {
    this._token.set(null);
    this._currentUser.set(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  private applyAuth(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    this._token.set(res.token);
    this._currentUser.set(res.user);
  }
}
