<script setup lang="ts">
import { ref, computed } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { useRouter, useRoute } from "vue-router";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../stores/auth";

const VerifyEmailSchema = toTypedSchema(
  z.object({
    email: z.string().email("Enter a valid email"),
    code: z
      .string()
      .length(6, "Must be exactly 6 characters")
      .regex(/^[A-Z0-9]+$/i, "Use only A-Z and 0-9"),
  }),
);

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const queryClient = useQueryClient();

const { defineField, handleSubmit, errors, values } = useForm({
  validationSchema: VerifyEmailSchema,
  initialValues: {
    email: (route.query.email as string) ?? "",
    code: "",
  },
});

const blurOnly = { validateOnModelUpdate: false, validateOnBlur: true };
const [email, emailAttrs] = defineField("email", blurOnly);
const [code, codeAttrs] = defineField("code", blurOnly);

const emailVal = computed(() => values.email ?? "");
const serverError = ref("");
const resendMessage = ref("");
const resendError = ref("");

const verifyMutation = useMutation({
  mutationFn: (vals: { email: string; code: string }) => authApi.verifyEmail({ email: vals.email, code: vals.code.toUpperCase() }),
  onSuccess: (data) => {
    auth.applyAuth(data);
    queryClient.setQueryData(["auth", "me"], data.user);
    router.push("/tasks");
  },
  onError: (err) => {
    serverError.value = err instanceof Error ? err.message : "Verification failed";
  },
  meta: { silent: true },
});

const resendMutation = useMutation({
  mutationFn: () => authApi.resendOtp({ email: emailVal.value, purpose: "register" }),
  onSuccess: () => {
    resendMessage.value = "A new code has been sent. Check your email.";
    resendError.value = "";
  },
  onError: (err) => {
    resendError.value = err instanceof Error ? err.message : "Resend failed";
    resendMessage.value = "";
  },
  meta: { silent: true },
});

const onSubmit = handleSubmit((vals) => {
  serverError.value = "";
  verifyMutation.mutate(vals);
});
</script>

<template>
  <section class="mx-auto max-w-md">
    <h2 class="mb-4 text-2xl font-semibold text-slate-900">Verify your email</h2>
    <p class="mb-4 text-sm text-slate-600">Enter the 6-character code we sent. It's valid for 10 minutes.</p>

    <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" @submit="onSubmit">
      <div>
        <label for="email-field" class="mb-1 block text-sm font-medium text-slate-700"> Email </label>
        <input id="email-field" name="email" v-model="email" v-bind="emailAttrs" type="email" autocomplete="email" class="w-full rounded-md border px-3 py-2" :class="errors.email ? 'border-red-500' : 'border-slate-300'" />
        <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
      </div>

      <div>
        <label for="otp-code-field" class="mb-1 block text-sm font-medium text-slate-700"> Code </label>
        <input id="otp-code-field" name="code" v-model="code" v-bind="codeAttrs" type="text" autocomplete="one-time-code" inputmode="text" maxlength="6" placeholder="ABC123" class="w-full rounded-md border px-3 py-3 text-center font-mono text-2xl uppercase tracking-[0.5em]" :class="errors.code ? 'border-red-500' : 'border-slate-300'" />
        <p v-if="errors.code" class="mt-1 text-xs text-red-600">{{ errors.code }}</p>
      </div>

      <p v-if="serverError" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
        {{ serverError }}
      </p>

      <p v-if="resendMessage" class="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
        {{ resendMessage }}
      </p>

      <p v-if="resendError" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
        {{ resendError }}
      </p>

      <button type="submit" :disabled="verifyMutation.isPending.value" class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
        {{ verifyMutation.isPending.value ? "Verifying…" : "Verify and log in" }}
      </button>

      <div class="flex items-center justify-between text-sm">
        <button type="button" :disabled="resendMutation.isPending.value || !emailVal" class="text-indigo-600 hover:text-indigo-800 disabled:text-slate-400" @click="resendMutation.mutate()">
          {{ resendMutation.isPending.value ? "Sending…" : "Resend code" }}
        </button>
        <RouterLink to="/login" class="text-slate-600 hover:text-slate-900"> Back to log in </RouterLink>
      </div>
    </form>
  </section>
</template>
