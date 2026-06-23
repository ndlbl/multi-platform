import { api } from './client';

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

export interface Credentials {
  email: string;
  password: string;
}

export const authApi = {
  register: (input: Credentials) =>
    api<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: Credentials) =>
    api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  verifyEmail: (input: { email: string; code: string }) =>
    api<AuthResponse>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  requestLoginOtp: (input: { email: string }) =>
    api<MessageResponse>('/api/auth/request-login-otp', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  loginWithOtp: (input: { email: string; code: string }) =>
    api<AuthResponse>('/api/auth/login-with-otp', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  resendOtp: (input: { email: string; purpose: 'register' | 'login' }) =>
    api<MessageResponse>('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  me: () => api<User>('/api/auth/me'),
};
