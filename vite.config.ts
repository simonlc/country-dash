import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import path from 'node:path';

const repoName = 'country-dash';
const isPagesBuild = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: isPagesBuild ? `/${repoName}/` : '/',
  build: {
    sourcemap: true,
  },
});
