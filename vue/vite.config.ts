import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],

  // @ts-expect-error — vite-ssg extends vite's UserConfig with ssgOptions at build time
  ssgOptions: {
    formatting: 'minify',
    // Only prerender the public marketing pages — authenticated routes need live data
    includedRoutes: (paths: string[]) => paths.filter((p) => ['/', '/about'].includes(p)),
  },

  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
      },
    },
  },
});
