import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 🔥 this is critical
  build: {
    outDir: 'dist',
  },
})
