import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    // Note: COEP/COOP headers removed to allow CDN resources
    // js-dos handles WASM loading internally
  },

  // Build configuration for production
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: 'hidden', // Generate source maps but don't reference them in production bundles
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
          }
        },
      },
    },
  },

  // Asset handling
  assetsInclude: ['**/*.wasm', '**/*.jsdos'],

  // Optimize dependencies
  optimizeDeps: {
    exclude: ['js-dos'], // Don't pre-bundle js-dos to preserve WASM loading
  },

  // Preview server configuration
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },
})
