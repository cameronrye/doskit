import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Custom domain deployment configuration
  // Using custom domain doskit.net, so base path is '/'
  base: '/',

  // Optimize for cross-platform compatibility
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    strictPort: false,
    // No COOP/COEP headers: js-dos doesn't need cross-origin isolation, and
    // GitHub Pages can't send them, so dev matches production.
  },

  // Build configuration for production
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: 'hidden', // Generate source maps but don't reference them in production bundles
    rolldownOptions: {
      output: {
        // React changes far less often than the app, so its own chunk stays cached across
        // releases. A group also pulls in what its modules import (scheduler).
        codeSplitting: {
          groups: [{ name: 'react-vendor', test: /node_modules[\\/]react(-dom)?[\\/]/ }],
        },
      },
    },
  },

  // Preview server configuration
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },
});
