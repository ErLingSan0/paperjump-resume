import { defineConfig } from '@umijs/max';

export default defineConfig({
  npmClient: 'pnpm',
  esbuildMinifyIIFE: true,
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
      redirect: '/resumes',
    },
    {
      path: '/templates',
      layout: false,
      wrappers: ['@/wrappers/AuthGuard'],
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
