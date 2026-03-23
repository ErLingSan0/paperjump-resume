import { defineConfig } from '@umijs/max';

export default defineConfig({
  npmClient: 'pnpm',
  title: '纸跃简历',
  hash: true,
  esbuildMinifyIIFE: true,
  links: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'shortcut icon', href: '/favicon.svg' },
  ],
  antd: {},
  model: {},
  access: {},
  initialState: {},
  request: {},
  routes: [
    {
      path: '/',
      layout: false,
      component: '@/pages/Home',
    },
    {
      path: '/dashboard',
      layout: false,
      redirect: '/',
    },
    {
      path: '/templates',
      layout: false,
      component: '@/pages/Templates',
    },
    {
      path: '/resumes',
      layout: false,
      wrappers: ['@/wrappers/AuthGuard'],
      component: '@/pages/Resumes',
    },
    {
      path: '/maker/new',
      layout: false,
      wrappers: ['@/wrappers/AuthGuard'],
      component: '@/pages/Maker',
    },
    {
      path: '/maker/:resumeId',
      layout: false,
      wrappers: ['@/wrappers/AuthGuard'],
      component: '@/pages/Maker',
    },
    {
      path: '/editor/:resumeId',
      layout: false,
      wrappers: ['@/wrappers/AuthGuard'],
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
