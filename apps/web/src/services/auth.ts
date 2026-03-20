import { request } from '@umijs/max';

export type CurrentUser = {
  id: number;
  email: string;
  displayName: string;
  role: string;
};

export async function queryCurrentUser(options?: Record<string, unknown>) {
  return request<CurrentUser | undefined>('/api/auth/session', {
    method: 'GET',
    ...(options ?? {}),
  });
}

export async function login(payload: {
  email: string;
  password: string;
}) {
  return request<CurrentUser>('/api/auth/login', {
    method: 'POST',
    data: payload,
  });
}

export async function register(payload: {
  email: string;
  displayName: string;
  password: string;
}) {
  return request<CurrentUser>('/api/auth/register', {
    method: 'POST',
    data: payload,
  });
}

export async function logout() {
  return request('/api/auth/logout', {
    method: 'POST',
  });
}
