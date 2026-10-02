import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,vue}'],
      reporter: ['text'],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
})
