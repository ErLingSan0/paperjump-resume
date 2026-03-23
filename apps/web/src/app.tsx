import type { RequestConfig } from '@umijs/max';

import type { CurrentUser } from '@/services/auth';
import { queryCurrentUser } from '@/services/auth';

export async function getInitialState(): Promise<{
  currentUser?: CurrentUser;
}> {
  try {
    const currentUser = await queryCurrentUser({
      skipErrorHandler: true,
    });

    return {
      currentUser,
    };
  } catch {
    return {};
  }
}

export const request: RequestConfig = {
  timeout: 10000,
  withCredentials: true,
  errorConfig: {
    errorHandler(error, options) {
      if (options?.skipErrorHandler) {
        throw error;
      }

      throw error;
    },
  },
};
