import { defineConfig } from 'vite';
import shopify from 'vite-plugin-shopify';
import VitePluginShopifyIcons from 'vite-plugin-shopify-icons-liquid';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    shopify({
      themeRoot: './',
      sourceCodeDir: 'app',
      entrypointsDir: 'app/entrypoints',
      snippetFile: 'vite-app.liquid',
      versionNumbers: false,
      tunnel: false,
      themeHotReload: true,
    }),
    VitePluginShopifyIcons({
      inputDirectory: './app/static/icons',
      outputFile: './snippets/icon.liquid',
      // outputFileJSON: 'icon.json',
      previewFile: 'icon-preview.html',
      verbose: true,
      preview: true,
      openPreview: false,
      flattenFolders: true,
      svgoConfig: {
        multipass: true,
        plugins: ['removeDimensions', { name: 'removeAttrs', params: { attrs: '(data-name)' } }],
      },
    }),
    tailwindcss(),
  ],
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, PUT, POST, PATCH, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
    cors: {
      origin: ['https://*.myshopify.com', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:9292'],
      methods: ['GET', 'HEAD', 'PUT', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        chunkFileNames: '[name].js',
        preserveModules: false,
        manualChunks: undefined,
      },
    },
  },
});
