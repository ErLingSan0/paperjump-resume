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
      ? '首页只保留继续最近内容和新建入口，完整管理统一放在简历库里。'
      : '从模板进入编辑器，边写边看纸面，内容会自动保存到你的账号。'
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

                {currentUser && latestDraft ? (
                  <div className="paperjump-home__hero-panel">
                    <div className="paperjump-home__hero-panel-head">
                      <span>最近内容</span>
                      <strong>{latestDraft.title}</strong>
                    </div>

                    <div className="paperjump-home__hero-draft-copy">
                      <strong>{latestDraft.headline || latestDraft.templateName || '未填写岗位标题'}</strong>
                      <small>
                        {latestDraft.status === 'published' ? '已发布' : '草稿中'} · 最近更新{' '}
                        {formatDraftTime(latestDraft.updatedAt)}
                      </small>
                    </div>
                    <div className="paperjump-home__hero-panel-actions">
                      <Button type="primary" block onClick={handleOpenLatestDraft}>
                        继续编辑
                      </Button>
                      <Button block onClick={handleCreateDraft}>
                        新建简历
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="paperjump-home__drafts" id="recent-drafts">
          <div className="paperjump-home__inner">
            <div className="paperjump-home__section-head">
              <div>
                <Typography.Title level={2}>{currentUser ? '最近内容' : '开始之前'}</Typography.Title>
                <Typography.Paragraph>
                  {currentUser
                    ? '首页只保留最近几份和继续入口，完整列表、搜索和筛选都放在简历库。'
                    : '先登录，再从模板开始；写过的内容以后都会回到这里继续。'}
                </Typography.Paragraph>
              </div>
              {currentUser ? (
                <Button onClick={() => history.push('/resumes')}>打开简历库</Button>
              ) : (
                <Button type="primary" onClick={() => openAuthModal('register', '/resumes')}>
                  登录 / 注册
                </Button>
              )}
            </div>
            <div className="paperjump-home__workspace-grid">
              <div className="paperjump-home__workspace-main">
                {!currentUser ? (
                  <Card className="paperjump-home__empty-card paperjump-home__setup-card">
                    <div className="paperjump-home__setup-compact">
                      <strong>登录后，简历会自动保存在你的账号里。</strong>
                      <small>从模板开始、写过的内容和最近编辑入口都会留在这里，下次回来可以直接继续。</small>
                      <div className="paperjump-home__setup-chips">
                        <span>账号保存</span>
                        <span>继续编辑</span>
                        <span>模板优先</span>
                      </div>
                    </div>
                    <Button
                      type="primary"
                      onClick={() =>
                        openAuthModal(
                          'register',
                          buildTemplatePickerPath({ from: 'home', intent: 'create' }),
                        )
                      }
                    >
                      登录后开始
                    </Button>
                  </Card>
                ) : loading ? (
                  <Card className="paperjump-home__empty-card" loading />
                ) : draftCount === 0 ? (
                  <Card className="paperjump-home__empty-card">
                    <Empty
                      description="还没有简历，先从模板开始第一份。"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" onClick={handleCreateDraft}>
                        去选模板
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
