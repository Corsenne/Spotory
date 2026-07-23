import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_BASE_PATH || '/';
  return { base, plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate', includeAssets: ['offline.html'],
    manifest: { name: env.VITE_APP_NAME || 'Spotory', short_name: 'Spotory', description: '写真と地図で場所の思い出を記録・共有', theme_color: '#0f766e', background_color: '#f8fafc', display: 'standalone', start_url: base, scope: base, lang: 'ja', share_target: { action: `${base}?share-target=1`, method: 'GET', enctype: 'application/x-www-form-urlencoded', params: { title: 'title', text: 'text', url: 'url' } }, icons: [{ src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] },
    workbox: { navigateFallback: 'index.html', skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true, runtimeCaching: [{ urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\//, handler: 'NetworkFirst', options: { cacheName: 'spotory-api', networkTimeoutSeconds: 5, expiration: { maxEntries: 50, maxAgeSeconds: 86400 } } }] }
  })], test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', css: true } };
});
