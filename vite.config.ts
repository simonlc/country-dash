import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import path from 'node:path';

export default defineConfig(({ command }) => ({
  server: {
    allowedHosts: ['rancidity-applause-nursing.ngrok-free.dev'],
  },
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['cookie', 'preferredLanguage', 'baseLocale'],
      outputStructure:
        command === 'serve' ? 'locale-modules' : 'message-modules',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: '/',
  build: {
    sourcemap: true,
  },
}));
