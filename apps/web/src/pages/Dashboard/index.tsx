import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CompassOutlined,
  DatabaseOutlined,
  EditOutlined,
  ProfileOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { history, useRequest } from '@umijs/max';
import { Button, Col, Row, Space, Tag, Typography } from 'antd';

import PageHero from '@/components/PageHero';
import SurfaceCard from '@/components/SurfaceCard';
import { querySystemInfo } from '@/services/system';

const focusTracks = [
  'Resume editor with structured sections and live preview',
  'Template gallery with category filters and detail pages',
  'Auth, membership, and publishing flows',
  'Export, upload, and AI-assisted refinement hooks',
];

const milestones = [
  'Extract shared page hero and surface card patterns',
  'Replace dashboard placeholders with product-shaped guidance',
  'Prepare the editor page for three-panel layout work',
  'Keep backend health and local setup visible during iteration',
];

const metrics = [
  {
    label: 'Template track',
    value: '12',
    caption: 'initial curated templates planned',
    icon: <AppstoreOutlined />,
  },
  {
    label: 'Core modules',
    value: '06',
    caption: 'editing, templates, auth, publish, export, AI',
    icon: <RocketOutlined />,
  },
  {
    label: 'Local API',
    value: 'Ready',
    caption: 'replace with live health once services are up',
    icon: <CloudServerOutlined />,
    dark: true,
  },
  {
    label: 'Resume drafts',
    value: '00',
    caption: 'the next milestone is first real resume record',
    icon: <ProfileOutlined />,
  },
];

export default function DashboardPage() {
  const { data, error, loading } = useRequest(querySystemInfo);
  const statusTone = error ? 'status-strip status-strip--warning' : 'status-strip status-strip--success';
  const backendValue = error
    ? 'Awaiting local API'
    : loading
      ? 'Checking service heartbeat'
      : 'Healthy local backend';

  return (
    <div className="page-shell">
      <PageHero
        eyebrow="Phase 01 / Local Build"
        title="Your resume studio is ready for the first real workflow."
        description="Frontend, backend, and infrastructure scaffolding are in place. This dashboard now acts like a product command sheet while we move into templates, resume editing, authentication, and publishing."
        actions={(
          <Space wrap size={12}>
            <Button type="primary" size="large" onClick={() => history.push('/templates')}>
              Browse template direction
            </Button>
            <Button size="large" onClick={() => history.push('/resumes')}>
              Open resume workspace
            </Button>
          </Space>
        )}
        aside={(
          <Space direction="vertical" size={18}>
            <div>
              <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Current Track
              </Typography.Text>
              <Typography.Title level={3} style={{ margin: '8px 0 0', color: '#fff' }}>
                Premium product shell first, feature depth next.
              </Typography.Title>
            </div>
            <div className="hero-meta-list">
              <div className="hero-meta-item">
                <div className="hero-meta-icon">
                  <CompassOutlined />
                </div>
                <div>
                  <Typography.Text style={{ color: '#fff', fontWeight: 700 }}>
                    Design direction locked
                  </Typography.Text>
                  <Typography.Paragraph style={{ margin: 0, color: 'rgba(255, 255, 255, 0.72)' }}>
                    Editorial, warm, and product-led instead of generic admin chrome.
                  </Typography.Paragraph>
                </div>
              </div>
              <div className="hero-meta-item">
                <div className="hero-meta-icon">
                  <EditOutlined />
                </div>
                <div>
                  <Typography.Text style={{ color: '#fff', fontWeight: 700 }}>
                    Next implementation focus
                  </Typography.Text>
                  <Typography.Paragraph style={{ margin: 0, color: 'rgba(255, 255, 255, 0.72)' }}>
                    Editor layout, auth entry, and resume data flow.
                  </Typography.Paragraph>
                </div>
              </div>
            </div>
          </Space>
        )}
      />

      <div className={statusTone}>
        <div className="status-strip__item">
          <span className="status-strip__label">Backend</span>
          <span className="status-strip__value">{backendValue}</span>
        </div>
        <div className="status-strip__item">
          <span className="status-strip__label">Workspace</span>
          <span className="status-strip__value">Umi 4 + Ant Design 5 + Spring Boot 3</span>
        </div>
        <div className="status-strip__item">
          <span className="status-strip__label">Immediate Goal</span>
          <span className="status-strip__value">Ship the first usable resume flow</span>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        {metrics.map((metric) => (
          <Col xs={24} md={12} xl={6} key={metric.label}>
            <SurfaceCard className={metric.dark ? 'metric-card metric-card--dark' : 'metric-card'}>
              <span className="metric-card__eyebrow">{metric.label}</span>
              <div className="metric-card__content">
                <div>
                  <div className="metric-card__value">{metric.value}</div>
                  <div className="metric-card__caption">{metric.caption}</div>
                </div>
                <div className="metric-card__icon">{metric.icon}</div>
              </div>
            </SurfaceCard>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={14}>
          <SurfaceCard title="Development Pipeline">
            <div className="check-list">
              {focusTracks.map((item) => (
                <div className="check-list__item" key={item}>
                  <CheckCircleOutlined className="check-list__icon" />
                  <Typography.Text>{item}</Typography.Text>
                </div>
              ))}
            </div>
            <div style={{ height: 24 }} />
            <Tag color="blue">Recommended move</Tag>
            <Typography.Paragraph style={{ margin: '12px 0 0' }}>
              Build the first end-to-end flow around one resume draft: create, enter editor,
              preview, and save.
            </Typography.Paragraph>
          </SurfaceCard>
        </Col>
        <Col xs={24} xl={10}>
          <SurfaceCard title="Backend Snapshot">
            <div className="surface-list">
              <div className="surface-list__row">
                <span className="surface-list__label">Application</span>
                <span className="surface-list__value mono-label">
                  {data?.application ?? 'resume-platform-api'}
                </span>
              </div>
              <div className="surface-list__row">
                <span className="surface-list__label">Environment</span>
                <span className="surface-list__value mono-label">
                  {data?.environment ?? 'local'}
                </span>
              </div>
              <div className="surface-list__row">
                <span className="surface-list__label">Version</span>
                <span className="surface-list__value mono-label">
                  {data?.version ?? '0.0.1-SNAPSHOT'}
                </span>
              </div>
              <div className="surface-list__row">
                <span className="surface-list__label">Server time</span>
                <span className="surface-list__value mono-label">
                  {data?.serverTime ?? 'Waiting for backend...'}
                </span>
              </div>
            </div>
          </SurfaceCard>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={12}>
          <SurfaceCard title="Milestones In Motion">
            <div className="check-list">
              {milestones.map((item) => (
                <div className="check-list__item" key={item}>
                  <SafetyCertificateOutlined className="check-list__icon" />
                  <Typography.Text>{item}</Typography.Text>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </Col>
        <Col xs={24} xl={12}>
          <SurfaceCard title="Stack Surface">
            <div className="surface-list">
              <div className="surface-list__row">
                <span className="surface-list__label">Frontend runtime</span>
                <span className="surface-list__value">Umi 4 / React 18 / Ant Design 5</span>
              </div>
              <div className="surface-list__row">
                <span className="surface-list__label">Backend runtime</span>
                <span className="surface-list__value">Spring Boot 3.5 / Java 17</span>
              </div>
              <div className="surface-list__row">
                <span className="surface-list__label">Infra baseline</span>
                <span className="surface-list__value">
                  <Space size={8}>
                    <DatabaseOutlined />
                    MySQL + Redis via Docker
                  </Space>
                </span>
              </div>
              <div className="surface-list__row">
                <span className="surface-list__label">Direction</span>
                <span className="surface-list__value">Premium career workspace</span>
              </div>
            </div>
          </SurfaceCard>
        </Col>
      </Row>
    </div>
  );
}
