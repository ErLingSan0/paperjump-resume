import {
  BgColorsOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  LayoutOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { useParams } from '@umijs/max';
import { Space, Tag, Typography } from 'antd';

import PageHero from '@/components/PageHero';
import SurfaceCard from '@/components/SurfaceCard';

const checklist = [
  'Basic profile and contact block',
  'Education, work, project, and awards sections',
  'Template-aware layout renderer',
  'Auto-save, publish, and export hooks',
];

export default function EditorPage() {
  const params = useParams<{ resumeId: string }>();
  const resumeId = params.resumeId ?? 'new';

  return (
    <div className="page-shell">
      <PageHero
        eyebrow="Editor Shell"
        title={(
          <>
            Resume editor surface for <code>{resumeId}</code>
          </>
        )}
        description="This route is where structured editing, live preview, and template settings will eventually come together. The goal is a calm studio surface, not a crowded form."
        actions={(
          <Space wrap size={12}>
            <Tag color="cyan">Structured editing next</Tag>
            <Tag color="blue">Live preview planned</Tag>
          </Space>
        )}
      />

      <div className="editor-shell-grid">
        <SurfaceCard title="Section rail">
          <div className="check-list">
            {checklist.map((item) => (
              <div className="check-list__item" key={item}>
                <CheckCircleOutlined className="check-list__icon" />
                <Typography.Text>{item}</Typography.Text>
              </div>
            ))}
          </div>
        </SurfaceCard>
        <SurfaceCard title="Preview paper">
          <div className="preview-paper">
            <div className="preview-paper__line preview-paper__line--strong" />
            <div className="preview-paper__line" />
            <div className="preview-paper__line" />
            <div className="preview-paper__line" />
            <div className="preview-paper__line preview-paper__line--strong" style={{ width: '42%' }} />
            <div className="preview-paper__line" />
            <div className="preview-paper__line" />
            <div className="preview-paper__line" />
            <div className="preview-paper__line preview-paper__line--strong" style={{ width: '48%' }} />
            <div className="preview-paper__line" />
            <div className="preview-paper__line" />
          </div>
        </SurfaceCard>
        <SurfaceCard title="Studio controls">
          <div className="check-list">
            <div className="check-list__item">
              <LayoutOutlined className="check-list__icon" />
              <Typography.Text>Template switcher and density controls</Typography.Text>
            </div>
            <div className="check-list__item">
              <BgColorsOutlined className="check-list__icon" />
              <Typography.Text>Theme, typography, and spacing adjustments</Typography.Text>
            </div>
            <div className="check-list__item">
              <ExportOutlined className="check-list__icon" />
              <Typography.Text>Export and publish actions stay in the right rail</Typography.Text>
            </div>
            <div className="check-list__item">
              <ReadOutlined className="check-list__icon" />
              <Typography.Text>
                Section tips and AI suggestions slot in under controls.
              </Typography.Text>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
