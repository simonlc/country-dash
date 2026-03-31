import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
        },
        environment: 'jsdom',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        exclude: ['tests/e2e/**'],
        setupFiles: ['./src/test/setup.ts'],
    },
});
