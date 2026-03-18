import { useEffect, useState } from 'react';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LockOutlined,
  PartitionOutlined,
  RocketOutlined,
  SafetyOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Card, Col, Empty, Modal, Row, Space, Tag, Typography } from 'antd';

import type { ResumeDraftSummary } from '@/types/resume';
import {
  createDraftId,
  formatDraftTime,
  loadDraftIndex,
  removeDraft,
} from '@/utils/resumeDrafts';

const productName = '纸跃简历';

const featureCards = [
  {
    title: '结构化在线编辑',
    description: '把个人信息、教育、经历、项目、技能拆成清晰模块，写起来更快，后期改起来也更轻松。',
    icon: <EditOutlined />,
  },
  {
    title: '边写边看预览',
    description: '右侧实时展示简历成品，不用反复导出 PDF 才知道版式是不是顺手。',
    icon: <FileTextOutlined />,
  },
  {
    title: '本地自动保存',
    description: '先把最重要的写作流程跑通，打开就能继续编辑，不需要注册登录。',
    icon: <ClockCircleOutlined />,
  },
  {
    title: '文档级样式控制',
    description: '字体、标题、密度和页面节奏都收在同一个文档工作区里，后期调整不会打断写作。',
    icon: <PartitionOutlined />,
  },
];

const productMetrics = [
  {
    label: '写作方式',
    value: '结构化录入',
  },
  {
    label: '预览方式',
    value: 'A4 实时纸面',
  },
  {
    label: '保存方式',
    value: '本地自动保存',
  },
  {
    label: '当前方向',
    value: '先把在线写简历做好',
  },
];

const workflowSteps = [
  {
    title: '先起一份草稿',
    description: '不用注册，不用配置模板，直接从最常用的简历结构开始写。',
    icon: <RocketOutlined />,
  },
  {
    title: '边写边看纸面',
    description: '编辑区和预览区同时工作，内容、顺序和版式变化都能立刻看到。',
    icon: <FileTextOutlined />,
  },
  {
    title: '最后再导出成品',
    description: '写完再进样式和导出流程，避免一开始被一堆功能打断。',
    icon: <CheckCircleOutlined />,
  },
];

const qualityHighlights = [
  {
    title: '本地优先',
    description: '草稿直接存在浏览器里，打开就能接着写。',
    icon: <SafetyCertificateOutlined />,
  },
  {
    title: '导出与备份',
    description: '写完就能导出成品，也能保留 JSON 备份，不把写作节奏打断。',
    icon: <CheckCircleOutlined />,
  },
];

const accountRoadmap = [
  {
    title: '登录注册',
    description: '接入账号后，草稿不再只留在当前浏览器，后面会支持稳定登录和身份识别。',
    icon: <LockOutlined />,
  },
  {
    title: '多端同步',
    description: '同一份简历会在不同设备之间保持一致，电脑和移动端切换时不用重新导入。',
    icon: <SyncOutlined />,
  },
  {
    title: '云端草稿',
    description: '除了本地自动保存，还会有云端备份和恢复，避免更换设备时丢失进度。',
    icon: <SafetyOutlined />,
  },
];

export default function HomePage() {
  const [drafts, setDrafts] = useState<ResumeDraftSummary[]>([]);

  function refreshDrafts() {
    setDrafts(loadDraftIndex());
  }

  useEffect(() => {
    refreshDrafts();
  }, []);

  function handleCreateDraft() {
    history.push(`/maker/${createDraftId()}`);
  }

  function handleDeleteDraft(id: string) {
    Modal.confirm({
      title: '删除这份本地草稿？',
      content: '这会从当前浏览器里移除草稿内容，删除后无法恢复。',
      okText: '删除',
      okButtonProps: {
        danger: true,
      },
      cancelText: '取消',
      onOk: () => {
        removeDraft(id);
        refreshDrafts();
      },
    });
  }

  return (
    <div className="paperjump-home">
      <header className="paperjump-home__header">
        <div className="paperjump-home__inner">
          <div className="paperjump-home__brand">
            <div className="paperjump-home__brand-mark">纸</div>
            <div>
              <Typography.Title level={1}>{productName}</Typography.Title>
              <Typography.Text>在线写简历，边写边排版</Typography.Text>
            </div>
          </div>
          <div className="paperjump-home__header-actions">
            <div className="paperjump-home__header-plan">
              <span>账号体系</span>
              <strong>登录注册 / 多端同步</strong>
            </div>
            <Button size="large" onClick={handleCreateDraft}>
              立即开始
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="paperjump-home__hero">
          <div className="paperjump-home__inner paperjump-home__hero-grid">
            <div className="paperjump-home__hero-copy">
              <Tag color="blue">不做 AI，先把写作体验做好</Tag>
              <Typography.Title level={1}>
                把“写简历”这件事
                <br />
                做成真正顺手的在线工作流。
              </Typography.Title>
              <Typography.Paragraph>
                {productName} 现在先只做最重要的部分：创建草稿、结构化录入、实时纸面预览、本地自动保存和成品导出。
                不先堆一大堆花功能，先把真实写简历时最常走的流程打磨顺。
              </Typography.Paragraph>
              <div className="paperjump-home__hero-badges">
                {qualityHighlights.map((item) => (
                  <div className="paperjump-home__hero-badge" key={item.title}>
                    <span>{item.icon}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </div>
                  </div>
                ))}
              </div>
              <Space wrap size={14}>
                <Button type="primary" size="large" icon={<RocketOutlined />} onClick={handleCreateDraft}>
                  新建一份简历
                </Button>
                <Button
                  size="large"
                  onClick={() => document.getElementById('recent-drafts')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  查看本地工作区
                </Button>
              </Space>
            </div>

            <div className="paperjump-home__hero-preview">
              <div className="paperjump-home__hero-preview-stack">
                <div className="paperjump-home__hero-panel">
                  <div className="paperjump-home__hero-panel-head">
                    <span>当前产品形态</span>
                    <strong>在线简历工作台</strong>
                  </div>
                  <div className="paperjump-home__hero-panel-list">
                    {productMetrics.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="paperjump-home__hero-panel paperjump-home__hero-panel--workflow">
                  <div className="paperjump-home__hero-panel-head">
                    <span>开始路径</span>
                    <strong>先写内容，再导出成品</strong>
                  </div>
                  <div className="paperjump-home__hero-flow">
                    {workflowSteps.map((item, index) => (
                      <div className="paperjump-home__hero-flow-item" key={item.title}>
                        <span className="paperjump-home__hero-flow-index">0{index + 1}</span>
                        <div className="paperjump-home__hero-flow-body">
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="paperjump-home__features">
          <div className="paperjump-home__inner">
            <div className="paperjump-home__section-head">
              <div>
                <Typography.Title level={2}>为什么这版已经适合开始</Typography.Title>
                <Typography.Paragraph>
                  先把写作主链路做完整，比一开始堆满复杂能力更重要。
                </Typography.Paragraph>
              </div>
            </div>
            <Row gutter={[20, 20]}>
              {featureCards.map((item) => (
                <Col xs={24} md={12} xl={6} key={item.title}>
                  <Card className="paperjump-home__feature-card">
                    <div className="paperjump-home__feature-head">
                      <div className="paperjump-home__feature-icon">{item.icon}</div>
                      <Typography.Title level={4}>{item.title}</Typography.Title>
                    </div>
                    <Typography.Paragraph>{item.description}</Typography.Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        <section className="paperjump-home__drafts" id="recent-drafts">
          <div className="paperjump-home__inner">
            <div className="paperjump-home__section-head">
              <div>
                <Typography.Title level={2}>本地工作区</Typography.Title>
                <Typography.Paragraph>
                  先在当前浏览器里创建和继续草稿，后面再把账号和多端同步能力接进来。
                </Typography.Paragraph>
              </div>
              <Button type="primary" onClick={handleCreateDraft}>
                新建空白草稿
              </Button>
            </div>
            <div className="paperjump-home__workspace-grid">
              <div className="paperjump-home__workspace-main">
                {drafts.length === 0 ? (
                  <Card className="paperjump-home__empty-card">
                    <Empty
                      description="还没有本地草稿，先新建一份简历试试。"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" onClick={handleCreateDraft}>
                        立即开始写
                      </Button>
                    </Empty>
                  </Card>
                ) : (
                  <Row gutter={[20, 20]}>
                    {drafts.map((draft) => (
                      <Col xs={24} md={12} key={draft.id}>
                        <Card className="paperjump-home__draft-card">
                          <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <div>
                              <Typography.Title level={4}>{draft.title}</Typography.Title>
                              <Typography.Text type="secondary">
                                {draft.headline || '未填写岗位标题'}
                              </Typography.Text>
                            </div>
                            <div className="paperjump-home__draft-tags">
                              <Tag bordered={false}>浏览器保存</Tag>
                              <Tag bordered={false}>继续编辑</Tag>
                            </div>
                            <div className="paperjump-home__draft-meta">
                              <span>最近更新</span>
                              <strong>{formatDraftTime(draft.updatedAt)}</strong>
                            </div>
                            <Space.Compact block>
                              <Button type="primary" block onClick={() => history.push(`/maker/${draft.id}`)}>
                                继续编辑
                              </Button>
                              <Button
                                aria-label="删除草稿"
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteDraft(draft.id)}
                              />
                            </Space.Compact>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>

              <Card className="paperjump-home__account-card">
                <div className="paperjump-home__account-head">
                  <div>
                    <Typography.Title level={3}>账号能力正在规划</Typography.Title>
                    <Typography.Paragraph>
                      当前先把本地写作流程打磨稳定，接下来会把账号和同步能力接进来。
                    </Typography.Paragraph>
                  </div>
                  <Tag bordered={false}>下一阶段</Tag>
                </div>

                <div className="paperjump-home__account-list">
                  {accountRoadmap.map((item) => (
                    <div className="paperjump-home__account-item" key={item.title}>
                      <span className="paperjump-home__account-icon">{item.icon}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Typography.Text className="paperjump-home__account-note">
                  等账号体系接上之后，这里的本地工作区会自然升级成可登录、可同步、可恢复的云端工作区。
                </Typography.Text>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
