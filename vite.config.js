import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Plugin: copies manifest.json and static assets into dist/ after every build.
function chromeExtensionAssets() {
  return {
    name: 'chrome-extension-assets',
    closeBundle() {
      const pairs = [
        ['manifest.json', 'dist/manifest.json'],
        ['src/content/content.css', 'dist/content/content.css'],
      ];

      const iconSizes = ['16', '48', '128'];
      for (const size of iconSizes) {
        const src = `static/icons/icon${size}.png`;
        if (existsSync(src)) pairs.push([src, `dist/icons/icon${size}.png`]);
      }

      const providerIcons = ['openai', 'anthropic', 'grok', 'gemini'];
      for (const name of providerIcons) {
        const src = `static/icons/${name}.svg`;
        if (existsSync(src)) pairs.push([src, `dist/icons/${name}.svg`]);
      }

      for (const [src, dest] of pairs) {
        const dir = dest.substring(0, dest.lastIndexOf('/'));
        mkdirSync(dir, { recursive: true });
        copyFileSync(src, dest);
      }
    },
  };
}

export default defineConfig({
  plugins: [svelte(), chromeExtensionAssets()],

  resolve: {
    alias: { $lib: resolve('src/lib') },
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // keeps the bundle readable; set to 'esbuild' for production

    rollupOptions: {
      input: {
        // UI pages (Svelte apps)
        'panel/index': resolve('src/panel/index.html'),
        'options/index': resolve('src/options/index.html'),
        // Background service worker (bundled as a single ES module)
        'service-worker': resolve('src/background/service-worker.js'),
        // Content script (plain JS, no Svelte)
        'content/content': resolve('src/content/content.js'),
      },

      output: {
        // Named entries go to predictable paths the manifest references.
        entryFileNames(chunk) {
          if (chunk.name === 'service-worker') return 'service-worker.js';
          if (chunk.name === 'content/content') return 'content/content.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
