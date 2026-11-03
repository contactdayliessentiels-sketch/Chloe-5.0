import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['chloe-avatar-fullbody.webp', 'assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp'],
        manifest: {
          id: '/',
          name: 'CHLOÉ AI',
          short_name: 'CHLOÉ AI',
          description: 'Assistante personnelle intelligente et multimodale pour Samsung Galaxy S24 (Édition 5.0).',
          theme_color: '#090B14',
          background_color: '#070913',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/chloe-avatar-fullbody.webp',
              sizes: '192x192',
              type: 'image/webp',
              purpose: 'any',
            },
            {
              src: '/chloe-avatar-fullbody.webp',
              sizes: '512x512',
              type: 'image/webp',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
