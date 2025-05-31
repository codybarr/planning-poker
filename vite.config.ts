import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths(), svgr()],
  server: {
    proxy: {
      '/parties': {
        target: 'http://localhost:1999',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})