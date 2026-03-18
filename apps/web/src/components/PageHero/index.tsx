import type { ReactNode } from 'react';

import { Space, Typography } from 'antd';

type PageHeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export default function PageHero(props: PageHeroProps) {
  const { eyebrow, title, description, actions, aside, className } = props;

  return (
    <section
      className={['page-hero', aside ? 'page-hero--split' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="page-hero__body">
        {eyebrow ? <div className="page-hero__eyebrow">{eyebrow}</div> : null}
        <Space direction="vertical" size={16}>
          <Typography.Title level={1} className="page-hero__title">
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Paragraph className="page-hero__description">
              {description}
            </Typography.Paragraph>
          ) : null}
        </Space>
        {actions ? <div className="page-hero__actions">{actions}</div> : null}
      </div>
      {aside ? <div className="page-hero__aside">{aside}</div> : null}
    </section>
  );
}
