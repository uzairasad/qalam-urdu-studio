import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Set by the Tauri CLI when it builds or runs the desktop/mobile app (src-tauri/).
const isNativeApp = Boolean(process.env.TAURI_ENV_PLATFORM);

export default defineConfig(() => {
  return {
    // Keep Tauri's Rust compiler output visible during `npm run app:dev`.
    clearScreen: !isNativeApp,
    plugins: [
      react(),
      tailwindcss(),
      // No service worker in the native app: its files are already local.
      !isNativeApp && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Qalam Urdu Studio',
          short_name: 'Qalam Studio',
          description: 'Qalam Urdu Studio for Windows - Nastaliq typesetting, multi-layout Urdu keyboards, and print layout publishing.',
          theme_color: '#0f172a',
          background_color: '#eef1f6',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/Qalam_Urdu_Studio.html'],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Tauri loads exactly devUrl (port 3000), so never drift to another port.
      strictPort: isNativeApp,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
