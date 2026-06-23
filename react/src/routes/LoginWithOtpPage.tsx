import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { authApi, type AuthResponse } from '../api/auth';
import { setToken } from '../auth/token';

const EmailSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
type EmailValues = z.infer<typeof EmailSchema>;

const CodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Must be exactly 6 characters')
    .regex(/^[A-Z0-9]+$/i, 'Use only A-Z and 0-9'),
});
type CodeValues = z.infer<typeof CodeSchema>;

export default function LoginWithOtpPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(EmailSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(CodeSchema),
    defaultValues: { code: '' },
    mode: 'onTouched',
  });

  const requestMutation = useMutation({
    mutationFn: (values: EmailValues) => authApi.requestLoginOtp(values),
    onSuccess: (_data, variables) => {
      setEmail(variables.email);
      setStep('code');
    },
    meta: { silent: true },
  });

  const loginMutation = useMutation({
    mutationFn: (values: CodeValues) =>
      authApi.loginWithOtp({ email, code: values.code.toUpperCase() }),
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
      navigate('/tasks');
    },
    meta: { silent: true },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp({ email, purpose: 'login' }),
    meta: { silent: true },
  });

  if (step === 'email') {
    return (
      <section className="mx-auto max-w-md">
        <h2 className="mb-4 text-2xl font-semibold text-slate-900">Log in with email code</h2>
        <p className="mb-4 text-sm text-slate-600">
          We'll send a 6-character code to your email. No password needed.
        </p>

        <form
          onSubmit={emailForm.handleSubmit((values) => requestMutation.mutate(values))}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...emailForm.register('email')}
              className={`w-full rounded-md border px-3 py-2 ${
                emailForm.formState.errors.email ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {emailForm.formState.errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {requestMutation.isError && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {requestMutation.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={requestMutation.isPending}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed
  disabled:bg-indigo-300"
          >
            {requestMutation.isPending ? 'Sending…' : 'Send code'}
          </button>

          <p className="text-center text-sm text-slate-600">
            Prefer a password?{' '}
            <Link to="/login" className="text-indigo-600 underline">
              Log in
            </Link>
          </p>
        </form>
      </section>
    );
  }

  // OTP code
  return (
    <section className="mx-auto max-w-md">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Enter your code</h2>
      <p className="mb-4 text-sm text-slate-600">
        We sent a 6-character code to <strong>{email}</strong>. Valid for 10 minutes.
      </p>

      <form
        onSubmit={codeForm.handleSubmit((values) => loginMutation.mutate(values))}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Code</label>
          <input
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="ABC123"
            {...codeForm.register('code')}
            className={`w-full rounded-md border px-3 py-3 text-center font-mono text-2xl uppercase tracking-[0.5em] ${
              codeForm.formState.errors.code ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {codeForm.formState.errors.code && (
            <p className="mt-1 text-xs text-red-600">{codeForm.formState.errors.code.message}</p>
          )}
        </div>

        {loginMutation.isError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {loginMutation.error.message}
          </p>
        )}

        {resendMutation.isSuccess && (
          <p className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
            A new code has been sent.
          </p>
        )}

        {resendMutation.isError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {resendMutation.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed
  disabled:bg-indigo-300"
        >
          {loginMutation.isPending ? 'Logging in…' : 'Log in'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="text-indigo-600 hover:text-indigo-800 disabled:text-slate-400"
          >
            {resendMutation.isPending ? 'Sending…' : 'Resend code'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              codeForm.reset();
              loginMutation.reset();
              resendMutation.reset();
            }}
            className="text-slate-600 hover:text-slate-900"
          >
            Use a different email
          </button>
        </div>
      </form>
    </section>
  );
}
