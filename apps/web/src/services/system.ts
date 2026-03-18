import { request } from '@umijs/max';

export type SystemInfo = {
  application: string;
  environment: string;
  version: string;
  serverTime: string;
};

export async function querySystemInfo() {
  return request<SystemInfo>('/api/system/info');
}
