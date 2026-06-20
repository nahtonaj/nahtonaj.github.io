import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/bill-splitter/',
  plugins: [react()],
  build: {
    outDir: '../../dist/bill-splitter',
    emptyOutDir: true,
  }
})
