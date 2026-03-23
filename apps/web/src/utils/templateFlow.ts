import type { ResumeTemplate, TemplateLayoutVariant } from '@/services/templates';
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

export function applyTemplateSectionOrder(template: Pick<ResumeTemplate, 'sectionOrder'>, currentOrder: ResumeSectionKey[]) {
  const preset = template.sectionOrder;
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
    sectionOrder: applyTemplateSectionOrder(template, draft.sectionOrder),
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

  return '/';
}

export function getTemplateLayoutVariant(
  template?: Pick<ResumeTemplate, 'layoutVariant'> | null,
): TemplateLayoutVariant {
  switch (template?.layoutVariant) {
    case 'centered-blue':
    case 'profile-purple':
    case 'info-grid-blue':
    case 'hero-band-blue':
      return template.layoutVariant;
    default:
      return 'profile-purple';
  }
}

export function getTemplatePickerBackLabel(options: TemplateBackTargetOptions) {
  if (options.resumeId) {
    return '返回编辑器';
  }

  if (options.from === 'home') {
    return '返回概览';
  }

  if (options.from === 'resumes') {
    return '返回简历库';
  }

  return '返回概览';
}
