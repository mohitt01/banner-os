import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
  title: 'BannerOS',
  // Served at /docs/ by the unified server
  base: '/docs/',
  // Markdown source lives in docs/pages/
  srcDir: 'pages',

  vite: {
    plugins: [
      llmstxt({
        excludeIndexPage: false,
        ignoreFiles: ['ai-*'],
        title: 'BannerOS',
      }),
    ],
  },

  themeConfig: {
    // Logo in the nav bar
    logo: '/favicon.svg',

    nav: [
      { text: 'Open Dashboard', link: 'javascript:window.location.href="/"', target: '_self', rel: '' },
    ],

    sidebar: [
      { text: 'Getting Started', link: '/' },
      { text: 'Integration Guide', link: '/integration-guide' },
      { text: 'Banner Types', link: '/banner-types' },
      { text: 'Targeting Rules', link: '/targeting-rules' },
      { text: 'API Reference', link: '/api-reference' },
      { text: 'AI Agent Guide', link: '/ai-agent-guide' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mohitt01/banner-os' },
    ],

    editLink: undefined,

    footer: {
      message: 'BannerOS Documentation',
    },
  },
})
