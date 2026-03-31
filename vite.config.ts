import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const repoName = 'country-guesser';
const isPagesBuild = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  plugins: [react()],
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
