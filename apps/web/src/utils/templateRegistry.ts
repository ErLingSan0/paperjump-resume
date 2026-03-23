import type {
  ResumeAccentTone,
  ResumeFontFamily,
  ResumeLayoutPreset,
  ResumeSectionKey,
  ResumeTitleStyle,
} from '@/types/resume';

export type TemplateStyleSettings = {
  layoutPreset: ResumeLayoutPreset;
  accentTone: ResumeAccentTone;
  fontFamily: ResumeFontFamily;
  titleStyle: ResumeTitleStyle;
  bodyFontSize: number;
  lineHeight: number;
  pagePadding: number;
  sectionSpacing: number;
};

export type TemplateLayoutVariant =
  | 'centered-blue'
  | 'profile-purple'
  | 'info-grid-blue'
  | 'hero-band-blue';

export const visibleTemplateCodes = [
  'campus-launch',
  'steady-general',
  'data-focus',
  'executive-brief',
] as const;

export type VisibleTemplateCode = (typeof visibleTemplateCodes)[number];

export type TemplateRegistryEntry = {
  code: VisibleTemplateCode;
  name: string;
  category: string;
  coverImageUrl: string;
  description: string;
  badge: string;
  mood: string;
  spotlight: string;
  previewVariant: 'default' | 'creative' | 'student' | string;
  layoutVariant: TemplateLayoutVariant;
  sectionOrder: ResumeSectionKey[];
  settings: TemplateStyleSettings;
};

const hiddenTemplateAliases: Record<string, VisibleTemplateCode> = {
  'design-showcase': 'steady-general',
  'internship-sprint': 'campus-launch',
  'one-page-priority': 'data-focus',
  'project-story': 'executive-brief',
};

export const templateRegistry: Record<VisibleTemplateCode, TemplateRegistryEntry> = {
  'campus-launch': {
    code: 'campus-launch',
    name: '新媒体运营版',
    category: 'content',
    coverImageUrl: '/template-previews/campus-launch.svg',
    description: '适合内容运营、新媒体、传播与品牌岗位的正式单栏简历。',
    badge: '运营 / 内容',
    mood: '正式单栏',
    spotlight: '头像居中、章节分割清晰，适合传播与内容岗位',
    previewVariant: 'student',
    layoutVariant: 'centered-blue',
    sectionOrder: ['education', 'experience', 'projects', 'summary', 'skills', 'awards'],
    settings: {
      layoutPreset: 'classic',
      accentTone: 'cobalt',
      fontFamily: 'system',
      titleStyle: 'rule',
      bodyFontSize: 13,
      lineHeight: 1.56,
      pagePadding: 28,
      sectionSpacing: 18,
    },
  },
  'steady-general': {
    code: 'steady-general',
    name: '前端架构版',
    category: 'engineering',
    coverImageUrl: '/template-previews/steady-general.svg',
    description: '适合资深前端、架构与工程管理方向的专业履历。',
    badge: '架构 / 工程',
    mood: '资深履历',
    spotlight: '紫线标题与时间列布局，更适合经历较长的工程简历',
    previewVariant: 'default',
    layoutVariant: 'profile-purple',
    sectionOrder: ['education', 'experience', 'projects', 'summary', 'skills', 'awards'],
    settings: {
      layoutPreset: 'classic',
      accentTone: 'violet',
      fontFamily: 'system',
      titleStyle: 'minimal',
      bodyFontSize: 12.8,
      lineHeight: 1.5,
      pagePadding: 22,
      sectionSpacing: 16,
    },
  },
  'data-focus': {
    code: 'data-focus',
    name: '自动驾驶测试版',
    category: 'technical',
    coverImageUrl: '/template-previews/data-focus.svg',
    description: '适合测试、研发、算法与自动驾驶方向的技术简历。',
    badge: '测试 / 研发',
    mood: '信息抬头',
    spotlight: '头部四宫格信息更完整，适合技术履历与时间线表达',
    previewVariant: 'default',
    layoutVariant: 'info-grid-blue',
    sectionOrder: ['education', 'experience', 'projects', 'skills', 'summary', 'awards'],
    settings: {
      layoutPreset: 'classic',
      accentTone: 'cobalt',
      fontFamily: 'system',
      titleStyle: 'rule',
      bodyFontSize: 12.9,
      lineHeight: 1.5,
      pagePadding: 24,
      sectionSpacing: 18,
    },
  },
  'executive-brief': {
    code: 'executive-brief',
    name: '私域增长版',
    category: 'operation',
    coverImageUrl: '/template-previews/executive-brief.svg',
    description: '适合私域、增长、市场与偏正式运营岗位的成稿简历。',
    badge: '增长 / 运营',
    mood: '横幅抬头',
    spotlight: '顶部横幅信息更完整，适合正式运营与增长岗位投递',
    previewVariant: 'default',
    layoutVariant: 'hero-band-blue',
    sectionOrder: ['education', 'experience', 'projects', 'summary', 'skills', 'awards'],
    settings: {
      layoutPreset: 'classic',
      accentTone: 'cobalt',
      fontFamily: 'system',
      titleStyle: 'rule',
      bodyFontSize: 13,
      lineHeight: 1.54,
      pagePadding: 24,
      sectionSpacing: 17,
    },
  },
};

export function isVisibleTemplateCode(code?: string | null): code is VisibleTemplateCode {
  return visibleTemplateCodes.includes(code as VisibleTemplateCode);
}

export function getTemplateRegistryEntry(code?: string | null) {
  if (!code) {
    return null;
  }

  const normalizedCode = isVisibleTemplateCode(code)
    ? code
    : hiddenTemplateAliases[code] ?? null;

  if (!normalizedCode) {
    return null;
  }

  return templateRegistry[normalizedCode];
}
