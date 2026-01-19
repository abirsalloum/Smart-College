import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  base: '/Smart-College/',
  plugins: [react()],
  build: {
    outDir: 'docs' // 👈 ONLY new line
  },
  define: {
    'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
  },
  server: {
    port: 3000
  }
}

})
