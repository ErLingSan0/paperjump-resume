import { request } from '@umijs/max';

import type {
  ResumeAccentTone,
  ResumeFontFamily,
  ResumeLayoutPreset,
  ResumeTitleStyle,
} from '@/types/resume';
import { getTemplateRegistryEntry, visibleTemplateCodes } from '@/utils/templateRegistry';

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
  const templates = await request<ResumeTemplate[]>('/api/templates', {
    method: 'GET',
  });

  return templates
    .map((template) => {
      const registryEntry = getTemplateRegistryEntry(template.code);
      if (!registryEntry) {
        return template;
      }

      return {
        ...template,
        name: registryEntry.name,
        category: registryEntry.category,
        coverImageUrl: registryEntry.coverImageUrl,
        description: registryEntry.description,
        badge: registryEntry.badge,
        mood: registryEntry.mood,
        spotlight: registryEntry.spotlight,
        previewVariant: registryEntry.previewVariant,
        settings: registryEntry.settings,
      };
    })
    .sort((left, right) => {
      const leftIndex = visibleTemplateCodes.indexOf(left.code as (typeof visibleTemplateCodes)[number]);
      const rightIndex = visibleTemplateCodes.indexOf(right.code as (typeof visibleTemplateCodes)[number]);

      if (leftIndex === -1 && rightIndex === -1) {
        return 0;
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
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
