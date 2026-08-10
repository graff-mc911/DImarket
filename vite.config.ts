import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? `local-${Date.now()}`

// Робимо так само, як на scblight.com:
// без відносної base-адреси, щоб сайт працював від кореня домену.
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dimarket-build-id',
      closeBundle() {
        const outDir = resolve(__dirname, 'dist')
        mkdirSync(outDir, { recursive: true })
        writeFileSync(resolve(outDir, 'build-id.txt'), `${buildId}\n`, 'utf8')
      },
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `    <meta name="dimarket-build" content="${buildId}" />\n  </head>`,
        )
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@sentry')) return 'sentry'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'
          if (id.includes('lucide-react')) return 'icons'
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-vendor'
          }
          return 'vendor'
        },
      },
    },
  },
})
