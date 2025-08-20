import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // because your site will live at /poker-loca/ under your username
  base: '/poker-loca/',
})
