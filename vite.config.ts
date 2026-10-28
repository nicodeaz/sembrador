import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Default: subdomain root. Override for a subdirectory release.
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // El backend PHP (api/*.php) lo sirve el Apache de XAMPP en
      // http://localhost/sembrador/ (esta misma carpeta es su docroot).
      // El dev server de Vite reenvía /api hacia ahí para poder probar
      // login/datos en caliente sin tener que buildear.
      proxy: {
        '/api': {
          target: process.env.SEMBRADOR_API_TARGET || 'http://localhost/sembrador',
          changeOrigin: true,
        },
      },
    },
  };
});
