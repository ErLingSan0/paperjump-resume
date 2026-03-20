import type { ResumeTemplate } from '@/services/templates';
import type {
  ResumeAccentTone,
  ResumeFontFamily,
  ResumeLayoutPreset,
  ResumeSectionKey,
  ResumeTitleStyle,
} from '@/types/resume';

type TemplatePickerSource = 'home' | 'resumes' | 'maker' | 'templates';
type TemplatePickerIntent = 'create' | 'switch';

type TemplateBackTargetOptions = {
  from?: string | null;
  resumeId?: string | null;
};

type TemplatePickerPathOptions = {
  from?: TemplatePickerSource;
  intent?: TemplatePickerIntent;
  resumeId?: string | null;
};

type TemplateDraftSurface = {
  templateId: number | null;
  sectionOrder: ResumeSectionKey[];
  layoutPreset: ResumeLayoutPreset;
  accentTone: ResumeAccentTone;
  fontFamily: ResumeFontFamily;
  titleStyle: ResumeTitleStyle;
  bodyFontSize: number;
  lineHeight: number;
  pagePadding: number;
  sectionSpacing: number;
};

export type TemplateLayoutVariant = 'default' | 'student' | 'project' | 'sidebar' | 'executive';

export const sidebarTemplateSectionKeys = new Set<ResumeSectionKey>(['summary', 'skills', 'awards']);

export const templateSectionOrderPresets: Partial<Record<string, ResumeSectionKey[]>> = {
  'campus-launch': ['summary', 'education', 'projects', 'experience', 'skills', 'awards'],
  'internship-sprint': ['summary', 'experience', 'projects', 'education', 'skills', 'awards'],
  'steady-general': ['summary', 'experience', 'projects', 'education', 'skills', 'awards'],
  'project-story': ['summary', 'projects', 'experience', 'education', 'skills', 'awards'],
  'design-showcase': ['summary', 'projects', 'experience', 'skills', 'education', 'awards'],
  'one-page-priority': ['summary', 'experience', 'projects', 'skills', 'education', 'awards'],
  'data-focus': ['summary', 'projects', 'experience', 'skills', 'education', 'awards'],
  'executive-brief': ['summary', 'experience', 'education', 'projects', 'skills', 'awards'],
};

export function applyTemplateSectionOrder(templateCode: string, currentOrder: ResumeSectionKey[]) {
  const preset = templateSectionOrderPresets[templateCode];
  if (!preset?.length) {
    return currentOrder;
  }

  return [...preset, ...currentOrder.filter((key) => !preset.includes(key))];
}

export function applyTemplateSettingsToDraft<T extends TemplateDraftSurface>(
  draft: T,
  template: ResumeTemplate,
) {
  return {
    ...draft,
    templateId: template.id,
    sectionOrder: applyTemplateSectionOrder(template.code, draft.sectionOrder),
    ...template.settings,
  };
}

export function buildTemplatePickerPath(options: TemplatePickerPathOptions = {}) {
  const { from = 'resumes', intent = 'create', resumeId } = options;
  const searchParams = new URLSearchParams();
  searchParams.set('from', from);
  searchParams.set('intent', intent);

  if (resumeId) {
    searchParams.set('resumeId', resumeId);
  }

  return `/templates?${searchParams.toString()}`;
}

export function getTemplatePickerReturnPath(options: TemplateBackTargetOptions) {
  const { from, resumeId } = options;

  if (resumeId) {
    return `/maker/${resumeId}`;
  }

  if (from === 'home') {
    return '/';
  }

  if (from === 'resumes') {
    return '/resumes';
  }

  if (from === 'templates') {
    return '/templates';
  }

  return '/resumes';
}

export function getTemplateLayoutVariant(templateCode?: string | null): TemplateLayoutVariant {
  if (!templateCode) {
    return 'default';
  }

  if (templateCode === 'design-showcase') {
    return 'sidebar';
  }

  if (templateCode === 'executive-brief') {
    return 'executive';
  }

  if (templateCode === 'project-story' || templateCode === 'data-focus') {
    return 'project';
  }

  if (templateCode === 'campus-launch' || templateCode === 'internship-sprint') {
    return 'student';
  }

  return 'default';
}

export function getTemplateSectionClassName(props: {
  key: ResumeSectionKey;
  templateCode?: string | null;
  layoutVariant: TemplateLayoutVariant;
}) {
  const { key, templateCode, layoutVariant } = props;

  if (layoutVariant === 'sidebar' && sidebarTemplateSectionKeys.has(key)) {
    return 'paperjump-maker__resume-section--sidebar-card';
  }

  if ((layoutVariant === 'student' || layoutVariant === 'executive') && key === 'summary') {
    return 'paperjump-maker__resume-section--summary-card';
  }

  if (layoutVariant === 'project' && key === 'projects') {
    return 'paperjump-maker__resume-section--spotlight';
  }

  if (templateCode === 'campus-launch' && key === 'education') {
    return 'paperjump-maker__resume-section--summary-card';
  }

  if (templateCode === 'internship-sprint' && (key === 'experience' || key === 'projects')) {
    return 'paperjump-maker__resume-section--spotlight';
  }

  if (templateCode === 'data-focus' && key === 'summary') {
    return 'paperjump-maker__resume-section--summary-card';
  }

  if (templateCode === 'one-page-priority' && key === 'summary') {
    return 'paperjump-maker__resume-section--summary-card';
  }

  return '';
}

export function getTemplatePreviewSrc(template: Pick<ResumeTemplate, 'code' | 'coverImageUrl'>) {
  return template.coverImageUrl || `/template-previews/${template.code}.svg`;
}

export function getTemplatePickerBackLabel(options: TemplateBackTargetOptions) {
  if (options.resumeId) {
    return '返回编辑器';
  }

  if (options.from === 'home') {
    return '返回首页';
  }

  if (options.from === 'resumes') {
    return '返回简历库';
  }

  return '返回简历库';
}
