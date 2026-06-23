<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { useRouter } from "vue-router";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../stores/auth";

const EmailSchema = toTypedSchema(z.object({ email: z.string().email("Enter a valid email") }));

const CodeSchema = toTypedSchema(
  z.object({
    code: z
      .string()
      .length(6, "Must be exactly 6 characters")
      .regex(/^[A-Z0-9]+$/i, "Use only A-Z and 0-9"),
  }),
);

const step = ref<"email" | "code">("email");
const capturedEmail = ref("");

const emailForm = useForm({ validationSchema: EmailSchema });
const codeForm = useForm({ validationSchema: CodeSchema });

const blurOnly = { validateOnModelUpdate: false, validateOnBlur: true };
const [email, emailAttrs] = emailForm.defineField("email", blurOnly);
const [code, codeAttrs] = codeForm.defineField("code", blurOnly);

const emailServerError = ref("");
const codeServerError = ref("");
const resendMessage = ref("");

const router = useRouter();
const auth = useAuthStore();
const queryClient = useQueryClient();

const requestMutation = useMutation({
  mutationFn: (values: { email: string }) => authApi.requestLoginOtp(values),
  onSuccess: (_data, variables) => {
    capturedEmail.value = variables.email;
    step.value = "code";
  },
  onError: (err) => {
    emailServerError.value = err instanceof Error ? err.message : "Failed to send code";
  },
  meta: { silent: true },
});

const loginMutation = useMutation({
  mutationFn: (values: { code: string }) => authApi.loginWithOtp({ email: capturedEmail.value, code: values.code.toUpperCase() }),
  onSuccess: (data) => {
    auth.applyAuth(data);
    queryClient.setQueryData(["auth", "me"], data.user);
    router.push("/tasks");
  },
  onError: (err) => {
    codeServerError.value = err instanceof Error ? err.message : "Login failed";
  },
  meta: { silent: true },
});

const resendMutation = useMutation({
  mutationFn: () => authApi.resendOtp({ email: capturedEmail.value, purpose: "login" }),
  onSuccess: () => {
    resendMessage.value = "A new code has been sent.";
  },
  meta: { silent: true },
});

const onEmailSubmit = emailForm.handleSubmit((values) => {
  emailServerError.value = "";
  requestMutation.mutate(values);
});

const onCodeSubmit = codeForm.handleSubmit((values) => {
  codeServerError.value = "";
  loginMutation.mutate(values);
});

function useDifferentEmail() {
  step.value = "email";
  codeForm.resetForm();
  loginMutation.reset();
  resendMutation.reset();
  resendMessage.value = "";
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <template v-if="step === 'email'">
      <h2 class="mb-4 text-2xl font-semibold text-slate-900">Log in with email code</h2>
      <p class="mb-4 text-sm text-slate-600">We'll send a 6-character code to your email. No password needed.</p>

      <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" @submit="onEmailSubmit">
        <div>
          <label for="email-field" class="mb-1 block text-sm font-medium text-slate-700"> Email </label>
          <input id="email-field" v-model="email" v-bind="emailAttrs" type="email" autocomplete="email" class="w-full rounded-md border px-3 py-2" :class="emailForm.errors.value.email ? 'border-red-500' : 'border-slate-300'" />
          <p v-if="emailForm.errors.value.email" class="mt-1 text-xs text-red-600">
            {{ emailForm.errors.value.email }}
          </p>
        </div>

        <p v-if="emailServerError" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {{ emailServerError }}
        </p>

        <button type="submit" :disabled="requestMutation.isPending.value" class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
          {{ requestMutation.isPending.value ? "Sending…" : "Send code" }}
        </button>

        <p class="text-center text-sm text-slate-600">
          Prefer a password?
          <RouterLink to="/login" class="text-indigo-600 underline">Log in</RouterLink>
        </p>
      </form>
    </template>

    <template v-else>
      <h2 class="mb-4 text-2xl font-semibold text-slate-900">Enter your code</h2>
      <p class="mb-4 text-sm text-slate-600">
        We sent a 6-character code to <strong>{{ capturedEmail }}</strong
        >. Valid for 10 minutes.
      </p>

      <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" @submit="onCodeSubmit">
        <div>
          <label for="otp-code" class="mb-1 block text-sm font-medium text-slate-700">Code</label>
          <input id="otp-code" v-model="code" v-bind="codeAttrs" type="text" autocomplete="one-time-code" inputmode="text" maxlength="6" placeholder="ABC123" class="w-full rounded-md border px-3 py-3 text-center font-mono text-2xl uppercase tracking-[0.5em]" :class="codeForm.errors.value.code ? 'border-red-500' : 'border-slate-300'" />
          <p v-if="codeForm.errors.value.code" class="mt-1 text-xs text-red-600">
            {{ codeForm.errors.value.code }}
          </p>
        </div>

        <p v-if="codeServerError" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {{ codeServerError }}
        </p>

        <p v-if="resendMessage" class="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
          {{ resendMessage }}
        </p>

        <button type="submit" :disabled="loginMutation.isPending.value" class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
          {{ loginMutation.isPending.value ? "Logging in…" : "Log in" }}
        </button>

        <div class="flex items-center justify-between text-sm">
          <button type="button" :disabled="resendMutation.isPending.value" class="text-indigo-600 hover:text-indigo-800 disabled:text-slate-400" @click="resendMutation.mutate()">
            {{ resendMutation.isPending.value ? "Sending…" : "Resend code" }}
          </button>
          <button type="button" class="text-slate-600 hover:text-slate-900" @click="useDifferentEmail">Use a different email</button>
        </div>
      </form>
    </template>
  </section>
</template>
