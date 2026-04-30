import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { productImportPlugin } from './vite.plugins/productImport'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), productImportPlugin()],
})
