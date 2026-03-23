import { request } from '@umijs/max';

import type {
  ResumeAccentTone,
  ResumeDraftStarterContent,
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

export type ResumeTemplate = {
  id: number;
  code: string;
  name: string;
  coverImageUrl: string | null;
  description: string;
  badge: string;
  spotlight: string;
  settings: TemplateStyleSettings;
  layoutVariant: TemplateLayoutVariant;
  sectionOrder: ResumeSectionKey[];
  starterContent: ResumeDraftStarterContent | null;
  galleryVisible: boolean;
  favorited: boolean;
};

export async function queryTemplates() {
  const templates = await request<ResumeTemplate[]>('/api/templates', {
    method: 'GET',
  });

  return templates.map((template) => ({
    ...template,
    sectionOrder: Array.isArray(template.sectionOrder) ? template.sectionOrder : [],
    starterContent: template.starterContent ?? null,
    galleryVisible: Boolean(template.galleryVisible),
  }));
}

export async function setTemplateFavorite(templateId: number, favorited: boolean) {
  return request(`/api/templates/${templateId}/favorite`, {
    method: 'PUT',
    data: {
      favorited,
    },
  });
}
