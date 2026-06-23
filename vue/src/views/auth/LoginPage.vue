<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { useRouter, useRoute } from "vue-router";
import { authApi } from "../../api/auth";
import { ApiError } from "../../api/client";
import { useAuthStore } from "../../stores/auth";

const LoginSchema = toTypedSchema(
  z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
  }),
);

const { defineField, handleSubmit, errors } = useForm({ validationSchema: LoginSchema });

const blurOnly = { validateOnModelUpdate: false, validateOnBlur: true };
const [email, emailAttrs] = defineField("email", blurOnly);
const [password, passwordAttrs] = defineField("password", blurOnly);

const serverError = ref("");
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const queryClient = useQueryClient();

const from = (route.query.returnUrl as string) ?? "/tasks";

const loginMutation = useMutation({
  mutationFn: authApi.login,
  onSuccess: (data) => {
    auth.applyAuth(data);
    queryClient.setQueryData(["auth", "me"], data.user);
    router.push(from);
  },
  onError: (err, variables) => {
    if (err instanceof ApiError && err.body?.requiresVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
      return;
    }
    serverError.value = err instanceof Error ? err.message : "Login failed";
  },
  meta: { silent: true },
});

const onSubmit = handleSubmit((values) => {
  serverError.value = "";
  loginMutation.mutate(values);
});
</script>

<template>
  <section class="mx-auto max-w-md">
    <h2 class="mb-4 text-2xl font-semibold text-slate-900">Log in</h2>

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

      <p v-if="serverError" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
        {{ serverError }}
      </p>

      <button type="submit" :disabled="loginMutation.isPending.value" class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
        {{ loginMutation.isPending.value ? "Signing in…" : "Log in" }}
      </button>

      <p class="text-center text-sm text-slate-600">
        No account?
        <RouterLink to="/register" class="text-indigo-600 underline">Register</RouterLink>
      </p>

      <div class="text-center">
        <span class="text-sm text-slate-400">— or —</span>
      </div>

      <RouterLink to="/login-otp" class="block w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm text-slate-700 hover:bg-slate-50"> Log in with email code </RouterLink>
    </form>
  </section>
</template>
