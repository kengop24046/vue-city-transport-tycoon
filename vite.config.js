import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  
  return {
    plugins: [vue()],
    base: env.VITE_BASE_URL || (mode === 'gh-pages' ? '/vue-city-transport-tycoon/' : '/'),
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets'
    },
    publicDir: 'public'
  }
})