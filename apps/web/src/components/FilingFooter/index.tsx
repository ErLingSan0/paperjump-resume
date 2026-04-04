import { Typography } from 'antd';

const filingNumber = '鲁ICP备2026015298号';
const filingLookupUrl = 'https://beian.miit.gov.cn/';

export default function FilingFooter() {
  return (
    <footer className="filing-footer" aria-label="网站备案信息">
      <Typography.Paragraph className="filing-footer__text">
        <a
          className="filing-footer__link"
          href={filingLookupUrl}
          target="_blank"
          rel="noreferrer"
        >
          {filingNumber}
        </a>
      </Typography.Paragraph>
    </footer>
  );
}
