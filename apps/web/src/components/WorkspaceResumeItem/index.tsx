import { DeleteOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';

import type { ResumeDraftSummary } from '@/types/resume';
import { formatDraftTime } from '@/utils/resumeDrafts';

type WorkspaceResumeItemProps = {
  resume: ResumeDraftSummary;
  onOpen: (resumeId: string) => void;
  onDelete?: (resumeId: string) => void;
  primaryLabel?: string;
};

export default function WorkspaceResumeItem(props: WorkspaceResumeItemProps) {
  const {
    resume,
    onOpen,
    onDelete,
    primaryLabel = '继续编辑',
  } = props;
  const statusLabel = resume.status === 'published' ? '已发布' : '草稿';

  return (
    <article className="workspace-resume-item">
      <div className="workspace-resume-item__icon">
        <FileTextOutlined />
      </div>

      <div className="workspace-resume-item__body">
        <div className="workspace-resume-item__header">
          <h3 className="workspace-resume-item__title">{resume.title}</h3>
          <span
            className={[
              'workspace-status',
              resume.status === 'published' ? 'workspace-status--published' : 'workspace-status--draft',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {statusLabel}
          </span>
        </div>

        <div className="workspace-resume-item__meta">
          <span className="workspace-resume-item__meta-chip">
            {resume.templateName || '未选模板'}
          </span>
          {resume.headline ? (
            <span className="workspace-resume-item__meta-text">{resume.headline}</span>
          ) : null}
          <span className="workspace-resume-item__updated">{formatDraftTime(resume.updatedAt)}</span>
        </div>
      </div>

      <div className="workspace-resume-item__rail">
        <div className="workspace-resume-item__actions">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onOpen(resume.id)}
          >
            {primaryLabel}
          </Button>
          {onDelete ? (
            <Popconfirm
              title="确认删除这份简历？"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(resume.id)}
            >
              <Button danger icon={<DeleteOutlined />} aria-label="删除简历" />
            </Popconfirm>
          ) : null}
        </div>
      </div>
    </article>
  );
}
