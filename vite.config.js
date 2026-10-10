import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      // Use PORT from .env or fallback to 5173
      port: Number(env.PORT) || 5173,
      // Expose to network (useful for testing on other devices)
      host: true,
      proxy: {
        '/api': {
          // Use VITE_API_URL from .env or default to backend address
          target: env.VITE_API_URL || 'http://127.0.0.1:8000',
          changeOrigin: true
        }
      }
    }
  };
});
