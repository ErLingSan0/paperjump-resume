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
  const hasRecords = records.length > 0;
  const latestUpdatedLabel = latestResume ? formatDraftTime(latestResume.updatedAt) : '暂无';
  const listSummary = records.length
    ? `${filteredRecords.length} 份结果`
    : '先创建第一份简历';

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
          <header className="workspace-panel__header">
            <div>
              <span className="workspace-panel__eyebrow mono-label">RESUMES</span>
              <h2 className="workspace-panel__title">我的简历</h2>
            </div>
          </header>

          <div className="workspace-panel__content">
            {hasRecords ? (
              <>
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
                    placeholder="搜索标题、方向或模板"
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                </div>

                <div className="workspace-toolbar__summary">
                  <span>{listSummary}</span>
                  <span>草稿 {draftCount} 份</span>
                  <span>最近 {latestUpdatedLabel}</span>
                </div>
              </>
            ) : null}

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
                    primaryLabel="打开"
                    onDelete={handleDeleteResume}
                    onOpen={(resumeId) => history.push(`/maker/${resumeId}`)}
                  />
                ))}
              </div>
            ) : (
              <div
                className={[
                  'workspace-empty',
                  hasRecords ? '' : 'workspace-empty--centered',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="workspace-empty__icon">
                  <AppstoreOutlined />
                </div>
                <h3 className="workspace-empty__title">
                  {records.length ? '没有找到符合条件的简历' : '还没有简历'}
                </h3>
                <p className="workspace-empty__description">
                  {records.length
                    ? '换个关键词或筛选条件再试试看。'
                    : '先选一个模板开始，写好的内容都会留在这里。'}
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
                  showTotal={(total) => `共 ${total} 份`}
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
