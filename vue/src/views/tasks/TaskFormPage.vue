<script setup lang="ts">
import { computed, watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useRouter, useRoute } from "vue-router";
import { tasksApi } from "../../api/tasks";

const TaskSchema = toTypedSchema(
  z.object({
    title: z.string().min(1, "Title is required").max(200, "Max 200 characters"),
    done: z.boolean(),
  }),
);

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();

const id = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => Boolean(id.value));

const taskQuery = useQuery({
  queryKey: computed(() => ["tasks", id.value]),
  queryFn: () => tasksApi.get(id.value!),
  enabled: isEdit,
});

const { defineField, handleSubmit, errors, setValues } = useForm({
  validationSchema: TaskSchema,
  initialValues: { title: "", done: false },
});

watch(
  () => taskQuery.data.value,
  (task) => {
    if (task) setValues({ title: task.title, done: task.done });
  },
);

const [title, titleAttrs] = defineField("title");
const [done, doneAttrs] = defineField("done");

const submitMutation = useMutation({
  mutationFn: (values: { title: string; done: boolean }) => (isEdit.value ? tasksApi.update(id.value!, values) : tasksApi.create(values)),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    router.push("/tasks");
  },
});

const serverError = computed(() => (submitMutation.isError.value ? (submitMutation.error.value instanceof Error ? submitMutation.error.value.message : "Save failed") : ""));

const onSubmit = handleSubmit((values) => submitMutation.mutate(values));

const heading = computed(() => (isEdit.value ? "Edit task" : "New task"));
</script>

<template>
  <section class="mx-auto max-w-xl p-4">
    <div class="mb-4 flex items-baseline justify-between">
      <h2 class="text-2xl font-semibold text-slate-900">{{ heading }}</h2>
      <RouterLink to="/tasks" class="text-sm text-slate-600 hover:text-slate-900">← Back</RouterLink>
    </div>

    <p v-if="isEdit && taskQuery.isPending.value" class="rounded-lg border border-slate-200 bg-white p-4 text-slate-500">Loading…</p>

    <form v-else class="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" @submit="onSubmit">
      <div>
        <label for="title" class="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input id="title" name="title" v-model="title" v-bind="titleAttrs" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" :class="errors.title ? 'border-red-500' : ''" />
        <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
      </div>

      <div class="flex items-center gap-2">
        <input id="done" v-model="done" v-bind="doneAttrs" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
        <label for="done" class="text-sm text-slate-700">Mark as done</label>
      </div>

      <p v-if="serverError" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
        {{ serverError }}
      </p>

      <div class="flex justify-end gap-2 pt-2">
        <RouterLink to="/tasks" class="rounded-md px-4 py-2 text-slate-700 hover:bg-slate-100"> Cancel </RouterLink>
        <button type="submit" :disabled="submitMutation.isPending.value" class="rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
          {{ submitMutation.isPending.value ? "Saving…" : isEdit ? "Save changes" : "Create task" }}
        </button>
      </div>
    </form>
  </section>
</template>
