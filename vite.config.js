import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative asset URLs so the app works from GitHub Pages project sites
  // (e.g. https://sparkydjx.github.io/prayers/) and from local file preview of dist/.
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icon.svg',
        'icon-maskable.svg',
        'celtic-abbey-hero.jpg'
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,woff2,mp3,webm}']
      },
      manifest: {
        name: 'Holy Rosary',
        short_name: 'Rosary',
        description:
          'Pray the rosary in a Celtic abbey setting — installable offline PWA',
        theme_color: '#2f3630',
        background_color: '#1c221c',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: './icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: './icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})
