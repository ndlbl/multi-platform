import type { Config } from '@react-router/dev/config';

export default {
  // Keep the existing src/ layout instead of the framework default app/.
  appDirectory: 'src',

  // SPA mode: no Node server, the app is client-rendered…
  ssr: false,

  // …except these public marketing pages, which are prerendered to static HTML
  // at build time (SSG). Everything past login stays client-only.
  prerender: ['/', '/about'],
} satisfies Config;
