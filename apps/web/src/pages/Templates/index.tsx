import {
  AppstoreOutlined,
  ArrowRightOutlined,
  FireOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Col, Row, Space, Tag, Typography } from 'antd';

import PageHero from '@/components/PageHero';
import SurfaceCard from '@/components/SurfaceCard';

const templates = [
  {
    title: 'Minimal Corporate',
    description: 'A restrained two-column system for experienced operators and leadership tracks.',
    badge: 'Popular',
    mood: 'Precision',
    previewClassName: 'template-preview',
  },
  {
    title: 'Creative Portfolio',
    description: 'A stronger visual rhythm for designers, marketers, and product storytellers.',
    badge: 'New',
    mood: 'Expressive',
    previewClassName: 'template-preview template-preview--creative',
  },
  {
    title: 'Campus Launch',
    description: 'A cleaner template tuned for internships, fresh grads, and project-led resumes.',
    badge: 'Starter',
    mood: 'Starter',
    previewClassName: 'template-preview template-preview--student',
  },
];

export default function TemplatesPage() {
  return (
    <div className="page-shell">
      <PageHero
        eyebrow="Curated Gallery"
        title="Choose a template language before we shape the editing flow."
        description="This page is the showroom for our first template family. The goal is not just variety, but clear intent: corporate clarity, creative personality, and strong entry-level storytelling."
        actions={(
          <Space wrap size={12}>
            <Button type="primary" size="large" onClick={() => history.push('/editor/new')}>
              Start with a blank draft
            </Button>
            <Button size="large" onClick={() => history.push('/resumes')}>
              Review my drafts
            </Button>
          </Space>
        )}
      />

      <Space size={[8, 8]} wrap>
        <Tag color="blue">Executive</Tag>
        <Tag color="green">Creative</Tag>
        <Tag color="gold">Campus</Tag>
        <Tag color="cyan">ATS Friendly</Tag>
      </Space>

      <Row gutter={[20, 20]}>
        {templates.map((template) => (
          <Col xs={24} md={12} xl={8} key={template.title}>
            <SurfaceCard className="template-card" hoverable>
              <Space direction="vertical" size={16}>
                <div className={template.previewClassName} />
                <Space size={12} align="start" style={{ width: '100%' }}>
                  <div>
                    <Typography.Text
                      type="secondary"
                      style={{ letterSpacing: '0.16em', textTransform: 'uppercase' }}
                    >
                      {template.mood}
                    </Typography.Text>
                    <Typography.Title level={4} style={{ margin: '8px 0 0' }}>
                      {template.title}
                    </Typography.Title>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#2151ff', fontSize: 18 }}>
                    {template.badge === 'Popular' ? <AppstoreOutlined /> : null}
                    {template.badge === 'New' ? <FireOutlined /> : null}
                    {template.badge === 'Starter' ? <StarOutlined /> : null}
                  </div>
                </Space>
                <Space>
                  <Tag color="blue">{template.badge}</Tag>
                  <Tag bordered={false}>{template.mood}</Tag>
                </Space>
                <Typography.Paragraph style={{ margin: 0 }}>
                  {template.description}
                </Typography.Paragraph>
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() => history.push('/editor/new')}
                >
                  Use this direction <ArrowRightOutlined />
                </Button>
              </Space>
            </SurfaceCard>
          </Col>
        ))}
      </Row>
    </div>
  );
}
