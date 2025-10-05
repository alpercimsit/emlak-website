import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/turkey': {
        target: 'https://turkiyeapi.dev/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/turkey/, ''),
        secure: true
      }
    }
  },
  build: {
    // Optimize for production
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  }
});

