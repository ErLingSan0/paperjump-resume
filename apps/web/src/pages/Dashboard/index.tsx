import { useEffect, useState } from 'react';

import {
  AppstoreOutlined,
  ArrowRightOutlined,
  ProfileOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Skeleton, message } from 'antd';

import WorkspaceShell, { WorkspaceHeroStat } from '@/components/WorkspaceShell';
import { createResume, queryResumes } from '@/services/resumes';
import { queryTemplates, type ResumeTemplate } from '@/services/templates';
import type { ResumeDraftSummary } from '@/types/resume';
import { applyTemplateStarterContent, createEmptyDraft, formatDraftTime } from '@/utils/resumeDrafts';
import { getErrorMessage } from '@/utils/request';
import {
  applyTemplateSettingsToDraft,
  buildTemplatePickerPath,
} from '@/utils/templateFlow';

export default function DashboardPage() {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [resumes, setResumes] = useState<ResumeDraftSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadWorkspaceData() {
      setLoading(true);

      try {
        const [nextTemplates, nextResumes] = await Promise.all([
          queryTemplates(),
          queryResumes(),
        ]);

        if (!active) {
          return;
        }

        setTemplates(nextTemplates);
        setResumes(nextResumes);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWorkspaceData();

    return () => {
      active = false;
    };
  }, []);

  const sortedResumes = resumes
    .slice()
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const latestResume = sortedResumes[0];
  const favoriteCount = templates.filter((item) => item.favorited).length;
  const favoriteTemplates = templates.filter((item) => item.favorited).slice(0, 3);

  async function handleUseTemplate(template: ResumeTemplate) {
    try {
      const starterDraft = applyTemplateStarterContent(createEmptyDraft('new'), template.code);
      const created = await createResume(applyTemplateSettingsToDraft(starterDraft, template));

      history.push(`/maker/${created.id}`);
    } catch (error) {
      message.error(getErrorMessage(error, '暂时无法使用该模板，请稍后再试'));
    }
  }

  return (
    <WorkspaceShell
      activeNav="resumes"
      heroMode="compact"
      eyebrow="overview"
      title={currentUser ? `${currentUser.displayName}，从这里继续你的下一步` : '概览'}
      description="概览只保留继续编辑和模板入口，真正的列表管理放到简历库里。"
      actions={(
        <>
          <Button onClick={() => history.push('/resumes')}>打开简历库</Button>
          <Button
            type="primary"
            onClick={() => history.push(buildTemplatePickerPath({ from: 'resumes', intent: 'create' }))}
          >
            先选模板
          </Button>
        </>
      )}
      aside={(
        <>
          <WorkspaceHeroStat
            label="全部简历"
            value={String(resumes.length).padStart(2, '0')}
            meta="账号下的全部内容"
            tone="warm"
          />
          <WorkspaceHeroStat
            label="收藏模板"
            value={String(favoriteCount).padStart(2, '0')}
            meta="常用版式会出现在右侧"
            tone="cobalt"
          />
          <WorkspaceHeroStat
            label="最近更新"
            value={latestResume ? formatDraftTime(latestResume.updatedAt) : '暂无'}
            meta={latestResume ? latestResume.title : '创建简历后会显示'}
            tone="sage"
          />
        </>
      )}
    >
      <div className="workspace-page-grid workspace-page-grid--overview">
        <section className="workspace-panel">
          <header className="workspace-panel__header">
            <div>
              <h2 className="workspace-panel__title">继续最近编辑</h2>
              <p className="workspace-panel__meta">
                {resumes.length ? '先从最近的一份接着写，完整列表再去简历库看。' : '先选一个模板开始，最近编辑会自动回到这里。'}
              </p>
            </div>
          </header>

          <div className="workspace-panel__content">
            {loading ? (
              <div className="workspace-loading-list">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div className="workspace-loading-card" key={`overview-loading-${index}`}>
                    <Skeleton.Avatar active size={56} shape="square" />
                    <div className="workspace-loading-card__body">
                      <Skeleton.Input active size="small" block />
                      <Skeleton.Input active size="small" block />
                    </div>
                  </div>
                ))}
              </div>
            ) : latestResume ? (
              <div className="workspace-overview-stack">
                <article className="workspace-feature-card">
                  <div className="workspace-feature-card__copy">
                    <span className="workspace-feature-card__eyebrow mono-label">LAST EDITED</span>
                    <h3 className="workspace-feature-card__title">{latestResume.title}</h3>
                    <p className="workspace-feature-card__meta">
                      {latestResume.headline || latestResume.templateName || '继续补全这份简历的内容和版式。'}
                    </p>
                    <div className="workspace-feature-card__facts">
                      <span>{latestResume.templateName || '未选择模板'}</span>
                      <span>{latestResume.status === 'published' ? '已发布' : '草稿中'}</span>
                      <span>{formatDraftTime(latestResume.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="workspace-feature-card__actions">
                    <Button type="primary" onClick={() => history.push(`/maker/${latestResume.id}`)}>
                      继续编辑
                    </Button>
                  </div>
                </article>

                {sortedResumes.length > 1 ? (
                  <div className="workspace-mini-list">
                    {sortedResumes.slice(1, 3).map((resume) => (
                      <article className="workspace-mini-item" key={resume.id}>
                        <div className="workspace-mini-item__copy">
                          <span className="workspace-mini-item__eyebrow mono-label">
                            {resume.templateName || '未选模板'}
                          </span>
                          <h3 className="workspace-mini-item__title">{resume.title}</h3>
                          <p className="workspace-mini-item__meta">
                            {resume.headline || '继续补内容'}
                            <span className="workspace-mini-item__dot" />
                            {formatDraftTime(resume.updatedAt)}
                          </p>
                        </div>

                        <Button onClick={() => history.push(`/maker/${resume.id}`)}>
                          打开 <ArrowRightOutlined />
                        </Button>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="workspace-empty">
                <div className="workspace-empty__icon">
                  <ProfileOutlined />
                </div>
                <h3 className="workspace-empty__title">还没有简历</h3>
                <p className="workspace-empty__description">先选一个模板开始，之后这里会保留你最近编辑的进度。</p>
                <Button
                  type="primary"
                  onClick={() => history.push(buildTemplatePickerPath({ from: 'resumes', intent: 'create' }))}
                >
                  去选模板
                </Button>
              </div>
            )}

          </div>
        </section>

        <aside className="workspace-side-stack">
          <section className="workspace-panel">
            <header className="workspace-panel__header">
              <div>
                <h2 className="workspace-panel__title">常用模板</h2>
                <p className="workspace-panel__meta">
                  {favoriteTemplates.length ? '从收藏的版式直接开始会更快。' : '还没有收藏模板，先去模板中心挑一个。'}
                </p>
              </div>
            </header>
            <div className="workspace-panel__content">
              {loading ? (
                <div className="workspace-mini-list">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div className="workspace-mini-item workspace-mini-item--loading" key={`favorite-template-loading-${index}`}>
                      <Skeleton active paragraph={{ rows: 1, width: '100%' }} title={{ width: '42%' }} />
                    </div>
                  ))}
                </div>
              ) : favoriteTemplates.length ? (
                <div className="workspace-mini-list">
                  {favoriteTemplates.map((template) => (
                    <article className="workspace-mini-item" key={template.id}>
                      <div className="workspace-mini-item__copy">
                        <span className="workspace-mini-item__eyebrow mono-label">{template.mood}</span>
                        <h3 className="workspace-mini-item__title">{template.name}</h3>
                        <p className="workspace-mini-item__meta">
                          <AppstoreOutlined /> {template.badge}
                          <span className="workspace-mini-item__dot" />
                          <StarOutlined /> 已收藏
                        </p>
                      </div>

                      <Button size="middle" onClick={() => handleUseTemplate(template)}>
                        使用
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="workspace-empty workspace-empty--compact">
                  <div className="workspace-empty__icon">
                    <StarOutlined />
                  </div>
                <h3 className="workspace-empty__title">还没有常用模板</h3>
                <p className="workspace-empty__description">去模板中心收藏几套常用版式，这里会变成你的快速入口。</p>
                <Button type="primary" onClick={() => history.push('/templates')}>
                  打开模板中心
                  </Button>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
