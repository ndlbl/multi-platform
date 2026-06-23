<script setup lang="ts">
const features = [
  {
    title: "Lorem ipsum",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
  },
  {
    title: "Dolor sit amet",
    body: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
  },
  {
    title: "Consectetur",
    body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.",
  },
];
</script>

<template>
  <div class="space-y-16">
    <!-- Hero -->
    <section class="mx-auto max-w-4xl p-4 text-center">
      <h1 class="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Organise your tasks and library reading lists, all in one place</h1>
      <p class="mx-auto mt-4 max-w-4xl text-lg text-slate-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation</p>
      <div class="mt-8 flex items-center justify-center gap-3">
        <RouterLink to="/register" class="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700"> Get started </RouterLink>
        <RouterLink to="/login" class="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"> Log in </RouterLink>
      </div>
    </section>

    <section class="mx-auto max-w-4xl p-4">
      <div class="grid gap-6 sm:grid-cols-3">
        <div v-for="feature in features" :key="feature.title" class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900">{{ feature.title }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ feature.body }}</p>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-4xl p-4">
      <div class="rounded-xl bg-slate-900 px-6 py-12 text-center">
        <h2 class="mt-6 text-2xl font-semibold text-white">Ready to get organised?</h2>
        <p class="mx-auto mt-2 max-w-xl text-slate-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.</p>
        <RouterLink to="/register" class="mt-6 inline-block rounded-md bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"> Create an account </RouterLink>
      </div>
    </section>
  </div>
</template>
