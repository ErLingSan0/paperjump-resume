import type { ReactNode } from 'react';

import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Typography, message } from 'antd';

import { logout } from '@/services/auth';
import { getErrorMessage } from '@/utils/request';
import { buildTemplatePickerPath } from '@/utils/templateFlow';

type WorkspaceNavKey = 'resumes' | 'templates';

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

type WorkspaceHeroStatProps = {
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  tone?: 'cobalt' | 'sage' | 'warm';
  wide?: boolean;
};

const navItems: Array<{
  key: WorkspaceNavKey;
  label: string;
  path: string;
}> = [
  {
    key: 'resumes',
    label: '简历库',
    path: '/resumes',
  },
  {
    key: 'templates',
    label: '模板中心',
    path: '/templates',
  },
];

export function WorkspaceHeroStat(props: WorkspaceHeroStatProps) {
  const { label, value, meta, tone = 'warm', wide = false } = props;

  return (
    <article
      className={[
        'workspace-hero-stat',
        `workspace-hero-stat--${tone}`,
        wide ? 'workspace-hero-stat--wide' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="workspace-hero-stat__label">{label}</span>
      <strong className="workspace-hero-stat__value">{value}</strong>
      {meta ? <span className="workspace-hero-stat__meta">{meta}</span> : null}
    </article>
  );
}

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
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const avatarText = (currentUser?.displayName || currentUser?.email || '纸').slice(0, 1).toUpperCase();
  const showHero = heroMode !== 'none';

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
              <small>在线简历工作区</small>
            </span>
          </button>

          <nav className="workspace-shell__nav-links" aria-label="工作区导航">
            {navItems.map((item) => (
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
            <div className="workspace-shell__user">
              <span className="workspace-shell__avatar">{avatarText}</span>
              <span className="workspace-shell__user-meta">
                <strong>{currentUser?.displayName || '工作区'}</strong>
                <small>{currentUser?.email || '已登录'}</small>
              </span>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => history.push(buildTemplatePickerPath({ from: activeNav, intent: 'create' }))}
            >
              选模板开始
            </Button>
            <Button size="large" icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Button>
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
    </div>
  );
}
