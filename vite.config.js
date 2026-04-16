import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import path from 'node:path';
var repoName = 'country-dash';
var isPagesBuild = process.env.GITHUB_ACTIONS === 'true';
export default defineConfig({
    plugins: [
        paraglideVitePlugin({
            project: './project.inlang',
            outdir: './src/paraglide',
            strategy: ['cookie', 'preferredLanguage', 'baseLocale'],
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    base: isPagesBuild ? "/".concat(repoName, "/") : '/',
    build: {
        sourcemap: true,
    },
});
