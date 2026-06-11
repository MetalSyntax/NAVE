import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'logo192.png', 'logo512.png'],
        manifest: {
          name: "NAVE | Control de Motos",
          short_name: "NAVE",
          start_url: "/",
          display: "standalone",
          background_color: "#111111",
          theme_color: "#000000",
          description: "App venezolana para el control y mantenimiento de tu moto.",
          icons: [
            {
              src: "/logo192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/logo512.png",
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: "/logo512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
