import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'
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
        writeFileSync(resolve(__dirname, 'dist/build-id.txt'), `${buildId}\n`, 'utf8')
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
})
