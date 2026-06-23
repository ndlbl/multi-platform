import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { authApi, type AuthResponse } from '../api/auth';
import { ApiError } from '../api/client';
import { setToken } from '../auth/token';

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/tasks';
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
      navigate(from, { replace: true });
    },
    onError: (err, variables) => {
      // Credentials valid but email isn't verified yet, so redirect to verify-email with email pre-filled.
      if (err instanceof ApiError && err.body?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(variables.email)}`);
      }
    },
    meta: { silent: true },
  });

  const onSubmit = handleSubmit((values) => loginMutation.mutate(values));

  return (
    <section className="mx-auto max-w-md">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Log in</h2>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            {...register('email')}
            className={`w-full rounded-md border px-3 py-2 ${
              errors.email ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            {...register('password')}
            className={`w-full rounded-md border px-3 py-2 ${
              errors.password ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {loginMutation.isError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {loginMutation.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed
  disabled:bg-indigo-300"
        >
          {loginMutation.isPending ? 'Signing in…' : 'Log in'}
        </button>

        <p className="text-center text-sm text-slate-600">
          No account?{' '}
          <Link to="/register" className="text-indigo-600 underline">
            Register
          </Link>
        </p>

        <div className="text-center">
          <span className="text-sm text-slate-400">— or —</span>
        </div>

        <Link
          to="/login-otp"
          className="block w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm text-slate-700 hover:bg-slate-50"
        >
          Log in with email code
        </Link>
      </form>
    </section>
  );
}
