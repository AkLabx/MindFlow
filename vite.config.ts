import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Vite Configuration File
 *
 * This configuration sets up the Vite build tool for the React application.
 * It handles environment variables, server settings, plugin integration (React, PWA),
 * and path aliases.
 *
 * @param {object} configEnv - The configuration environment object.
 * @param {string} configEnv.mode - The mode the app is running in (e.g., 'development', 'production').
 * @returns {import('vite').UserConfig} The Vite configuration object.
 */
export default defineConfig(({ mode }) => {
    // Load environment variables based on the current mode
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

    // Set base path: '/MindFlow/' for GitHub Pages production deploy, '/' for local development
    const base = isProduction ? '/MindFlow/' : '/';

    return {
      // Sets the base path for production to /MindFlow/ (Repo Name) and / for local dev
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['mindflow-icon.svg'],
          manifest: {
            name: 'MindFlow Quiz',
            short_name: 'MindFlow',
            description: 'Master subjects with adaptive quizzes and detailed explanations.',
            theme_color: '#4f46e5', // Indigo-600
            background_color: '#f9fafb', // Gray-50
            display: 'standalone',
            scope: base,
            start_url: base,
            orientation: 'portrait',
            display_override: ['standalone', 'fullscreen', 'minimal-ui'],
            icons: [
              {
                src: 'mindflow-icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            // Cache Google Fonts and other static assets
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        // Expose environment variables to the client-side code
        // Handles fallback logic to ensure keys are populated
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.GOOGLE_AI_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('./src'), // Maps '@' to the src directory for cleaner imports
        }
      }
    };
});
