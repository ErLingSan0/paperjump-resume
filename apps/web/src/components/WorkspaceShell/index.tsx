import { type ReactNode, useMemo, useState } from 'react';

import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { history, useLocation, useModel } from '@umijs/max';
import { Button, Typography, message } from 'antd';

import AuthModal from '@/components/AuthModal';
import FilingFooter from '@/components/FilingFooter';
import { logout } from '@/services/auth';
import { getErrorMessage } from '@/utils/request';
import { buildTemplatePickerPath } from '@/utils/templateFlow';

type WorkspaceNavKey = 'overview' | 'resumes' | 'templates';

type WorkspaceShellProps = {
  activeNav: WorkspaceNavKey;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  heroMode?: 'default' | 'compact' | 'none';
  children: ReactNode;
};

const navItems: Array<{
  key: WorkspaceNavKey;
  label: string;
  path: string;
}> = [
  {
    key: 'overview',
    label: '概览',
    path: '/',
  },
  {
    key: 'resumes',
    label: '我的简历',
    path: '/resumes',
  },
  {
    key: 'templates',
    label: '模板中心',
    path: '/templates',
  },
];

export default function WorkspaceShell(props: WorkspaceShellProps) {
  const {
    activeNav,
    eyebrow,
    title,
    description,
    actions,
    aside,
    heroMode = 'default',
    children,
  } = props;
  const location = useLocation();
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const avatarText = (currentUser?.displayName || currentUser?.email || '纸').slice(0, 1).toUpperCase();
  const showHero = heroMode !== 'none';
  const redirect = useMemo(
    () => `${location.pathname}${location.search || ''}${location.hash || ''}`,
    [location.hash, location.pathname, location.search],
  );
  const visibleNavItems = currentUser ? navItems : navItems.filter((item) => item.key !== 'resumes');
  const createEntryFrom = activeNav === 'overview' ? 'home' : activeNav;

  async function handleLogout() {
    try {
      await logout();
      await setInitialState((state) => ({
        ...(state ?? {}),
        currentUser: undefined,
      }));
      history.push('/');
      message.success('已退出登录');
    } catch (error) {
      message.error(getErrorMessage(error, '退出失败，请稍后再试'));
    }
  }

  return (
    <div className="workspace-shell">
      <header className="workspace-shell__nav">
        <div className="workspace-shell__inner workspace-shell__nav-inner">
          <button
            type="button"
            className="workspace-shell__brand"
            onClick={() => history.push('/')}
          >
            <span className="workspace-shell__brand-mark">纸</span>
            <span className="workspace-shell__brand-copy">
              <strong>纸跃简历</strong>
              <small>工作区</small>
            </span>
          </button>

          <nav className="workspace-shell__nav-links" aria-label="工作区导航">
            {visibleNavItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={[
                  'workspace-shell__nav-link',
                  activeNav === item.key ? 'workspace-shell__nav-link--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => history.push(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="workspace-shell__nav-actions">
            {currentUser ? (
              <>
                <div className="workspace-shell__user">
                  <span className="workspace-shell__avatar">{avatarText}</span>
                  <span className="workspace-shell__user-meta">
                    <strong>{currentUser.displayName || '已登录'}</strong>
                    <small>{currentUser.email || '当前账号'}</small>
                  </span>
                </div>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    history.push(buildTemplatePickerPath({ from: createEntryFrom, intent: 'create' }))
                  }
                >
                  新建简历
                </Button>
                <Button size="large" icon={<LogoutOutlined />} onClick={handleLogout}>
                  退出登录
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                >
                  登录 / 注册
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="workspace-shell__main">
        <div className="workspace-shell__inner">
          {showHero ? (
            <section
              className={[
                'workspace-hero',
                heroMode === 'compact' ? 'workspace-hero--compact' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="workspace-hero__body">
                {eyebrow ? <span className="workspace-hero__eyebrow mono-label">{eyebrow}</span> : null}
                <Typography.Title level={1} className="workspace-hero__title">
                  {title}
                </Typography.Title>
                {description ? (
                  <Typography.Paragraph className="workspace-hero__description">
                    {description}
                  </Typography.Paragraph>
                ) : null}
                {actions ? <div className="workspace-hero__actions">{actions}</div> : null}
              </div>
              {aside ? <div className="workspace-hero__aside">{aside}</div> : null}
            </section>
          ) : null}

          {children}
        </div>
      </main>

      <div className="workspace-shell__inner">
        <FilingFooter />
      </div>

      {!currentUser ? (
        <AuthModal
          open={authModalOpen}
          mode={authModalMode}
          redirect={redirect}
          onClose={() => setAuthModalOpen(false)}
          onModeChange={(nextMode) => setAuthModalMode(nextMode)}
        />
      ) : null}
    </div>
  );
}
