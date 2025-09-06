import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Questa è la configurazione di default
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Copia tutti i file dalla cartella public
    copyPublicDir: true
  }
})
