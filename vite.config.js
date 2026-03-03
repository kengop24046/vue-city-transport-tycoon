import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const GITHUB_REPO_NAME = 'vue-city-transport-tycoon'

export default defineConfig({
  plugins: [vue()],
  base: `/vue-city-transport-tycoon/`,
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})