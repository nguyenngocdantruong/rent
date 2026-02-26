import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Tải biến môi trường từ .env
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'https://api.viotp.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/zyx': {
          // Lấy URL từ biến môi trường MOCK_API_URL
          target: env.MOCK_API_URL || '',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/zyx/, ''),
          headers: {
            'X-Internal-Secret': env.VITE_API_TOKEN || ''
          }
        },
      },
    },
    build: {
      rollupOptions: {
        input: 'index.html',
      },
    },
  };
});
