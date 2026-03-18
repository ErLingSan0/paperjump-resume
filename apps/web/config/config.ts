import { defineConfig } from '@umijs/max';

export default defineConfig({
  npmClient: 'pnpm',
  esbuildMinifyIIFE: true,
  antd: {},
  request: {},
  routes: [
    {
      path: '/',
      layout: false,
      component: '@/pages/Home',
    },
    {
      path: '/maker/:resumeId',
      layout: false,
      component: '@/pages/Maker',
    },
    {
      path: '/*',
      layout: false,
      redirect: '/',
    },
  ],
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
});
