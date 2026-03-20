import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import {
  AppstoreOutlined,
  ArrowRightOutlined,
  LeftOutlined,
  SearchOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { history, useLocation } from '@umijs/max';
import { Button, Input, Skeleton, message } from 'antd';

import TemplatePaperPreview from '@/components/TemplatePaperPreview';
import WorkspaceShell from '@/components/WorkspaceShell';
import { createResume, queryResume, updateResume } from '@/services/resumes';
import type { ResumeTemplate } from '@/services/templates';
import { queryTemplates, setTemplateFavorite } from '@/services/templates';
import { applyTemplateStarterContent, createEmptyDraft } from '@/utils/resumeDrafts';
import { getErrorMessage } from '@/utils/request';
import {
  applyTemplateSettingsToDraft,
  getTemplatePickerBackLabel,
  getTemplatePickerReturnPath,
} from '@/utils/templateFlow';

const categoryFilters = [
  { key: 'all', label: '全部' },
  { key: 'campus', label: '校招' },
  { key: 'general', label: '通用' },
  { key: 'compact', label: '紧凑' },
  { key: 'favorite', label: '已收藏' },
] as const;

function getCategoryLabel(category: string) {
  if (category === 'campus') {
    return '校招';
  }

  if (category === 'general') {
    return '通用';
  }

  if (category === 'compact') {
    return '紧凑';
  }

  return category;
}

export default function TemplatesPage() {
  const location = useLocation();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingTemplateId, setSubmittingTemplateId] = useState<number | null>(null);
  const [filterKey, setFilterKey] = useState<(typeof categoryFilters)[number]['key']>('all');
  const [keyword, setKeyword] = useState('');
  const deferredKeyword = useDeferredValue(keyword);
  const normalizedKeyword = deferredKeyword.trim().toLowerCase();
  const favoriteCount = templates.filter((template) => template.favorited).length;
  const compactCount = templates.filter((template) => template.category === 'compact').length;
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const resumeId = searchParams.get('resumeId');
  const from = searchParams.get('from');
  const isTemplateSwitch = Boolean(resumeId);
  const backPath = getTemplatePickerReturnPath({ from, resumeId });
  const backLabel = getTemplatePickerBackLabel({ from, resumeId });
  const pageTitle = isTemplateSwitch ? '更换模板' : '先选一个模板';
  const pageDescription = isTemplateSwitch
    ? '会保留当前内容，只替换模板风格、模块顺序和纸面节奏。'
    : '所有新建入口都会先来到这里，挑好模板后再进入编辑器。';
  const actionLabel = isTemplateSwitch ? '应用到当前简历' : '从这个模板开始';

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);

    try {
      const nextTemplates = await queryTemplates();
      setTemplates(nextTemplates);
    } catch (error) {
      message.error(getErrorMessage(error, '模板列表加载失败，请稍后再试'));
    } finally {
      setLoading(false);
    }
  }

  const filteredTemplates = templates.filter((template) => {
    if (filterKey === 'favorite' && !template.favorited) {
      return false;
    }

    if (filterKey !== 'all' && filterKey !== 'favorite' && template.category !== filterKey) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    const searchable = [
      template.name,
      template.description,
      template.spotlight,
      template.mood,
      template.badge,
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedKeyword);
  });

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

  function getFilterCount(filterKeyValue: (typeof categoryFilters)[number]['key']) {
    if (filterKeyValue === 'all') {
      return templates.length;
    }

    if (filterKeyValue === 'favorite') {
      return favoriteCount;
    }

    return templates.filter((template) => template.category === filterKeyValue).length;
  }

  return (
    <WorkspaceShell activeNav="templates" heroMode="none" title="模板中心">
      <div className="workspace-page-stack">
        <section className="workspace-panel workspace-panel--catalog">
          <header className="workspace-panel__header workspace-panel__header--catalog">
            <div>
              <span className="workspace-panel__eyebrow mono-label">TEMPLATES</span>
              <h1 className="workspace-panel__title">{pageTitle}</h1>
              <p className="workspace-panel__meta">{pageDescription}</p>
            </div>
            <div className="workspace-panel__actions">
              <div className="workspace-catalog-metrics" aria-label="模板概览">
                <span className="workspace-catalog-metric">
                  <strong>{templates.length}</strong>
                  <small>全部</small>
                </span>
                <span className="workspace-catalog-metric">
                  <strong>{favoriteCount}</strong>
                  <small>收藏</small>
                </span>
                <span className="workspace-catalog-metric">
                  <strong>{compactCount}</strong>
                  <small>紧凑</small>
                </span>
              </div>
              <Button icon={<LeftOutlined />} onClick={() => history.push(backPath)}>
                {backLabel}
              </Button>
            </div>
          </header>

          <div className="workspace-panel__content workspace-panel__content--catalog">
            <div className="workspace-toolbar workspace-toolbar--catalog">
              <div className="workspace-filter-pills">
                {categoryFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={[
                      'workspace-filter-pill',
                      filterKey === filter.key ? 'workspace-filter-pill--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setFilterKey(filter.key)}
                  >
                    <span>{filter.label}</span>
                    <span className="workspace-filter-pill__count">{getFilterCount(filter.key)}</span>
                  </button>
                ))}
              </div>

              <Input
                allowClear
                value={keyword}
                className="workspace-search workspace-search--catalog"
                prefix={<SearchOutlined />}
                placeholder="搜索模板名称、岗位方向或排版风格"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>

            {loading ? (
              <div className="workspace-template-gallery">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div className="workspace-template-tile workspace-template-tile--loading" key={`template-loading-${index}`}>
                    <Skeleton.Image active style={{ width: '100%', height: 300 }} />
                    <div className="workspace-template-tile__body">
                      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '56%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTemplates.length ? (
              <div className="workspace-template-gallery">
                {filteredTemplates.map((template) => (
                  <article className="workspace-template-tile" key={template.id}>
                    <div className="workspace-template-tile__preview">
                      <TemplatePaperPreview template={template} />
                    </div>

                    <div className="workspace-template-tile__body">
                      <div className="workspace-template-tile__header">
                        <div>
                          <span className="workspace-template-tile__mood mono-label">{template.mood}</span>
                          <h3 className="workspace-template-tile__title">{template.name}</h3>
                        </div>
                        <button
                          type="button"
                          className={[
                            'workspace-template-tile__favorite',
                            template.favorited ? 'workspace-template-tile__favorite--active' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-label={template.favorited ? '取消收藏模板' : '收藏模板'}
                          onClick={() => handleToggleFavorite(template)}
                        >
                          <StarOutlined />
                        </button>
                      </div>

                      <div className="workspace-template-tile__badges">
                        <span className="workspace-template-tile__badge workspace-template-tile__badge--accent">
                          {template.badge}
                        </span>
                        <span className="workspace-template-tile__badge">
                          {getCategoryLabel(template.category)}
                        </span>
                        {template.favorited ? (
                          <span className="workspace-template-tile__badge workspace-template-tile__badge--favorite">
                            已收藏
                          </span>
                        ) : null}
                      </div>

                      <p className="workspace-template-tile__description">{template.description}</p>

                      <div className="workspace-template-tile__actions">
                        <Button
                          type="primary"
                          loading={submittingTemplateId === template.id}
                          onClick={() => handleUseTemplate(template)}
                        >
                          {actionLabel} <ArrowRightOutlined />
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
                <h3 className="workspace-empty__title">没有找到匹配的模板</h3>
                <p className="workspace-empty__description">换个关键词或切换筛选条件再试试看。</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
