import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to copy only favicon files in production
    {
      name: 'copy-favicons',
      writeBundle() {
        if (process.env.NODE_ENV === 'production') {
          // Copy only favicon files to dist
          const faviconFiles = ['vite.svg', 'favicon.ico']
          faviconFiles.forEach(file => {
            const src = resolve(__dirname, 'public', file)
            const dest = resolve(__dirname, 'dist', file)
            if (existsSync(src)) {
              copyFileSync(src, dest)
              console.log(`Copied ${file} to dist/`)
            }
          })
        }
      }
    }
  ],
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
  publicDir: process.env.NODE_ENV === 'production' ? false : 'public',
  server: {
    port: 3000,
  },
})
