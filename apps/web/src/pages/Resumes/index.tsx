import {
  ClockCircleOutlined,
  EditOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Col, Row, Space, Table, Tag, Typography } from 'antd';

import PageHero from '@/components/PageHero';
import SurfaceCard from '@/components/SurfaceCard';

const records = [
  {
    key: 'r-001',
    title: 'Product Designer Resume',
    template: 'Creative Portfolio',
    updatedAt: '2026-03-15 18:30',
    status: 'Draft',
  },
  {
    key: 'r-002',
    title: 'Backend Engineer Resume',
    template: 'Minimal Corporate',
    updatedAt: '2026-03-14 21:10',
    status: 'Published',
  },
];

export default function ResumesPage() {
  return (
    <div className="page-shell">
      <PageHero
        eyebrow="Resume Workspace"
        title="Treat every resume like an active work artifact."
        description="This page is where we organize drafts, see publish state, and quickly re-enter editing. It should feel closer to a worktable than a spreadsheet."
        actions={(
          <Space wrap size={12}>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => history.push('/editor/new')}
            >
              New resume
            </Button>
            <Button size="large" onClick={() => history.push('/templates')}>
              Review templates
            </Button>
          </Space>
        )}
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={16}>
          <SurfaceCard
            title="My resumes"
            extra={
              <Button type="primary" onClick={() => history.push('/editor/new')}>
                New Resume
              </Button>
            }
          >
            <Table
              rowKey="key"
              pagination={false}
              dataSource={records}
              columns={[
                {
                  title: 'Title',
                  dataIndex: 'title',
                },
                {
                  title: 'Template',
                  dataIndex: 'template',
                },
                {
                  title: 'Updated At',
                  dataIndex: 'updatedAt',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (value: string) => (
                    <Tag color={value === 'Published' ? 'green' : 'gold'}>{value}</Tag>
                  ),
                },
                {
                  title: 'Action',
                  render: (_, record) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => history.push(`/editor/${record.key}`)}
                      >
                        Open
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </SurfaceCard>
        </Col>
        <Col xs={24} xl={8}>
          <SurfaceCard title="Workspace Notes">
            <div className="check-list">
              <div className="check-list__item">
                <ClockCircleOutlined className="check-list__icon" />
                <Typography.Text>Drafts should sync auto-save and last-edited state.</Typography.Text>
              </div>
              <div className="check-list__item">
                <ShareAltOutlined className="check-list__icon" />
                <Typography.Text>Publish state and share URL will live beside each resume.</Typography.Text>
              </div>
              <div className="check-list__item">
                <EditOutlined className="check-list__icon" />
                <Typography.Text>
                  The editor entry needs to stay one click away from this table.
                </Typography.Text>
              </div>
            </div>
          </SurfaceCard>
        </Col>
      </Row>
    </div>
  );
}
