import { request } from '@umijs/max';

import type {
  ResumeAccentTone,
  ResumeFontFamily,
  ResumeLayoutPreset,
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

export type ResumeTemplate = {
  id: number;
  code: string;
  name: string;
  category: 'campus' | 'general' | 'compact' | string;
  coverImageUrl: string | null;
  description: string;
  badge: string;
  mood: string;
  spotlight: string;
  previewVariant: 'default' | 'creative' | 'student' | string;
  settings: TemplateStyleSettings;
  favorited: boolean;
};

export async function queryTemplates() {
  return request<ResumeTemplate[]>('/api/templates', {
    method: 'GET',
  });
}

export async function setTemplateFavorite(templateId: number, favorited: boolean) {
  return request(`/api/templates/${templateId}/favorite`, {
    method: 'PUT',
    data: {
      favorited,
    },
  });
}
