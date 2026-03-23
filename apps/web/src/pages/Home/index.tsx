import { type ReactNode, useEffect, useMemo, useState } from 'react';

import {
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Card, Col, Empty, Modal, Row, Space, Tag, Typography, message } from 'antd';

import WorkspaceShell from '@/components/WorkspaceShell';
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
  },
  {
    title: '边写边看纸面',
    description: '编辑区和 A4 预览同时工作，内容一改就能立刻看到。',
  },
  {
    title: '完成后再导出',
    description: '写完再微调样式和导出，不用一开始被太多功能打断。',
  },
];

const anonymousHeroFacts = [
  {
    label: '预览',
    value: 'A4 实时纸面反馈',
  },
  {
    label: '节奏',
    value: '适合分几次慢慢完善',
  },
];

const anonymousHighlights = [
  {
    label: '开始更轻',
    title: '概览页只保留真正影响开写的入口',
    description: '先把模板入口摆清楚，开始时不需要先理解一整套功能地图。',
    icon: <RocketOutlined />,
  },
  {
    label: '反馈更早',
    title: '写的时候就能看到纸面结果',
    description: '内容一改，A4 预览立刻响应，排版问题不会拖到导出之后才暴露。',
    icon: <FileTextOutlined />,
  },
  {
    label: '节奏更稳',
    title: '可以分几次慢慢补完整份简历',
    description: '先把版式和结构定下来，再分几次补内容，不用一开始就一次写完整份简历。',
    icon: <CheckCircleOutlined />,
  },
];

const anonymousUseCases = [
  {
    title: '校招 / 第一份正式简历',
    description: '先用正式结构把教育、项目、实习装进纸面里，避免一开始就写散。',
  },
  {
    title: '社招 / 需要重写经历',
    description: '先用模板约束密度和层级，再判断哪些经历该保留、哪些该收短。',
  },
  {
    title: '转岗 / 想把经历重新组织',
    description: '先看纸面再改内容，更容易判断一页里到底有没有把重点讲清楚。',
  },
];

type HomeSectionHeadProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

function HomeSectionHead(props: HomeSectionHeadProps) {
  const { title, description, action } = props;

  return (
    <div className="paperjump-home__section-head">
      <div>
        <Typography.Title level={2}>{title}</Typography.Title>
        <Typography.Paragraph>{description}</Typography.Paragraph>
      </div>
      {action}
    </div>
  );
}

export default function HomePage() {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [drafts, setDrafts] = useState<ResumeDraftSummary[]>([]);
  const [loading, setLoading] = useState(false);

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
  const heroCaption = currentUser
    ? draftCount
      ? `当前已保存 ${draftCount} 份简历${latestDraft ? `，最近更新于 ${formatDraftTime(latestDraft.updatedAt)}` : ''}。`
      : '先从模板开始第一份，之后的内容都会自动保存在你的账号里。'
    : '概览页把产品说明、模板入口和开始顺序放在同一层，真正动手时再进入模板库和编辑器。';

  function handleCreateDraft() {
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

  return (
    <WorkspaceShell activeNav="overview" heroMode="none" title="概览">
      <div className="paperjump-home paperjump-home--workspace">
        <section className="paperjump-home__hero">
          <div className="paperjump-home__inner paperjump-home__hero-grid">
            <div className="paperjump-home__hero-copy">
              <Tag color="blue">在线简历工作区</Tag>
              <Typography.Title level={1}>{heroTitle}</Typography.Title>
              <Typography.Paragraph>{heroDescription}</Typography.Paragraph>
              <Space wrap size={14} className="paperjump-home__hero-actions">
                <Button
                  type="primary"
                  size="large"
                  icon={currentUser ? <FileTextOutlined /> : <RocketOutlined />}
                  onClick={currentUser ? handleOpenLatestDraft : handleCreateDraft}
                >
                  {currentUser ? (latestDraft ? '继续最近一份' : '选模板开始') : '先看模板'}
                </Button>
                {currentUser ? (
                  <Button size="large" onClick={() => history.push('/resumes')}>
                    打开简历库
                  </Button>
                ) : null}
              </Space>
              <Typography.Text className="paperjump-home__hero-caption">{heroCaption}</Typography.Text>
            </div>

            <div className="paperjump-home__hero-preview">
              <div className="paperjump-home__hero-preview-stack">
                {currentUser ? (
                  <div className="paperjump-home__hero-panel">
                    <div className="paperjump-home__hero-panel-head">
                      <span>当前状态</span>
                      <strong>{latestDraft ? '最近内容和下一步' : '先开第一份简历'}</strong>
                    </div>
                    <div className="paperjump-home__hero-panel-list">
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
                    </div>
                    <div className="paperjump-home__hero-panel-callout">
                      <span>{latestDraft ? '最近一份' : '下一步'}</span>
                      <strong>{latestDraft ? latestDraft.title : '先去模板库挑一套正式版式'}</strong>
                      <small>
                        {latestDraft?.headline ||
                          '选好模板后会直接进入编辑器，内容会自动保存到你的账号里。'}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="paperjump-home__hero-panel paperjump-home__hero-panel--workflow">
                    <div className="paperjump-home__hero-panel-head">
                      <span>开始一份简历</span>
                      <strong>按这个顺序就够了</strong>
                    </div>
                    <div className="paperjump-home__hero-timeline" aria-label="使用步骤">
                      {heroSteps.map((item, index) => (
                        <div className="paperjump-home__hero-timeline-item" key={item.title}>
                          <span className="paperjump-home__hero-timeline-index">0{index + 1}</span>
                          <div className="paperjump-home__hero-timeline-body">
                            <strong>{item.title}</strong>
                            <small>{item.description}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="paperjump-home__hero-facts">
                      {anonymousHeroFacts.map((item) => (
                        <div className="paperjump-home__hero-fact" key={item.label}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {!currentUser ? (
          <section className="paperjump-home__support" id="home-support">
            <div className="paperjump-home__inner paperjump-home__support-grid">
              <div className="paperjump-home__support-main">
                <span className="paperjump-home__support-eyebrow">为什么这样开始</span>
                <Typography.Title level={2}>开始之前，先进入能写、能看、能继续的状态。</Typography.Title>
                <Typography.Paragraph className="paperjump-home__support-description">
                  概览页不再拆成几段分别解释同一件事，而是把真正决定你能不能顺利开写的几个点收在一起。
                </Typography.Paragraph>

                <div className="paperjump-home__highlight-list">
                  {anonymousHighlights.map((item) => (
                    <article className="paperjump-home__highlight-item" key={item.label}>
                      <div className="paperjump-home__highlight-icon">{item.icon}</div>
                      <div className="paperjump-home__highlight-body">
                        <span className="paperjump-home__highlight-label">{item.label}</span>
                        <Typography.Title level={4}>{item.title}</Typography.Title>
                        <Typography.Paragraph>{item.description}</Typography.Paragraph>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="paperjump-home__support-side">
                <div className="paperjump-home__support-side-head">
                  <span className="paperjump-home__support-eyebrow">适合这些情况</span>
                  <Typography.Title level={3}>这些场景会更适合从这里开始</Typography.Title>
                  <Typography.Paragraph>
                    无论是第一份正式简历，还是把旧简历重新整理成更可投递的版本，都适合先从模板入口起步。
                  </Typography.Paragraph>
                </div>

                <div className="paperjump-home__audience-list">
                  {anonymousUseCases.map((item) => (
                    <article className="paperjump-home__audience-card" key={item.title}>
                      <Typography.Title level={4}>{item.title}</Typography.Title>
                      <Typography.Paragraph>{item.description}</Typography.Paragraph>
                    </article>
                  ))}
                </div>

                <Button size="large" type="primary" block onClick={handleCreateDraft}>
                  先看模板
                </Button>
              </aside>
            </div>
          </section>
        ) : null}

        {currentUser ? (
          <section className="paperjump-home__drafts" id="recent-drafts">
            <div className="paperjump-home__inner">
              <HomeSectionHead
                title="最近编辑"
                description="从这里继续最近的几份简历，完整管理和搜索仍然在简历库里。"
                action={<Button onClick={() => history.push('/resumes')}>打开简历库</Button>}
              />
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
      </div>
    </WorkspaceShell>
  );
}
