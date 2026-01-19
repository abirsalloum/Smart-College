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
