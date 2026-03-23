import { useEffect, useMemo, useRef, useState } from 'react';

import {
  AppstoreOutlined,
  LeftOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { history, useLocation, useModel } from '@umijs/max';
import { Button, Spin, message } from 'antd';

import AuthModal from '@/components/AuthModal';
import TemplatePaperPreview, { getTemplatePreviewAssetUrls } from '@/components/TemplatePaperPreview';
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

const templatePreviewAssetCache = new Set<string>();

function preloadImage(src: string) {
  if (!src || templatePreviewAssetCache.has(src) || typeof window === 'undefined') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      templatePreviewAssetCache.add(src);
      resolve();
    };

    const image = new window.Image();
    image.onload = finish;
    image.onerror = finish;
    image.src = src;

    if (image.complete) {
      finish();
      return;
    }

    image.decode?.().then(finish).catch(() => undefined);
  });
}

async function preloadTemplatePreviewAssets(templates: ResumeTemplate[]) {
  const assetUrls = Array.from(
    new Set(templates.flatMap((template) => getTemplatePreviewAssetUrls(template)).filter(Boolean)),
  );

  await Promise.all(assetUrls.map((src) => preloadImage(src)));
}

export default function TemplatesPage() {
  const location = useLocation();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingTemplateId, setSubmittingTemplateId] = useState<number | null>(null);
  const [authModalState, setAuthModalState] = useState<{
    mode: 'login' | 'register';
    open: boolean;
    redirect: string;
  }>({
    mode: 'login',
    open: false,
    redirect: '/templates',
  });
  const autoUseRef = useRef<string | null>(null);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const resumeId = searchParams.get('resumeId');
  const from = searchParams.get('from');
  const pendingTemplateId = searchParams.get('pendingTemplateId');
  const isTemplateSwitch = Boolean(resumeId);
  const backPath = getTemplatePickerReturnPath({ from, resumeId });
  const backLabel = getTemplatePickerBackLabel({ from, resumeId });
  const currentPath = useMemo(
    () => `${location.pathname}${location.search || ''}${location.hash || ''}`,
    [location.hash, location.pathname, location.search],
  );

  useEffect(() => {
    void loadTemplates();
  }, []);

  useEffect(() => {
    if (!currentUser || !pendingTemplateId || loading || submittingTemplateId !== null) {
      return;
    }

    const matchedTemplate = templates.find((template) => String(template.id) === pendingTemplateId);

    if (!matchedTemplate || autoUseRef.current === pendingTemplateId) {
      return;
    }

    autoUseRef.current = pendingTemplateId;
    history.replace(buildTemplateRedirect());
    void handleUseTemplate(matchedTemplate);
  }, [currentUser, loading, pendingTemplateId, submittingTemplateId, templates]);

  function buildTemplateRedirect(nextPendingTemplateId?: number) {
    const nextSearchParams = new URLSearchParams(location.search);

    if (nextPendingTemplateId) {
      nextSearchParams.set('pendingTemplateId', String(nextPendingTemplateId));
    } else {
      nextSearchParams.delete('pendingTemplateId');
    }

    const nextSearch = nextSearchParams.toString();
    return `${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${location.hash || ''}`;
  }

  function openAuthModal(mode: 'login' | 'register', redirect = currentPath) {
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

  async function loadTemplates() {
    setLoading(true);
    setTemplates([]);

    try {
      const nextTemplates = await queryTemplates();
      const visibleTemplates = nextTemplates.filter((template) => template.galleryVisible);
      await preloadTemplatePreviewAssets(visibleTemplates);

      if (typeof window !== 'undefined') {
        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
          });
        });
      }

      setTemplates(visibleTemplates);
    } catch (error) {
      message.error(getErrorMessage(error, '模板列表加载失败，请稍后再试'));
    } finally {
      setLoading(false);
    }
  }

  async function handleUseTemplate(template: ResumeTemplate) {
    if (!currentUser) {
      openAuthModal('register', buildTemplateRedirect(template.id));
      return;
    }

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

      const starterDraft = applyTemplateStarterContent(createEmptyDraft('new'), template.starterContent);
      const created = await createResume(applyTemplateSettingsToDraft(starterDraft, template));
      history.push(`/maker/${created.id}`);
    } catch (error) {
      message.error(getErrorMessage(error, isTemplateSwitch ? '模板应用失败，请稍后再试' : '创建简历失败，请稍后再试'));
    } finally {
      setSubmittingTemplateId(null);
    }
  }

  async function handleToggleFavorite(template: ResumeTemplate) {
    if (!currentUser) {
      openAuthModal('login', currentPath);
      return;
    }

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
              <h1 className="workspace-panel__title">
                {isTemplateSwitch ? '更换模板' : currentUser ? '选择模板' : '先浏览模板'}
              </h1>
              <p className="workspace-panel__meta">
                {currentUser
                  ? '先选一个正式模板，再进入编辑器继续写内容。'
                  : '先把正式模板看清楚，再决定哪一种更适合你的这份简历。'}
              </p>
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
              <div className="workspace-loading-state workspace-loading-state--templates">
                <Spin size="large" tip="模板加载中..." />
                <div className="workspace-loading-state__hint">正在准备模板预览，请稍候。</div>
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
                          currentUser && template.favorited ? 'workspace-template-tile__favorite--active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-label={
                          currentUser
                            ? template.favorited
                              ? '取消收藏模板'
                              : '收藏模板'
                            : '收藏模板'
                        }
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
    </WorkspaceShell>
  );
}
