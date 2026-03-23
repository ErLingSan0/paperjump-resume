import { useEffect, useRef, useState } from 'react';

import type { ResumeTemplate } from '@/services/templates';

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
    left: '43.89%',
    top: '6.51%',
    width: '12.22%',
    height: '10.79%',
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
    top: '4.13%',
    width: '12.89%',
    height: '11.11%',
    radius: '10px',
    objectPosition: 'center 24%',
  },
};

type TemplatePaperPreviewProps = {
  template: ResumeTemplate;
  mode?: 'gallery' | 'picker';
  onReady?: () => void;
};

export function getTemplatePreviewSource(template: ResumeTemplate) {
  return template.coverImageUrl || `/template-previews/${template.code}.svg`;
}

export function getTemplatePreviewAssetUrls(template: ResumeTemplate) {
  const urls = [getTemplatePreviewSource(template)];
  const avatarOverlay = templatePreviewAvatarMap[template.code];

  if (avatarOverlay?.src) {
    urls.push(avatarOverlay.src);
  }

  return urls;
}

export default function TemplatePaperPreview(props: TemplatePaperPreviewProps) {
  const { template, mode = 'gallery', onReady } = props;
  const previewSource = getTemplatePreviewSource(template);
  const avatarOverlay = templatePreviewAvatarMap[template.code];
  const imageRef = useRef<HTMLImageElement | null>(null);
  const avatarRef = useRef<HTMLImageElement | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [avatarReady, setAvatarReady] = useState(!avatarOverlay);
  const readyEmittedRef = useRef(false);

  useEffect(() => {
    readyEmittedRef.current = false;
    setImageReady(false);
    setAvatarReady(!avatarOverlay);
  }, [avatarOverlay, previewSource, template.code]);

  useEffect(() => {
    if (imageRef.current?.complete) {
      setImageReady(true);
    }

    if (avatarRef.current?.complete) {
      setAvatarReady(true);
    }
  }, [avatarOverlay, previewSource]);

  useEffect(() => {
    if (!onReady || readyEmittedRef.current || !imageReady || !avatarReady) {
      return;
    }

    readyEmittedRef.current = true;
    onReady();
  }, [avatarReady, imageReady, onReady]);

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
              ref={imageRef}
              className="template-paper-preview__image"
              src={previewSource}
              alt={`${template.name} 模板封面`}
              loading={mode === 'gallery' ? 'eager' : 'lazy'}
              fetchPriority={mode === 'gallery' ? 'high' : 'auto'}
              onLoad={() => setImageReady(true)}
              onError={() => setImageReady(true)}
            />
            {avatarOverlay ? (
              <img
                ref={avatarRef}
                className="template-paper-preview__avatar"
                src={avatarOverlay.src}
                alt=""
                aria-hidden="true"
                loading={mode === 'gallery' ? 'eager' : 'lazy'}
                onLoad={() => setAvatarReady(true)}
                onError={() => setAvatarReady(true)}
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
