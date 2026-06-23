import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { authApi } from '../api/auth';

// Mirroring the server-side password complexity rules
const PasswordSchema = z
  .string()
  .min(8, 'Must be at least 8 characters')
  .refine((p) => /[a-z]/.test(p), 'Must contain a lowercase letter')
  .refine((p) => /[A-Z]/.test(p), 'Must contain an uppercase letter')
  .refine((p) => /\d/.test(p), 'Must contain a number')
  .refine((p) => /[^a-zA-Z0-9]/.test(p), 'Must contain a special character');

const RegisterSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: PasswordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: "Passwords don't match",
  });

type RegisterValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: '', password: '', confirm: '' },
    mode: 'onTouched',
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password }: RegisterValues) => authApi.register({ email, password }),
    onSuccess: (data) => {
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    },
    meta: { silent: true },
  });

  const onSubmit = handleSubmit((values) => registerMutation.mutate(values));

  return (
    <section className="mx-auto max-w-md p-4">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Register</h2>

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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
          <input
            type="password"
            {...register('confirm')}
            className={`w-full rounded-md border px-3 py-2 ${
              errors.confirm ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>}
        </div>

        {registerMutation.isError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {registerMutation.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed
  disabled:bg-indigo-300"
        >
          {registerMutation.isPending ? 'Creating account…' : 'Register'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 underline">
            Log in
          </Link>
        </p>
      </form>
    </section>
  );
}
