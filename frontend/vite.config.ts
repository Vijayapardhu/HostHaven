import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    allowedHosts: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ['logo.png', 'pwa-icon-192.png', 'pwa-icon-512.png'],
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "HostHaven",
        short_name: "HostHaven",
        description: "Find and book hotels, homes and unique stays in Andhra Pradesh",
        theme_color: "#f97316",
        background_color: "#0a0a0f",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["travel", "lifestyle", "shopping"],
        platforms: ["webapp", "play_store"],
        prefer_related_applications: false,
        icons: [
          {
            src: '/pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: "Search Hotels",
            url: "/hotels",
            description: "Browse available hotels',",
          },
          {
            name: "My Bookings",
            url: "/bookings",
            description: "View your bookings",
          },
          {
            name: "Explore Homes",
            url: "/homes",
            description: "Browse unique home stays",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Auth endpoints - always go to network, never cache
            urlPattern: ({ url }: { url: URL }) => 
              url.pathname.startsWith("/v1/auth/") ||
              url.pathname.startsWith("/v1/users/me"),
            handler: "NetworkOnly",
          },
          {
            // Property listings, search — NetworkFirst so data is fresh
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/v1/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 10 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Razorpay checkout — bypass cache always
            urlPattern: /^https:\/\/checkout\.razorpay\.com\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
