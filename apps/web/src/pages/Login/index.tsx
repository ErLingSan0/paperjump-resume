import type { ReactNode } from 'react';

import {
  ArrowRightOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Space, Tag, Typography } from 'antd';

export default function LoginPage() {
  return (
    <div className="login-shell">
      <div className="login-stage">
        <div className="login-panel">
          <div className="login-grid">
            <section className="login-story">
              <div className="login-story__content">
                <TagLine />
                <Typography.Title level={1} style={{ margin: '16px 0 18px', color: '#fff' }}>
                  Build a resume that feels intentional before it ever gets opened.
                </Typography.Title>
                <Typography.Paragraph
                  style={{ color: 'rgba(255,255,255,0.78)', maxWidth: 520, fontSize: 16 }}
                >
                  Resume Studio will eventually support account login, resume history,
                  template access, publishing, and AI-assisted refinement. For now, we
                  keep the route and move through the local workspace while the real auth
                  layer is being built.
                </Typography.Paragraph>
                <Space direction="vertical" size={16} style={{ marginTop: 28 }}>
                  <HeroLine
                    icon={<ThunderboltOutlined />}
                    title="Premium template workflow"
                    description="Curated directions first, editing depth second."
                  />
                  <HeroLine
                    icon={<SafetyCertificateOutlined />}
                    title="Safe local iteration"
                    description="No auth dependency blocks the rest of development."
                  />
                  <HeroLine
                    icon={<LockOutlined />}
                    title="Auth reserved cleanly"
                    description="We can add email, WeChat, or passwordless flows without rerouting later."
                  />
                </Space>
              </div>
            </section>

            <section className="login-form">
              <Tag color="blue">Auth route reserved</Tag>
              <Typography.Title level={2} style={{ margin: 0 }}>
                Continue building from the local workspace.
              </Typography.Title>
              <Typography.Paragraph className="small-note" style={{ margin: 0 }}>
                This entry screen is intentionally product-led instead of looking like a
                generic SSO page. Once auth is wired, the right side can host email,
                social, and membership actions.
              </Typography.Paragraph>

              <Space direction="vertical" size={12}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => history.push('/dashboard')}
                >
                  Enter dashboard <ArrowRightOutlined />
                </Button>
                <Button size="large" block onClick={() => history.push('/templates')}>
                  Preview templates first
                </Button>
              </Space>

              <div className="login-trust">
                <TrustItem title="Route" description="/login is now a real branded entry." />
                <TrustItem title="Next" description="Email, OAuth, or WeChat auth slot in here." />
                <TrustItem title="Today" description="No auth blocker for the rest of product work." />
              </div>

              <Typography.Paragraph className="small-note" style={{ margin: 0 }}>
                Suggested next implementation order: session strategy, guarded routes,
                member state, then real sign-in UI.
              </Typography.Paragraph>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function TagLine() {
  return (
    <Typography.Text
      style={{
        color: 'rgba(255, 255, 255, 0.68)',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}
    >
      Resume Studio / Entry
    </Typography.Text>
  );
}

function HeroLine(props: { icon: ReactNode; title: string; description: string }) {
  const { icon, title, description } = props;

  return (
    <Space align="start" size={12}>
      <div className="hero-meta-icon">{icon}</div>
      <Space direction="vertical" size={4}>
        <Typography.Text style={{ color: '#fff', fontWeight: 700 }}>{title}</Typography.Text>
        <Typography.Text style={{ color: 'rgba(255,255,255,0.72)' }}>{description}</Typography.Text>
      </Space>
    </Space>
  );
}

function TrustItem(props: { title: string; description: string }) {
  const { title, description } = props;

  return (
    <div className="login-trust__item">
      <Typography.Text style={{ display: 'block', fontWeight: 700 }}>{title}</Typography.Text>
      <Typography.Paragraph className="small-note" style={{ margin: '8px 0 0' }}>
        {description}
      </Typography.Paragraph>
    </div>
  );
}
