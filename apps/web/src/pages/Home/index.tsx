import { useEffect, useMemo, useState } from 'react';

import {
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  RocketOutlined,
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

const heroSteps = [
  {
    title: '先选模板',
    description: '先挑一个接近目标岗位的版式，再进入编辑器开始写。',
    icon: <RocketOutlined />,
  },
  {
    title: '边写边看纸面',
    description: '编辑区和 A4 预览同时工作，内容一改就能立刻看到。',
    icon: <FileTextOutlined />,
  },
  {
    title: '完成后再导出',
    description: '写完再去调整样式和导出，不用一开始被太多功能打断。',
    icon: <CheckCircleOutlined />,
  },
];

const anonymousEntryMetrics = [
  {
    label: '开始方式',
    value: '先看正式模板，再决定从哪套开始写。',
  },
  {
    label: '预览方式',
    value: '边写边看 A4 纸面，不用导出后才发现问题。',
  },
  {
    label: '保存方式',
    value: '登录后自动保存到账号，下次回来能继续接着写。',
  },
  {
    label: '导出方式',
    value: '内容写完再微调样式，最后一键导出 PDF。',
  },
];

const anonymousHighlights = [
  {
    label: '一路写完',
    title: '模板、内容、导出在一条路径里',
    description: '先定版式，再补内容，最后导出，不用在几个页面之间来回找入口。',
  },
  {
    label: '边写边看',
    title: 'A4 纸面始终在右侧',
    description: '每次改动都会立刻反映在纸面里，问题会在写的时候暴露，不会拖到导出后。',
  },
  {
    label: '接着继续',
    title: '登录后自动保存到账号',
    description: '开始写了就能继续回来接着写，适合分几次慢慢补完整份简历。',
  },
];

const anonymousUseCases = [
  {
    title: '校招 / 第一份正式简历',
    description: '先用正式结构把教育、项目、实习装进纸面里，避免一开始就写散。',
  },
  {
    title: '社招 / 需要重写经历',
    description: '用模板先约束密度和层级，再判断哪些经历应该保留、哪些该收短。',
  },
  {
    title: '转岗 / 想把经历重新组织',
    description: '先看纸面再改内容，更容易判断一页里到底有没有把重点讲清楚。',
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

  const sortedDrafts = useMemo(
    () =>
      drafts
        .slice()
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [drafts],
  );

  const latestDraft = sortedDrafts[0];
  const recentDrafts = sortedDrafts.slice(0, 3);
  const draftCount = drafts.length;
  const heroTitle = currentUser
    ? latestDraft
      ? '继续把最近这份简历写完。'
      : '从模板开始你的第一份在线简历。'
    : '先选模板，再开始写。';
  const heroDescription = currentUser
    ? latestDraft
      ? '继续最近一份，或者直接从模板再开一份。'
      : '从模板开始第一份，内容会自动保存到你的账号。'
    : `${productName} 把模板选择、在线编辑、实时纸面预览和导出放在同一条路径里，让开始到成稿都更顺。`;

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

  function handleOpenLatestDraft() {
    if (!latestDraft) {
      handleCreateDraft();
      return;
    }

    history.push(`/maker/${latestDraft.id}`);
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
              <Tag color="blue">{currentUser ? '在线简历工作区' : '模板优先工作流'}</Tag>
              <Typography.Title level={1}>{heroTitle}</Typography.Title>
              <Typography.Paragraph>{heroDescription}</Typography.Paragraph>
              <Space wrap size={14} className="paperjump-home__hero-actions">
                <Button
                  type="primary"
                  size="large"
                  icon={currentUser ? <FileTextOutlined /> : <RocketOutlined />}
                  onClick={currentUser ? handleOpenLatestDraft : handleCreateDraft}
                >
                  {currentUser ? (latestDraft ? '继续最近一份' : '选模板开始') : '注册后选模板'}
                </Button>
                <Button
                  size="large"
                  onClick={() => (currentUser ? history.push('/resumes') : openAuthModal('login', '/resumes'))}
                >
                  {currentUser ? '打开简历库' : '登录 / 注册'}
                </Button>
              </Space>
              {!currentUser ? (
                <div className="paperjump-home__hero-steps" aria-label="使用步骤">
                  {heroSteps.map((item, index) => (
                    <div className="paperjump-home__hero-step" key={item.title}>
                      <span className="paperjump-home__hero-step-index">0{index + 1}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="paperjump-home__hero-preview">
              <div className="paperjump-home__hero-preview-stack">
                <div className="paperjump-home__hero-panel">
                  <div className="paperjump-home__hero-panel-head">
                    <span>{currentUser ? '当前状态' : '开始之前'}</span>
                    <strong>{currentUser ? '最近内容和下一步' : '登录后自动保存'}</strong>
                  </div>
                  <div className="paperjump-home__hero-panel-list">
                    {currentUser ? (
                      <>
                        <div>
                          <span>已保存简历</span>
                          <strong>{draftCount || '00'} 份</strong>
                        </div>
                        <div>
                          <span>最近更新</span>
                          <strong>{latestDraft ? formatDraftTime(latestDraft.updatedAt) : '--'}</strong>
                        </div>
                        <div>
                          <span>当前入口</span>
                          <strong>{latestDraft ? '继续最近一份' : '先选模板'}</strong>
                        </div>
                        <div>
                          <span>完整管理</span>
                          <strong>简历库</strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span>保存方式</span>
                          <strong>账号云端保存</strong>
                        </div>
                        <div>
                          <span>预览方式</span>
                          <strong>A4 实时纸面</strong>
                        </div>
                        <div>
                          <span>开始方式</span>
                          <strong>先选模板</strong>
                        </div>
                        <div>
                          <span>继续方式</span>
                          <strong>下次还能接着写</strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {!currentUser ? (
          <>
            <section className="paperjump-home__metrics">
              <div className="paperjump-home__inner">
                <div className="paperjump-home__metric-grid">
                  {anonymousEntryMetrics.map((item) => (
                    <div className="paperjump-home__metric-card" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="paperjump-home__proof">
              <div className="paperjump-home__inner">
                <div className="paperjump-home__section-head">
                  <div>
                    <Typography.Title level={2}>开始之前，先把写作路径理顺</Typography.Title>
                    <Typography.Paragraph>
                      不先堆功能，也不先讲概念，首页只把从开始到成稿最关键的三件事摆清楚。
                    </Typography.Paragraph>
                  </div>
                  <Button size="large" onClick={handleCreateDraft}>
                    注册后选模板
                  </Button>
                </div>

                <div className="paperjump-home__proof-grid">
                  <article className="paperjump-home__proof-card paperjump-home__proof-card--primary">
                    <span className="paperjump-home__proof-eyebrow">开始一份简历时，你会依次做这三步</span>
                    <Typography.Title level={3}>先定版式，再补内容，最后导出。</Typography.Title>
                    <Typography.Paragraph>
                      这不是一个把所有功能都先塞给你的首页，而是把正确顺序先排好，让你更快进入写作状态。
                    </Typography.Paragraph>
                    <div className="paperjump-home__proof-flow" aria-label="开始流程">
                      {heroSteps.map((item, index) => (
                        <div className="paperjump-home__proof-flow-item" key={item.title}>
                          <span className="paperjump-home__proof-flow-index">0{index + 1}</span>
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.description}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <div className="paperjump-home__proof-list">
                    {anonymousHighlights.map((item) => (
                      <article className="paperjump-home__proof-card" key={item.label}>
                        <span className="paperjump-home__proof-label">{item.label}</span>
                        <Typography.Title level={4}>{item.title}</Typography.Title>
                        <Typography.Paragraph>{item.description}</Typography.Paragraph>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="paperjump-home__audience">
              <div className="paperjump-home__inner">
                <div className="paperjump-home__section-head">
                  <div>
                    <Typography.Title level={2}>这些场景会更适合从这里开始</Typography.Title>
                    <Typography.Paragraph>
                      无论是第一份正式简历，还是把旧简历重新整理成更可投递的版本，都适合先从模板入口起步。
                    </Typography.Paragraph>
                  </div>
                </div>

                <div className="paperjump-home__audience-grid">
                  {anonymousUseCases.map((item) => (
                    <article className="paperjump-home__audience-card" key={item.title}>
                      <Typography.Title level={4}>{item.title}</Typography.Title>
                      <Typography.Paragraph>{item.description}</Typography.Paragraph>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="paperjump-home__cta">
              <div className="paperjump-home__inner">
                <div className="paperjump-home__cta-band">
                  <div className="paperjump-home__cta-copy">
                    <span>开始之前</span>
                    <strong>先挑对版式，再把内容写完整。</strong>
                    <small>首页先帮你完成第一步，登录后就能直接进入模板选择和在线编辑。</small>
                  </div>
                  <Space wrap size={12}>
                    <Button size="large" onClick={() => openAuthModal('login', '/resumes')}>
                      登录 / 注册
                    </Button>
                    <Button type="primary" size="large" onClick={handleCreateDraft}>
                      立即开始
                    </Button>
                  </Space>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {currentUser ? (
          <section className="paperjump-home__drafts" id="recent-drafts">
            <div className="paperjump-home__inner">
              <div className="paperjump-home__section-head">
                <div>
                  <Typography.Title level={2}>最近编辑</Typography.Title>
                </div>
                <Button onClick={() => history.push('/resumes')}>打开简历库</Button>
              </div>
              <div className="paperjump-home__workspace-grid">
                <div className="paperjump-home__workspace-main">
                  {loading ? (
                    <Card className="paperjump-home__empty-card" loading />
                  ) : draftCount === 0 ? (
                    <Card className="paperjump-home__empty-card">
                      <Empty
                        description="还没有简历，先从模板开始第一份。"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button type="primary" onClick={handleCreateDraft}>
                          选模板开始
                        </Button>
                      </Empty>
                    </Card>
                  ) : (
                    <Row gutter={[20, 20]}>
                      {recentDrafts.map((draft) => (
                        <Col xs={24} md={12} xl={8} key={draft.id}>
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
        ) : null}
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
