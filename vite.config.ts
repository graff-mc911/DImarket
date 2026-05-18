import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Робимо так само, як на scblight.com:
// без відносної base-адреси, щоб сайт працював від кореня домену.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
