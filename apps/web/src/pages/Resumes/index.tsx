import { useDeferredValue, useEffect, useState } from 'react';

import { AppstoreOutlined, SearchOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Input, Pagination, Skeleton, message } from 'antd';

import WorkspaceResumeItem from '@/components/WorkspaceResumeItem';
import WorkspaceShell from '@/components/WorkspaceShell';
import { deleteResume, queryResumes } from '@/services/resumes';
import type { ResumeDraftSummary } from '@/types/resume';
import { formatDraftTime } from '@/utils/resumeDrafts';
import { getErrorMessage } from '@/utils/request';
import { buildTemplatePickerPath } from '@/utils/templateFlow';

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'published', label: '已发布' },
] as const;

export default function ResumesPage() {
  const pageSize = 6;
  const [records, setRecords] = useState<ResumeDraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]['key']>('all');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const deferredKeyword = useDeferredValue(keyword);
  const normalizedKeyword = deferredKeyword.trim().toLowerCase();

  useEffect(() => {
    void loadResumes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, normalizedKeyword]);

  async function loadResumes() {
    setLoading(true);

    try {
      const nextRecords = await queryResumes();
      setRecords(nextRecords);
    } catch (error) {
      message.error(getErrorMessage(error, '简历列表加载失败，请稍后再试'));
    } finally {
      setLoading(false);
    }
  }

  const sortedRecords = records
    .slice()
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const publishedCount = records.filter((item) => item.status === 'published').length;
  const draftCount = records.length - publishedCount;
  const latestResume = sortedRecords[0];
  const filteredRecords = sortedRecords.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    const searchable = [item.title, item.headline, item.templateName].filter(Boolean).join(' ').toLowerCase();
    return searchable.includes(normalizedKeyword);
  });
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function handleDeleteResume(resumeId: string) {
    try {
      await deleteResume(resumeId);
      message.success('简历已删除');
      await loadResumes();
    } catch (error) {
      message.error(getErrorMessage(error, '删除失败，请稍后再试'));
    }
  }

  return (
    <WorkspaceShell activeNav="resumes" heroMode="none" title="简历库">
      <div className="workspace-page-stack">
        <section className="workspace-panel">
          <header className="workspace-panel__header workspace-panel__header--dense">
            <div>
              <span className="workspace-panel__eyebrow mono-label">RESUMES</span>
              <h2 className="workspace-panel__title">简历列表</h2>
              <p className="workspace-panel__meta">
                所有简历都在这里统一管理，支持搜索、筛选和分页浏览。
              </p>
            </div>
            <div className="workspace-compact-stats" aria-label="简历概览">
              <span className="workspace-compact-stat">
                <strong>{records.length}</strong>
                <small>全部</small>
              </span>
              <span className="workspace-compact-stat">
                <strong>{draftCount}</strong>
                <small>草稿</small>
              </span>
              <span className="workspace-compact-stat">
                <strong>{latestResume ? formatDraftTime(latestResume.updatedAt) : '--'}</strong>
                <small>最近更新</small>
              </span>
            </div>
          </header>

          <div className="workspace-panel__content">
            <div className="workspace-toolbar">
              <div className="workspace-filter-pills">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={[
                      'workspace-filter-pill',
                      statusFilter === filter.key ? 'workspace-filter-pill--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setStatusFilter(filter.key)}
                  >
                    <span>{filter.label}</span>
                    <span className="workspace-filter-pill__count">
                      {filter.key === 'all'
                        ? records.length
                        : filter.key === 'draft'
                          ? draftCount
                          : publishedCount}
                    </span>
                  </button>
                ))}
              </div>

              <Input
                allowClear
                value={keyword}
                className="workspace-search"
                prefix={<SearchOutlined />}
                placeholder="搜索简历标题或模板"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>

            {loading ? (
              <div className="workspace-loading-list">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className="workspace-loading-card" key={`resume-loading-${index}`}>
                    <Skeleton.Avatar active size={56} shape="square" />
                    <div className="workspace-loading-card__body">
                      <Skeleton.Input active size="small" block />
                      <Skeleton.Input active size="small" block />
                    </div>
                  </div>
                ))}
              </div>
            ) : pageRecords.length ? (
              <div className="workspace-resume-list">
                {pageRecords.map((resume) => (
                  <WorkspaceResumeItem
                    key={resume.id}
                    resume={resume}
                    primaryLabel="继续编辑"
                    onDelete={handleDeleteResume}
                    onOpen={(resumeId) => history.push(`/maker/${resumeId}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="workspace-empty">
                <div className="workspace-empty__icon">
                  <AppstoreOutlined />
                </div>
                <h3 className="workspace-empty__title">
                  {records.length ? '没有找到符合条件的简历' : '还没有简历'}
                </h3>
                <p className="workspace-empty__description">
                  {records.length
                    ? '换个筛选条件试试，或者重新去模板中心开始一份新的。'
                    : '先去选一个模板开始，之后这里会保留你的全部内容。'}
                </p>
                <Button
                  type="primary"
                  onClick={() => history.push(buildTemplatePickerPath({ from: 'resumes', intent: 'create' }))}
                >
                  去选模板
                </Button>
              </div>
            )}

            {filteredRecords.length > pageSize ? (
              <div className="workspace-panel__footer">
                <Pagination
                  className="workspace-pagination"
                  current={page}
                  total={filteredRecords.length}
                  pageSize={pageSize}
                  showTotal={(total, [start, end]) => `${start}-${end} / ${total}`}
                  showLessItems
                  showSizeChanger={false}
                  onChange={(nextPage) => setCurrentPage(nextPage)}
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
