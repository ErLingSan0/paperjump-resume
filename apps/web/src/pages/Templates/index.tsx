import { useEffect, useMemo, useState } from 'react';

import {
  AppstoreOutlined,
  LeftOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { history, useLocation } from '@umijs/max';
import { Button, Skeleton, message } from 'antd';

import TemplatePaperPreview from '@/components/TemplatePaperPreview';
import WorkspaceShell from '@/components/WorkspaceShell';
import { createResume, queryResume, updateResume } from '@/services/resumes';
import type { ResumeTemplate } from '@/services/templates';
import { queryTemplates, setTemplateFavorite } from '@/services/templates';
import { createEmptyDraft, applyTemplateStarterContent } from '@/utils/resumeDrafts';
import { getErrorMessage } from '@/utils/request';
import {
  getTemplatePickerBackLabel,
  getTemplatePickerReturnPath,
  applyTemplateSettingsToDraft,
} from '@/utils/templateFlow';
import { isVisibleTemplateCode } from '@/utils/templateRegistry';

export default function TemplatesPage() {
  const location = useLocation();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingTemplateId, setSubmittingTemplateId] = useState<number | null>(null);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const resumeId = searchParams.get('resumeId');
  const from = searchParams.get('from');
  const isTemplateSwitch = Boolean(resumeId);
  const backPath = getTemplatePickerReturnPath({ from, resumeId });
  const backLabel = getTemplatePickerBackLabel({ from, resumeId });

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);

    try {
      const nextTemplates = await queryTemplates();
      setTemplates(nextTemplates.filter((template) => isVisibleTemplateCode(template.code)));
    } catch (error) {
      message.error(getErrorMessage(error, '模板列表加载失败，请稍后再试'));
    } finally {
      setLoading(false);
    }
  }

  async function handleUseTemplate(template: ResumeTemplate) {
    setSubmittingTemplateId(template.id);

    try {
      if (resumeId) {
        const currentDraft = await queryResume(resumeId);
        const nextDraft = applyTemplateSettingsToDraft(currentDraft, template);
        await updateResume(resumeId, nextDraft);
        message.success('模板已应用到当前简历');
        history.push(`/maker/${resumeId}`);
        return;
      }

      const starterDraft = applyTemplateStarterContent(createEmptyDraft('new'), template.code);
      const created = await createResume(applyTemplateSettingsToDraft(starterDraft, template));
      history.push(`/maker/${created.id}`);
    } catch (error) {
      message.error(getErrorMessage(error, isTemplateSwitch ? '模板应用失败，请稍后再试' : '创建简历失败，请稍后再试'));
    } finally {
      setSubmittingTemplateId(null);
    }
  }

  async function handleToggleFavorite(template: ResumeTemplate) {
    try {
      await setTemplateFavorite(template.id, !template.favorited);
      await loadTemplates();
      message.success(template.favorited ? '已取消收藏模板' : '已收藏模板');
    } catch (error) {
      message.error(getErrorMessage(error, '模板收藏失败，请稍后再试'));
    }
  }

  return (
    <WorkspaceShell activeNav="templates" heroMode="none" title="模板库">
      <div className="workspace-page-stack">
        <section className="workspace-panel workspace-panel--catalog">
          <header className="workspace-panel__header workspace-panel__header--catalog">
            <div>
              <span className="workspace-panel__eyebrow mono-label">TEMPLATES</span>
              <h1 className="workspace-panel__title">{isTemplateSwitch ? '更换模板' : '选择模板'}</h1>
              <p className="workspace-panel__meta">先选一个正式模板，再进入编辑器继续写内容。</p>
            </div>
            <div className="workspace-panel__actions workspace-panel__actions--compact">
              <span className="workspace-inline-meta">{loading ? '载入中' : `${templates.length} 套正式模板`}</span>
              <Button icon={<LeftOutlined />} onClick={() => history.push(backPath)}>
                {backLabel}
              </Button>
            </div>
          </header>

          <div className="workspace-panel__content workspace-panel__content--catalog">
            {loading ? (
              <div className="workspace-template-gallery workspace-template-gallery--focused">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className="workspace-template-tile workspace-template-tile--loading" key={`template-loading-${index}`}>
                    <Skeleton.Image active style={{ width: '100%', height: 320 }} />
                    <div className="workspace-template-tile__body">
                      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '54%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : templates.length ? (
              <div className="workspace-template-gallery workspace-template-gallery--focused">
                {templates.map((template) => (
                  <article className="workspace-template-tile workspace-template-tile--focused" key={template.id}>
                    <div className="workspace-template-tile__preview workspace-template-tile__preview--cover">
                      <button
                        type="button"
                        className={[
                          'workspace-template-tile__favorite',
                          'workspace-template-tile__favorite--overlay',
                          template.favorited ? 'workspace-template-tile__favorite--active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-label={template.favorited ? '取消收藏模板' : '收藏模板'}
                        onClick={() => handleToggleFavorite(template)}
                      >
                        <StarOutlined />
                      </button>
                      <TemplatePaperPreview template={template} />
                    </div>

                    <div className="workspace-template-tile__body">
                      <span className="workspace-template-tile__eyebrow">{template.badge}</span>
                      <h3 className="workspace-template-tile__title">{template.name}</h3>
                      <p className="workspace-template-tile__description">{template.description}</p>
                      <p className="workspace-template-tile__spotlight">{template.spotlight}</p>

                      <div className="workspace-template-tile__footer">
                        <Button
                          type="primary"
                          block
                          className="workspace-template-tile__cta"
                          loading={submittingTemplateId === template.id}
                          onClick={() => handleUseTemplate(template)}
                        >
                          {isTemplateSwitch ? '应用到当前简历' : '使用模板'}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="workspace-empty">
                <div className="workspace-empty__icon">
                  <AppstoreOutlined />
                </div>
                <h3 className="workspace-empty__title">模板暂时还没准备好</h3>
                <p className="workspace-empty__description">稍后再刷新一下，我们会先把正式模板整理到这里。</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
