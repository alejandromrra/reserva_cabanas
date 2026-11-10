import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  // Carpeta de publicación. Por defecto «/» (dominio propio); para una subcarpeta: VITE_BASE=/reserva_cabanas/ npm run build
  base: loadEnv(mode, '.', 'VITE_').VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));
