import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
