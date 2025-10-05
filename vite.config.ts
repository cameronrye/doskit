import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // Copy Open Watcom toolchain to dist/watcom
    viteStaticCopy({
      targets: [
        {
          src: 'public/watcom',
          dest: '.'
        }
      ]
    }),

    // Compress assets with Brotli and gzip
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240, // Only compress files > 10KB
      deleteOriginFile: false,
      // Include Open Watcom binaries for compression
      filter: /\.(js|css|html|svg|wasm|exe|lib)$/,
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
      // Include Open Watcom binaries for compression
      filter: /\.(js|css|html|svg|wasm|exe|lib)$/,
    }),
  ],

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
    // Optimize chunk splitting for better caching and loading performance
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Monaco Editor (code editor) - large dependency, separate chunk
            if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
              return 'monaco-vendor';
            }
            // js-dos and related WASM libraries
            if (id.includes('js-dos')) {
              return 'jsdos-vendor';
            }
            // JSZip for file compression
            if (id.includes('jszip')) {
              return 'jszip-vendor';
            }
            // All other node_modules
            return 'vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit for WASM files
    chunkSizeWarningLimit: 1000, // 1000 KB (1 MB)
  },

  // Asset handling - include Open Watcom binaries and libraries
  assetsInclude: ['**/*.wasm', '**/*.jsdos', '**/*.exe', '**/*.lib'],

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
