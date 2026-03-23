import type { ResumeTemplate } from '@/services/templates';
import type {
  ResumeAccentTone,
  ResumeFontFamily,
  ResumeLayoutPreset,
  ResumeSectionKey,
  ResumeTitleStyle,
} from '@/types/resume';
import { getTemplateRegistryEntry, type TemplateLayoutVariant } from '@/utils/templateRegistry';

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

export function applyTemplateSectionOrder(templateCode: string, currentOrder: ResumeSectionKey[]) {
  const preset = getTemplateRegistryEntry(templateCode)?.sectionOrder;
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
  return getTemplateRegistryEntry(templateCode)?.layoutVariant ?? 'profile-purple';
}

export function getTemplateSectionClassName(props: {
  key: ResumeSectionKey;
  templateCode?: string | null;
  layoutVariant: TemplateLayoutVariant;
}) {
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
