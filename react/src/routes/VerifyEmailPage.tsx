import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { authApi, type AuthResponse } from '../api/auth';
import { setToken } from '../auth/token';

const VerifyEmailSchema = z.object({
  email: z.string().email('Enter a valid email'),
  code: z
    .string()
    .length(6, 'Must be exactly 6 characters')
    .regex(/^[A-Z0-9]+$/i, 'Use only A-Z and 0-9'),
});
type VerifyEmailValues = z.infer<typeof VerifyEmailSchema>;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VerifyEmailValues>({
    resolver: zodResolver(VerifyEmailSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      code: '',
    },
    mode: 'onTouched',
  });

  const email = useWatch({ control, name: 'email' });

  const verifyMutation = useMutation({
    mutationFn: (values: VerifyEmailValues) =>
      authApi.verifyEmail({ email: values.email, code: values.code.toUpperCase() }),
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
      navigate('/tasks');
    },
    meta: { silent: true },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp({ email, purpose: 'register' }),
    meta: { silent: true },
  });

  const onSubmit = handleSubmit((values) => verifyMutation.mutate(values));

  return (
    <section className="mx-auto max-w-md p-4">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Verify your email</h2>
      <p className="mb-4 text-sm text-slate-600">
        Enter the 6-character code we sent. It's valid for 10 minutes.
      </p>

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
          <label className="mb-1 block text-sm font-medium text-slate-700">Code</label>
          <input
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="ABC123"
            {...register('code')}
            className={`w-full rounded-md border px-3 py-3 text-center font-mono text-2xl uppercase tracking-[0.5em] ${
              errors.code ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
        </div>

        {verifyMutation.isError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {verifyMutation.error.message}
          </p>
        )}

        {resendMutation.isSuccess && (
          <p className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
            A new code has been sent. Check your email.
          </p>
        )}

        {resendMutation.isError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {resendMutation.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={verifyMutation.isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed
  disabled:bg-indigo-300"
        >
          {verifyMutation.isPending ? 'Verifying…' : 'Verify and log in'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending || !email}
            className="text-indigo-600 hover:text-indigo-800 disabled:text-slate-400"
          >
            {resendMutation.isPending ? 'Sending…' : 'Resend code'}
          </button>
          <Link to="/login" className="text-slate-600 hover:text-slate-900">
            Back to log in
          </Link>
        </div>
      </form>
    </section>
  );
}
