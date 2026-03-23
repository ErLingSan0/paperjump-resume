import type { ResumeTemplate } from '@/services/templates';

const templatePreviewAssetMap: Record<string, string> = {
  'campus-launch': '/template-previews/campus-launch.svg',
  'internship-sprint': '/template-previews/internship-sprint.svg',
  'steady-general': '/template-previews/steady-general.svg',
  'project-story': '/template-previews/project-story.svg',
  'design-showcase': '/template-previews/design-showcase.svg',
  'one-page-priority': '/template-previews/one-page-priority.svg',
  'data-focus': '/template-previews/data-focus.svg',
  'executive-brief': '/template-previews/executive-brief.svg',
};

const templatePreviewAvatarMap: Record<
  string,
  {
    src: string;
    left: string;
    top: string;
    width: string;
    height: string;
    radius: string;
    objectPosition: string;
  }
> = {
  'campus-launch': {
    src: '/template-avatars/cow-office.jpg',
    left: '43.9%',
    top: '6.5%',
    width: '12.22%',
    height: '10.8%',
    radius: '10px',
    objectPosition: 'center center',
  },
  'steady-general': {
    src: '/template-avatars/pony-office.jpg',
    left: '9.33%',
    top: '4.76%',
    width: '7.78%',
    height: '6.83%',
    radius: '8px',
    objectPosition: 'center 28%',
  },
  'data-focus': {
    src: '/template-avatars/cow-office.jpg',
    left: '5.78%',
    top: '4.6%',
    width: '9.56%',
    height: '8.73%',
    radius: '8px',
    objectPosition: 'center center',
  },
  'executive-brief': {
    src: '/template-avatars/pony-office.jpg',
    left: '43.56%',
    top: '5.4%',
    width: '12.89%',
    height: '11.11%',
    radius: '10px',
    objectPosition: 'center 24%',
  },
};

type TemplatePaperPreviewProps = {
  template: ResumeTemplate;
  mode?: 'gallery' | 'picker';
};

function getTemplatePreviewSource(template: ResumeTemplate) {
  return template.coverImageUrl || templatePreviewAssetMap[template.code] || null;
}

export default function TemplatePaperPreview(props: TemplatePaperPreviewProps) {
  const { template, mode = 'gallery' } = props;
  const previewSource = getTemplatePreviewSource(template);
  const avatarOverlay = templatePreviewAvatarMap[template.code];

  if (previewSource) {
    return (
      <div
        className={[
          'template-paper-preview',
          `template-paper-preview--${mode}`,
          `template-paper-preview--${template.code}`,
        ].join(' ')}
      >
        <div className="template-paper-preview__frame">
          <div className="template-paper-preview__canvas">
            <img
              className="template-paper-preview__image"
              src={previewSource}
              alt={`${template.name} 模板封面`}
              loading="lazy"
            />
            {avatarOverlay ? (
              <img
                className="template-paper-preview__avatar"
                src={avatarOverlay.src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                style={{
                  left: avatarOverlay.left,
                  top: avatarOverlay.top,
                  width: avatarOverlay.width,
                  height: avatarOverlay.height,
                  borderRadius: avatarOverlay.radius,
                  objectPosition: avatarOverlay.objectPosition,
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`template-paper-preview template-paper-preview--${mode}`}>
      <div className="template-paper-preview__fallback">
        <div className="template-paper-preview__fallback-top">
          <span className="template-paper-preview__fallback-badge">{template.badge}</span>
          <span className="template-paper-preview__fallback-dot" />
        </div>
        <div className="template-paper-preview__fallback-title">{template.name}</div>
        <div className="template-paper-preview__fallback-line template-paper-preview__fallback-line--short" />
        <div className="template-paper-preview__fallback-line" />
        <div className="template-paper-preview__fallback-line template-paper-preview__fallback-line--soft" />
        <div className="template-paper-preview__fallback-card">
          <div className="template-paper-preview__fallback-card-line template-paper-preview__fallback-card-line--accent" />
          <div className="template-paper-preview__fallback-card-line" />
          <div className="template-paper-preview__fallback-card-line template-paper-preview__fallback-card-line--soft" />
        </div>
      </div>
    </div>
  );
}
