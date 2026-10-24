import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Version « navigateur » de l'interface (sans Electron) : sert à tester la ville dans un simple onglet.
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, 'src/renderer/src') } },
  build: {
    outDir: resolve(__dirname, 'out/web'),
    emptyOutDir: true,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } }
  }
})
