<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/vue-query";
import { useRouter } from "vue-router";
import { authApi } from "../../api/auth";

const PasswordSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .refine((p) => /[a-z]/.test(p), "Must contain a lowercase letter")
  .refine((p) => /[A-Z]/.test(p), "Must contain an uppercase letter")
  .refine((p) => /\d/.test(p), "Must contain a number")
  .refine((p) => /[^a-zA-Z0-9]/.test(p), "Must contain a special character");

const RegisterSchema = toTypedSchema(
  z
    .object({
      email: z.string().email("Enter a valid email"),
      password: PasswordSchema,
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      path: ["confirm"],
      message: "Passwords don't match",
    }),
);

const { defineField, handleSubmit, errors } = useForm({ validationSchema: RegisterSchema });

const blurOnly = { validateOnModelUpdate: false, validateOnBlur: true };
const [email, emailAttrs] = defineField("email", blurOnly);
const [password, passwordAttrs] = defineField("password", blurOnly);
const [confirm, confirmAttrs] = defineField("confirm", blurOnly);

const serverError = ref("");
const router = useRouter();

const registerMutation = useMutation({
  mutationFn: ({ email, password }: { email: string; password: string; confirm: string }) => authApi.register({ email, password }),
  onSuccess: (data) => {
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
  },
  onError: (err) => {
    serverError.value = err instanceof Error ? err.message : "Registration failed";
  },
  meta: { silent: true },
});

const onSubmit = handleSubmit((values) => {
  serverError.value = "";
  registerMutation.mutate(values);
});
</script>

<template>
  <section class="mx-auto max-w-md">
    <h2 class="mb-4 text-2xl font-semibold text-slate-900">Register</h2>

    <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" @submit="onSubmit">
      <div>
        <label for="email-field" class="mb-1 block text-sm font-medium text-slate-700"> Email </label>
        <input id="email-field" name="email" v-model="email" v-bind="emailAttrs" type="email" class="w-full rounded-md border px-3 py-2" :class="errors.email ? 'border-red-500' : 'border-slate-300'" />
        <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
      </div>

      <div>
        <label for="password-field" class="mb-1 block text-sm font-medium text-slate-700"> Password </label>
        <input id="password-field" name="password" v-model="password" v-bind="passwordAttrs" type="password" class="w-full rounded-md border px-3 py-2" :class="errors.password ? 'border-red-500' : 'border-slate-300'" />
        <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
      </div>

      <div>
        <label for="password-confirm-field" class="mb-1 block text-sm font-medium text-slate-700"> Confirm password </label>
        <input id="password-confirm-field" name="confirm" v-model="confirm" v-bind="confirmAttrs" type="password" class="w-full rounded-md border px-3 py-2" :class="errors.confirm ? 'border-red-500' : 'border-slate-300'" />
        <p v-if="errors.confirm" class="mt-1 text-xs text-red-600">{{ errors.confirm }}</p>
      </div>

      <p v-if="serverError" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
        {{ serverError }}
      </p>

      <button type="submit" :disabled="registerMutation.isPending.value" class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
        {{ registerMutation.isPending.value ? "Creating account…" : "Register" }}
      </button>

      <p class="text-center text-sm text-slate-600">
        Already have an account?
        <RouterLink to="/login" class="text-indigo-600 underline">Log in</RouterLink>
      </p>
    </form>
  </section>
</template>
