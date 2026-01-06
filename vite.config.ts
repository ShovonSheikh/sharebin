import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/v1': {
        target: 'https://gcwllpqedjcihrzexixq.supabase.co/functions/v1/api-pastes',
        changeOrigin: true,
        rewrite: (path) => {
          // Convert /api/v1/create -> ?action=create, etc.
          const action = path.replace('/api/v1/', '');
          // Keep query params if present
          return action.includes('?') ? action.substring(action.indexOf('?')) : '';
        },
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward the original host to the edge function
            const host = req.headers.host || 'localhost:8080';
            proxyReq.setHeader('X-Forwarded-Host', host);
            proxyReq.setHeader('X-Forwarded-Proto', 'http');
          });
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
