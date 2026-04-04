import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
var repoName = 'country-dash';
var isPagesBuild = process.env.GITHUB_ACTIONS === 'true';
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: isPagesBuild ? '/'.concat(repoName, '/') : '/',
  build: {
    sourcemap: true,
  },
});
