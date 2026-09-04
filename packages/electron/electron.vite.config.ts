import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';

/**
 * Electron-vite configuration for CandyCapture Photography desktop app.
 *
 * Build Process:
 * 1. Main process (src/main.ts) - Electron main process
 * 2. Preload (src/preload.ts) - Context bridge for IPC
 * 3. Renderer - Uses pre-built web app from packages/web/dist
 *
 * For production builds:
 * - Build web app first: cd packages/web && pnpm build
 * - Then build electron: npm run build:full
 */
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/main.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'src/preload.ts'),
        },
      },
    },
  },
  renderer: {
    // Renderer configuration for development mode
    // In production, we copy the pre-built web app using copy-web-dist.js
    root: resolve(__dirname, '../web'),
    build: {
      outDir: resolve(__dirname, 'dist/renderer'),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: resolve(__dirname, '../web/index.html'),
        },
      },
    },
    // Development server proxies to Vite dev server
    server: {
      port: 5173,
    },
  },
});
