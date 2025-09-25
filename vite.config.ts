import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    __EXCLUDE_MOCK__: process.env.NODE_ENV === 'production',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 프로덕션에서 mock 파일들을 별도 청크로 분리하여 제외
          if (process.env.NODE_ENV === 'production' &&
              (id.includes('mockData') || id.includes('reservationMock'))) {
            return undefined // 번들에서 제외
          }

          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor'
            }
            if (id.includes('react-router-dom')) {
              return 'router'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query'
            }
            if (id.includes('framer-motion') || id.includes('@headlessui/react')) {
              return 'ui'
            }
          }
        },
      },
    },
  },
  server: {
    port: 3000,
  },
})
