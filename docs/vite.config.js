import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3003,
    fs: {
      allow: [resolve(__dirname, '..')],
    },
  },
  resolve: {
    alias: {
      '@skill': resolve(__dirname, 'skill'),
      '@mcp': resolve(__dirname, '../mcp-server'),
    },
  },
})
