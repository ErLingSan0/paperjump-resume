import type { CSSProperties, ReactNode } from 'react';

import { Tag, Typography } from 'antd';

import type { ResumeTemplate } from '@/services/templates';
import type { ResumeFontFamily, ResumeSectionKey } from '@/types/resume';
import {
  applyTemplateSectionOrder,
  getTemplateLayoutVariant,
  getTemplateSectionClassName,
  sidebarTemplateSectionKeys,
} from '@/utils/templateFlow';

const previewFontFamilyMap: Record<ResumeFontFamily, string> = {
  studio: "'Plus Jakarta Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  system: "'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif",
  serif: "'Songti SC', 'STSong', 'Noto Serif SC', serif",
};

const accentOptions = {
  cobalt: '#2151ff',
  sage: '#7b9464',
  ink: '#101418',
} as const;

const defaultSectionOrder: ResumeSectionKey[] = [
  'summary',
  'education',
  'experience',
  'projects',
  'skills',
  'awards',
];

const sectionTitleMap: Record<ResumeSectionKey, string> = {
  summary: '个人简介',
  education: '教育经历',
  experience: '工作经历',
  projects: '项目经历',
  skills: '技能清单',
  awards: '补充信息',
};

type TimelineItem = {
  title: string;
  subtitle: string;
  duration: string;
  description?: string;
  metaLabel?: string;
  metaValue?: string;
  highlights?: string[];
};

type PreviewSample = {
  name: string;
  headline: string;
  avatarLabel?: string;
  meta: string[];
  summary: string;
  education: TimelineItem[];
  experience: TimelineItem[];
  projects: TimelineItem[];
  skills: string[];
  awards: string;
};

const templateSamples: Partial<Record<string, PreviewSample>> = {
  'campus-launch': {
    name: '林安',
    headline: '应届生 / 校招求职',
    meta: ['上海', 'linan@example.com', '项目协作 / 校园实践'],
    summary: '用清晰结构整理项目、课程与校园实践，适合第一份正式投递简历。',
    education: [
      {
        title: '上海大学 · 信息管理与信息系统',
        subtitle: '本科',
        duration: '2021 - 2025',
        description: 'GPA 3.8 / 4.0，核心课程包括项目管理、用户研究与数据分析。',
      },
    ],
    experience: [
      {
        title: '校园活动中心',
        subtitle: '项目助理',
        duration: '2024.03 - 2024.08',
        description: '参与专题活动策划与现场执行，负责资料整理、沟通协同和活动复盘。',
      },
    ],
    projects: [
      {
        title: '校园品牌推广项目',
        subtitle: '项目协调',
        duration: '课程项目',
        description: '从策划到复盘完整跟进，梳理宣传物料、报名流程和活动节奏。',
      },
    ],
    skills: ['资料整理', '沟通表达', 'Office', '活动执行'],
    awards: '一等奖学金 / 校级案例分析奖',
  },
  'internship-sprint': {
    name: '许宁',
    headline: '运营实习生 / 增长方向',
    meta: ['杭州', 'xuning@example.com', '内容增长 / 数据复盘'],
    summary: '突出执行节奏、项目推进和结果表达，适合实习与运营岗位。',
    education: [
      {
        title: '浙江传媒学院 · 新闻传播',
        subtitle: '本科',
        duration: '2020 - 2024',
        description: '主修用户研究、传播策划与数据分析方法。',
      },
    ],
    experience: [
      {
        title: '某内容平台',
        subtitle: '运营实习生',
        duration: '2024.04 - 2024.09',
        description: '负责活动页协作与投放复盘，产出周报和增长建议。',
        highlights: ['活动转化率提升 12%', '沉淀 3 套复盘模板'],
      },
    ],
    projects: [
      {
        title: '校园社团招新专题',
        subtitle: '策划 / 运营',
        duration: '2023.09',
        description: '统筹内容发布与社媒传播，覆盖 5000+ 学生。',
      },
    ],
    skills: ['Excel', 'SQL', 'Canva', '内容策划'],
    awards: '校级优秀学生干部 / 新媒体作品奖',
  },
  'steady-general': {
    name: '陈一鸣',
    headline: '产品经理 / 通用投递',
    meta: ['上海', 'chenym@example.com', 'B 端产品 / 协同设计'],
    summary: '信息层级克制，适合大多数岗位，强调阅读效率和成熟度。',
    education: [
      {
        title: '华东师范大学 · 信息管理',
        subtitle: '本科',
        duration: '2018 - 2022',
        description: '关注产品逻辑、数据分析和团队协同方法。',
      },
    ],
    experience: [
      {
        title: '协同办公 SaaS',
        subtitle: '产品经理',
        duration: '2023.03 - 至今',
        description: '负责工作台、表单与权限体验，推进设计与研发协作。',
      },
    ],
    projects: [
      {
        title: '模板中心改版',
        subtitle: '产品 / 设计协同',
        duration: '2024.07',
        description: '梳理从选模板到编辑器的主路径，降低用户迷失。',
      },
    ],
    skills: ['Axure', 'Figma', 'SQL', 'PRD'],
    awards: '产品创新奖 / 年度协作奖',
  },
  'project-story': {
    name: '周朴',
    headline: '产品经理 / 项目型简历',
    meta: ['北京', 'zhoupu@example.com', '项目策划 / 复盘表达'],
    summary: '让项目内容站到更前面，适合产品、运营、项目制岗位。',
    education: [
      {
        title: '北京邮电大学 · 信息工程',
        subtitle: '本科',
        duration: '2019 - 2023',
        description: '主修软件工程、需求分析与数据可视化。',
      },
    ],
    experience: [
      {
        title: '社区内容平台',
        subtitle: '产品运营',
        duration: '2023.07 - 至今',
        description: '负责活动页和创作者工具，持续打磨核心工作流。',
      },
    ],
    projects: [
      {
        title: '创作者成长路径',
        subtitle: '产品项目',
        duration: '2024.11',
        description: '从调研到上线全链路推进，覆盖新手引导、任务激励与数据看板。',
        highlights: ['留存提升 9%', '引导完成率提升 16%'],
      },
    ],
    skills: ['产品策划', 'Figma', '用户研究', '数据复盘'],
    awards: '最佳项目复盘奖 / 优秀 PM 实习生',
  },
  'design-showcase': {
    name: '顾青',
    headline: 'UI / UX 设计师',
    avatarLabel: 'GQ',
    meta: ['广州', 'guqing@example.com', 'B 端 / 品牌视觉'],
    summary: '用双栏信息组织突出作品和项目，适合设计、内容和创意岗位。',
    education: [
      {
        title: '广州美术学院 · 视觉传达',
        subtitle: '本科',
        duration: '2017 - 2021',
        description: '主修品牌系统、交互叙事与视觉规范。',
      },
    ],
    experience: [
      {
        title: '品牌设计工作室',
        subtitle: '视觉设计师',
        duration: '2022.04 - 至今',
        description: '负责官网、营销页与品牌活动物料设计。',
      },
    ],
    projects: [
      {
        title: '简历品牌系统',
        subtitle: '视觉 / 交互',
        duration: '2024.06',
        description: '重做模板库与编辑器视觉层级，提升信息辨识度。',
      },
    ],
    skills: ['Figma', 'Illustrator', 'Design System', 'Motion'],
    awards: '站酷推荐 / 设计周入围作品',
  },
  'one-page-priority': {
    name: '何远',
    headline: '综合岗位 / 一页版',
    meta: ['深圳', 'heyuan@example.com', '一页压缩 / 信息提炼'],
    summary: '控制留白与节奏，适合信息偏多但仍希望收在一页的投递版本。',
    education: [
      {
        title: '深圳大学 · 工商管理',
        subtitle: '本科',
        duration: '2016 - 2020',
        description: '关注项目推进、商业分析与组织协作。',
      },
    ],
    experience: [
      {
        title: '业务运营团队',
        subtitle: '项目专员',
        duration: '2022.01 - 至今',
        description: '负责项目推进、资料整理和跨团队协调，支撑复杂业务场景。',
      },
    ],
    projects: [
      {
        title: '区域活动优化项目',
        subtitle: '项目推进',
        duration: '2024.03',
        description: '在不增加页数的前提下提升信息密度与操作效率。',
      },
    ],
    skills: ['项目推进', '信息提炼', '跨团队沟通', '报告整理'],
    awards: '优秀员工 / 内部案例分享奖',
  },
  'data-focus': {
    name: '宋野',
    headline: '数据分析师 / 商业分析',
    meta: ['成都', 'songye@example.com', '指标拆解 / 策略建议'],
    summary: '强调结果、指标和项目复盘，让数据价值更快被看见。',
    education: [
      {
        title: '西南财经大学 · 统计学',
        subtitle: '硕士',
        duration: '2021 - 2024',
        description: '方向包括回归分析、实验设计与商业建模。',
      },
    ],
    experience: [
      {
        title: '零售品牌分析组',
        subtitle: '数据分析师',
        duration: '2024.06 - 至今',
        description: '搭建周报和实验复盘机制，支撑增长策略决策。',
      },
    ],
    projects: [
      {
        title: '会员分层策略',
        subtitle: '数据项目',
        duration: '2024.12',
        description: '拆解人群价值与触达路径，形成季度运营策略建议。',
        highlights: ['复购率提升 11%', '高价值用户识别效率提升 22%'],
      },
    ],
    skills: ['SQL', 'Python', 'Tableau', 'A/B Test'],
    awards: '商业分析竞赛一等奖 / 优秀研究助理',
  },
  'executive-brief': {
    name: '梁策',
    headline: '咨询顾问 / 管理培训生',
    avatarLabel: 'LC',
    meta: ['北京', 'liangce@example.com', '策略分析 / 沟通表达'],
    summary: '更成熟克制的文档气质，适合正式岗位、咨询与管理方向投递。',
    education: [
      {
        title: '中国人民大学 · 工商管理',
        subtitle: '硕士',
        duration: '2020 - 2023',
        description: '研究方向包括组织管理、商业模型与战略落地。',
      },
    ],
    experience: [
      {
        title: '战略咨询项目组',
        subtitle: '咨询顾问',
        duration: '2023.07 - 至今',
        description: '参与企业诊断、项目推进与方案汇报，负责结构化输出。',
      },
    ],
    projects: [
      {
        title: '区域经营分析',
        subtitle: '咨询项目',
        duration: '2024.10',
        description: '完成市场策略评估与运营路径建议，支持管理层决策。',
      },
    ],
    skills: ['Business Analysis', 'PPT', 'Excel', 'Stakeholder'],
    awards: '优秀咨询新人 / 案例竞赛冠军',
  },
};

const fallbackSample = templateSamples['steady-general'] as PreviewSample;

type TemplatePaperPreviewProps = {
  template: ResumeTemplate;
  mode?: 'gallery' | 'picker';
};

export default function TemplatePaperPreview(props: TemplatePaperPreviewProps) {
  const { template, mode = 'gallery' } = props;
  const sample = templateSamples[template.code] ?? fallbackSample;
  const previewScale = mode === 'picker' ? 0.44 : 0.48;
  const layoutVariant = getTemplateLayoutVariant(template.code);
  const orderedSections = applyTemplateSectionOrder(template.code, defaultSectionOrder);
  const accentColor = accentOptions[template.settings.accentTone] ?? '#2151ff';
  const previewStyle = {
    '--resume-font-family': previewFontFamilyMap[template.settings.fontFamily],
    '--resume-body-size': `${(template.settings.bodyFontSize * previewScale).toFixed(2)}px`,
    '--resume-line-height': String(template.settings.lineHeight),
    '--resume-page-padding': `${Math.max(8, template.settings.pagePadding * previewScale)}px`,
    '--resume-section-gap': `${Math.max(6, template.settings.sectionSpacing * previewScale)}px`,
    '--template-accent': accentColor,
  } as CSSProperties;

  const previewSections = orderedSections.map((key) => ({
    key,
    node: renderSection(key),
  }));
  const sidebarSections =
    layoutVariant === 'sidebar'
      ? previewSections.filter((item) => sidebarTemplateSectionKeys.has(item.key))
      : [];
  const mainSections =
    layoutVariant === 'sidebar'
      ? previewSections.filter((item) => !sidebarTemplateSectionKeys.has(item.key))
      : previewSections;
  const useSidebarPreview = layoutVariant === 'sidebar' && sidebarSections.length > 0;

  return (
    <div className={`template-paper-preview template-paper-preview--${mode}`}>
      <div
        className={[
          'paperjump-maker__preview-paper',
          'paperjump-maker__preview-paper--mini',
          `paperjump-maker__preview-paper--${template.settings.layoutPreset}`,
          `paperjump-maker__preview-paper--accent-${template.settings.accentTone}`,
          `paperjump-maker__preview-paper--title-${template.settings.titleStyle}`,
          `paperjump-maker__preview-paper--variant-${layoutVariant}`,
          `paperjump-maker__preview-paper--template-${template.code}`,
        ].join(' ')}
        style={previewStyle}
      >
        <div className={['paperjump-maker__resume-header', `paperjump-maker__resume-header--${layoutVariant}`].join(' ')}>
          <div className="paperjump-maker__resume-header-main">
            <div className="paperjump-maker__resume-header-copy">
              <Typography.Title level={2}>{sample.name}</Typography.Title>
              <Typography.Text className="paperjump-maker__resume-headline">
                {sample.headline}
              </Typography.Text>
            </div>
            {sample.avatarLabel ? (
              <div className="paperjump-maker__resume-avatar template-paper-preview__avatar">
                <span>{sample.avatarLabel}</span>
              </div>
            ) : null}
          </div>

          <div className="paperjump-maker__resume-meta">
            {sample.meta.map((item) => (
              <span key={item} className="paperjump-maker__resume-meta-item">
                {item}
              </span>
            ))}
          </div>
        </div>

        {useSidebarPreview ? (
          <div className="paperjump-maker__resume-layout paperjump-maker__resume-layout--sidebar">
            <aside className="paperjump-maker__resume-sidebar">
              {sidebarSections.map((item) => item.node)}
            </aside>
            <div className="paperjump-maker__resume-main">
              {mainSections.map((item) => item.node)}
            </div>
          </div>
        ) : (
          <div className={['paperjump-maker__resume-layout', `paperjump-maker__resume-layout--${layoutVariant}`].join(' ')}>
            {mainSections.map((item) => item.node)}
          </div>
        )}
      </div>
    </div>
  );

  function renderSection(key: ResumeSectionKey) {
    const sectionClassName = getTemplateSectionClassName({
      key,
      templateCode: template.code,
      layoutVariant,
    });

    if (key === 'summary') {
      return (
        <section
          key={key}
          className={['paperjump-maker__resume-section', sectionClassName].filter(Boolean).join(' ')}
        >
          <div className="paperjump-maker__resume-section-title">{sectionTitleMap[key]}</div>
          <div className="paperjump-maker__paragraphs">
            <Typography.Paragraph>
              {sample.summary} {template.spotlight}
            </Typography.Paragraph>
          </div>
        </section>
      );
    }

    if (key === 'skills') {
      return (
        <section
          key={key}
          className={['paperjump-maker__resume-section', sectionClassName].filter(Boolean).join(' ')}
        >
          <div className="paperjump-maker__resume-section-title">{sectionTitleMap[key]}</div>
          <div className="paperjump-maker__skill-list">
            {sample.skills.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        </section>
      );
    }

    if (key === 'awards') {
      return (
        <section
          key={key}
          className={['paperjump-maker__resume-section', sectionClassName].filter(Boolean).join(' ')}
        >
          <div className="paperjump-maker__resume-section-title">{sectionTitleMap[key]}</div>
          <div className="paperjump-maker__paragraphs">
            <Typography.Paragraph>{sample.awards}</Typography.Paragraph>
          </div>
        </section>
      );
    }

    const items = sample[key];
    return (
      <section
        key={key}
        className={['paperjump-maker__resume-section', sectionClassName].filter(Boolean).join(' ')}
      >
        <div className="paperjump-maker__resume-section-title">{sectionTitleMap[key]}</div>
        {items.map((item) => renderTimelineItem(item, key))}
      </section>
    );
  }
}

function renderTimelineItem(item: TimelineItem, key: ResumeSectionKey): ReactNode {
  return (
    <div className="paperjump-maker__timeline-item" key={`${key}-${item.title}-${item.duration}`}>
      <div className="paperjump-maker__timeline-head">
        <div className="paperjump-maker__timeline-head-main">
          <span className="paperjump-maker__timeline-title">{item.title}</span>
          <span className="paperjump-maker__timeline-subtitle">{item.subtitle}</span>
        </div>
        <em className="paperjump-maker__timeline-duration">{item.duration}</em>
      </div>

      {item.metaLabel && item.metaValue ? (
        <div className="paperjump-maker__timeline-meta">
          <div className="paperjump-maker__timeline-meta-row">
            <span className="paperjump-maker__timeline-meta-label">{item.metaLabel}</span>
            <span className="paperjump-maker__timeline-meta-text">{item.metaValue}</span>
          </div>
        </div>
      ) : null}

      {item.description ? <Typography.Paragraph>{item.description}</Typography.Paragraph> : null}

      {item.highlights?.length ? (
        <ul className="paperjump-maker__bullet-list">
          {item.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
