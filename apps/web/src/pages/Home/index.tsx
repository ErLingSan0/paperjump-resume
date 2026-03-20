import { useEffect, useMemo, useState } from 'react';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PartitionOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Card, Col, Empty, Modal, Row, Space, Tag, Typography, message } from 'antd';

import AuthModal from '@/components/AuthModal';
import { logout } from '@/services/auth';
import { deleteResume, queryResumes } from '@/services/resumes';
import type { ResumeDraftSummary } from '@/types/resume';
import { formatDraftTime } from '@/utils/resumeDrafts';
import { getErrorMessage } from '@/utils/request';
import { buildTemplatePickerPath } from '@/utils/templateFlow';

const productName = '纸跃简历';

const featureCards = [
  {
    title: '结构化在线编辑',
    description: '把个人信息、教育、经历、项目、技能拆成清晰模块，写起来更快，后期改起来也更轻松。',
    icon: <EditOutlined />,
  },
  {
    title: '边写边看预览',
    description: '编辑区和预览区同时工作，内容、顺序和版式变化都能立刻看到。',
    icon: <FileTextOutlined />,
  },
  {
    title: '云端自动保存',
    description: '登录后会自动保存到账号里，换设备也能继续写。',
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
    value: '账号云端保存',
  },
  {
    label: '访问方式',
    value: '浏览器在线编辑',
  },
];

const workflowSteps = [
  {
    title: '先选一个模板',
    description: '测试自动部署文案',
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
    title: '云端保存',
    description: '登录后，简历、收藏和编辑进度都会保存在同一个账号里。',
    icon: <SafetyCertificateOutlined />,
  },
  {
    title: '导出与备份',
    description: '写完后可以直接导出成品，也能保留 JSON 备份。',
    icon: <CheckCircleOutlined />,
  },
];

export default function HomePage() {
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [drafts, setDrafts] = useState<ResumeDraftSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [authModalState, setAuthModalState] = useState<{
    mode: 'login' | 'register';
    open: boolean;
    redirect: string;
  }>({
    mode: 'login',
    open: false,
    redirect: '/resumes',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDrafts() {
      if (!currentUser) {
        setDrafts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const nextDrafts = await queryResumes();
        if (!cancelled) {
          setDrafts(nextDrafts);
        }
      } catch (error) {
        if (!cancelled) {
          message.error(getErrorMessage(error, '简历列表加载失败，请稍后再试'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDrafts();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const workspaceSummary = useMemo(() => {
    if (!currentUser) {
      return {
        title: '登录后保存你的简历',
        description: '注册后可以随时回来继续编辑，不用担心内容丢失。',
      };
    }

    return {
      title: '我的简历',
      description: '这里可以继续编辑、删除，或者直接去模板中心开始下一份。',
    };
  }, [currentUser]);

  function openAuthModal(mode: 'login' | 'register', redirect = '/resumes') {
    setAuthModalState({
      open: true,
      mode,
      redirect,
    });
  }

  function closeAuthModal() {
    setAuthModalState((state) => ({
      ...state,
      open: false,
    }));
  }

  function handleCreateDraft() {
    if (!currentUser) {
      openAuthModal('register', buildTemplatePickerPath({ from: 'home', intent: 'create' }));
      return;
    }

    history.push(buildTemplatePickerPath({ from: 'home', intent: 'create' }));
  }

  function handleDeleteDraft(id: string) {
    Modal.confirm({
      title: '删除这份简历？',
      content: '删除后将从你的账号中移除，且无法恢复。',
      okText: '删除',
      okButtonProps: {
        danger: true,
      },
      cancelText: '取消',
          onOk: async () => {
            try {
              await deleteResume(id);
              message.success('简历已删除');
              const nextDrafts = await queryResumes();
              setDrafts(nextDrafts);
            } catch (error) {
              message.error(getErrorMessage(error, '删除失败，请稍后再试'));
            }
          },
    });
  }

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
            <Space wrap size={12}>
              {currentUser ? (
                <>
                  <Button size="large" onClick={() => history.push('/resumes')}>
                    我的简历
                  </Button>
                  <Button size="large" type="primary" onClick={handleCreateDraft}>
                    选模板开始
                  </Button>
                  <Button size="large" onClick={handleLogout}>
                    退出登录
                  </Button>
                </>
              ) : (
                <>
                  <Button size="large" onClick={() => openAuthModal('login', '/resumes')}>
                    登录 / 注册
                  </Button>
                  <Button size="large" type="primary" onClick={handleCreateDraft}>
                    立即开始
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>
      </header>

      <main>
        <section className="paperjump-home__hero">
          <div className="paperjump-home__inner paperjump-home__hero-grid">
            <div className="paperjump-home__hero-copy">
              <Tag color="blue">在线简历编辑</Tag>
              <Typography.Title level={1}>
                把“写简历”这件事
                <br />
                做成真正顺手的在线工作流。
              </Typography.Title>
              <Typography.Paragraph>
                {productName} 把模板选择、简历写作、实时预览、自动保存和导出收在同一条路径里，
                让你从开始到成稿都能顺着完成。
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
                  {currentUser ? '选模板开始' : '注册后选模板'}
                </Button>
                <Button
                  size="large"
                  onClick={() =>
                    document.getElementById('recent-drafts')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  {currentUser ? '查看我的简历' : '查看已保存内容'}
                </Button>
              </Space>
            </div>

            <div className="paperjump-home__hero-preview">
              <div className="paperjump-home__hero-preview-stack">
                <div className="paperjump-home__hero-panel">
                  <div className="paperjump-home__hero-panel-head">
                    <span>核心能力</span>
                    <strong>在线简历编辑</strong>
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
                    <span>使用方式</span>
                    <strong>先选模板，再进入编辑器</strong>
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
                <Typography.Title level={2}>核心能力</Typography.Title>
                <Typography.Paragraph>从创建到导出，常用流程都已经放在一起。</Typography.Paragraph>
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
                <Typography.Title level={2}>{workspaceSummary.title}</Typography.Title>
                <Typography.Paragraph>{workspaceSummary.description}</Typography.Paragraph>
              </div>
              <Button type="primary" onClick={handleCreateDraft}>
                {currentUser ? '先选模板' : '登录后选模板'}
              </Button>
            </div>
            <div className="paperjump-home__workspace-grid">
              <div className="paperjump-home__workspace-main">
                {!currentUser ? (
                  <Card className="paperjump-home__empty-card">
                    <Empty
                      description="登录后就能创建、保存和继续编辑自己的简历。"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button
                        type="primary"
                        onClick={() =>
                          openAuthModal(
                            'register',
                            buildTemplatePickerPath({ from: 'home', intent: 'create' }),
                          )
                        }
                      >
                        登录 / 注册
                      </Button>
                    </Empty>
                  </Card>
                ) : loading ? (
                  <Card className="paperjump-home__empty-card" loading />
                ) : drafts.length === 0 ? (
                  <Card className="paperjump-home__empty-card">
                    <Empty
                      description="还没有简历，先新建一份开始写。"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" onClick={handleCreateDraft}>
                        去选模板
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
                              <Tag bordered={false}>{draft.templateName || '未选择模板'}</Tag>
                              <Tag bordered={false}>{draft.status === 'published' ? '已发布' : '草稿中'}</Tag>
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
                                aria-label="删除简历"
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
            </div>
          </div>
        </section>
      </main>

      {!currentUser ? (
        <AuthModal
          open={authModalState.open}
          mode={authModalState.mode}
          redirect={authModalState.redirect}
          onClose={closeAuthModal}
          onModeChange={(mode) =>
            setAuthModalState((state) => ({
              ...state,
              mode,
            }))
          }
        />
      ) : null}
    </div>
  );
}
