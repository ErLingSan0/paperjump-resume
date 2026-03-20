import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Outlet, history, useModel } from '@umijs/max';
import { Button, Spin, Typography } from 'antd';

import AuthModal from '@/components/AuthModal';

export default function AuthGuard(props: { children: ReactNode }) {
  const { children } = props;
  const { initialState, loading } = useModel('@@initialState');
  const promptedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const redirect = useMemo(
    () => `${history.location.pathname}${history.location.search || ''}${history.location.hash || ''}`,
    [],
  );
  const content = children ?? <Outlet />;

  useEffect(() => {
    if (loading || initialState?.currentUser) {
      promptedRef.current = false;
      return;
    }

    if (promptedRef.current) {
      return;
    }

    promptedRef.current = true;
    setMode('login');
    setOpen(true);
  }, [initialState?.currentUser, loading, redirect]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f3f6fb',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!initialState?.currentUser) {
    return (
      <>
        <div className="paperjump-auth-gate">
          <div className="paperjump-auth-gate__card">
            <Typography.Title level={3}>登录后继续</Typography.Title>
            <Typography.Paragraph>
              当前内容需要登录后查看，认证完成后会直接回到这里。
            </Typography.Paragraph>
            <Button
              type="primary"
              size="large"
              block
              onClick={() => {
                setMode('login');
                setOpen(true);
              }}
            >
              打开登录
            </Button>
          </div>
        </div>
        <AuthModal
          open={open}
          mode={mode}
          redirect={redirect}
          onClose={() => setOpen(false)}
          onModeChange={(nextMode) => setMode(nextMode)}
        />
      </>
    );
  }

  return <>{content}</>;
}
