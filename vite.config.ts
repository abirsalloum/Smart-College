
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env file from the current directory based on `mode`
  // The third parameter '' loads all env vars regardless of the VITE_ prefix
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This "bakes" the API_KEY from your .env file into the code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      port: 3000
    }
  };
});
