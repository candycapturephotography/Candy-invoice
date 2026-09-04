import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';

/**
 * Electron-vite configuration for main and preload only.
 * Used for production builds where the renderer is copied from pre-built web app.
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
});
