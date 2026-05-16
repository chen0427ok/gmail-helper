import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'
import webExtension from 'vite-plugin-web-extension'

export default defineConfig({
  plugins: [
    preact(),
    webExtension({
      manifest: 'manifest.json',
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
  },
})
