import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Support both GEMINI_API_KEY and VITE_GEMINI_API_KEY for deployment environments
    const resolvedApiKey = env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? '';
  return {
      server: {
        port: 3002,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
          '/api': 'http://localhost:4001',
        },
      },
      preview: {
        port: 3002,
        strictPort: true,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      // Do not expose secret keys to client bundle; backend should use env directly
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
