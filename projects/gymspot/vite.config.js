import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/gymspot/',
  plugins: [react()],
  build: {
    outDir: '../../dist/gymspot',
    emptyOutDir: true,
  }
})
