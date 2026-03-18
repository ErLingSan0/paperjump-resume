import type { CardProps } from 'antd';

import { Card } from 'antd';

export default function SurfaceCard(props: CardProps) {
  const { className, ...rest } = props;

  return <Card className={['soft-panel', className].filter(Boolean).join(' ')} {...rest} />;
}
