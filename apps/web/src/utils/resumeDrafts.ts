import type {
  ResumeAccentTone,
  CustomSection,
  EducationEntry,
  ExperienceEntry,
  ProfileFact,
  ProjectEntry,
  ResumeDraft,
  ResumeDraftStarterContent,
  ResumeFontFamily,
  ResumeLayoutPreset,
  ResumeTitleStyle,
} from '@/types/resume';
import { resumeSectionKeys } from '@/types/resume';

const layoutPresets: ResumeLayoutPreset[] = ['classic', 'compact'];
const accentTones: ResumeAccentTone[] = ['cobalt', 'sage', 'ink', 'violet'];
const fontFamilies: ResumeFontFamily[] = ['studio', 'system', 'serif'];
const titleStyles: ResumeTitleStyle[] = ['rule', 'banner', 'minimal'];
const legacyRelaxedStyle = {
  layoutPreset: 'classic' as const,
  accentTone: 'cobalt' as const,
  fontFamily: 'studio' as const,
  titleStyle: 'rule' as const,
  bodyFontSize: 14,
  lineHeight: 1.65,
  pagePadding: 28,
  sectionSpacing: 22,
};

function createEntryId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function createProfileFact(label = '', value = ''): ProfileFact {
  return {
    id: createEntryId('fact'),
    label,
    value,
  };
}

function createEducationEntry(): EducationEntry {
  return {
    id: createEntryId('edu'),
    school: '上海大学',
    major: '信息管理与信息系统',
    degree: '本科',
    startDate: '2021.09',
    endDate: '2025.06',
    description: 'GPA 3.7 / 4.0，主修用户研究、数据分析、项目管理与信息设计。',
  };
}

function createExperienceEntry(): ExperienceEntry {
  return {
    id: createEntryId('exp'),
    company: '星桥科技',
    role: '运营实习生',
    startDate: '2023.07',
    endDate: '2023.12',
    description: '参与活动专题与内容协作，负责资料整理、跨团队沟通和效果复盘。\n推动活动上线节奏更稳定，交付过程更清晰。',
    highlights: [
      '参与活动专题与内容协作，负责资料整理、跨团队沟通和效果复盘。',
      '推动活动上线节奏更稳定，交付过程更清晰。',
    ],
  };
}

function createProjectEntry(): ProjectEntry {
  return {
    id: createEntryId('project'),
    name: '校园品牌活动项目',
    role: '项目协调',
    startDate: '2023.03',
    endDate: '2023.06',
    link: '',
    techStack: ['活动策划', '用户沟通', '复盘整理'],
    description: '统筹活动物料、执行日程和沟通流程，支持报名、现场执行与复盘整理。\n沉淀出一套可复用的协作模板，后续活动推进更顺畅。',
    highlights: [
      '统筹活动物料、执行日程和沟通流程，支持报名、现场执行与复盘整理。',
      '沉淀出一套可复用的协作模板，后续活动推进更顺畅。',
    ],
  };
}

function createEmptyEducationEntry(): EducationEntry {
  return {
    id: createEntryId('edu'),
    school: '',
    major: '',
    degree: '',
    startDate: '',
    endDate: '',
    description: '',
  };
}

function createEmptyExperienceEntry(): ExperienceEntry {
  return {
    id: createEntryId('exp'),
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    description: '',
    highlights: [],
  };
}

function createEmptyProjectEntry(): ProjectEntry {
  return {
    id: createEntryId('project'),
    name: '',
    role: '',
    startDate: '',
    endDate: '',
    link: '',
    techStack: [],
    description: '',
    highlights: [],
  };
}

function createEducationEntryFromPreset(entry: Omit<EducationEntry, 'id'>): EducationEntry {
  return {
    id: createEntryId('edu'),
    ...entry,
  };
}

function createExperienceEntryFromPreset(entry: Omit<ExperienceEntry, 'id'>): ExperienceEntry {
  return {
    id: createEntryId('exp'),
    ...entry,
  };
}

function createProjectEntryFromPreset(entry: Omit<ProjectEntry, 'id'>): ProjectEntry {
  return {
    id: createEntryId('project'),
    ...entry,
  };
}

function createEmptyCustomSection(): CustomSection {
  return {
    id: createEntryId('custom'),
    title: '',
    subtitle: '',
    time: '',
    location: '',
    content: '',
    visible: true,
  };
}

function normalizeSectionOrder(sectionOrder: unknown) {
  const order = Array.isArray(sectionOrder)
    ? sectionOrder.filter((item): item is (typeof resumeSectionKeys)[number] =>
        resumeSectionKeys.includes(item as (typeof resumeSectionKeys)[number]),
      )
    : [];

  const merged = [...order];
  resumeSectionKeys.forEach((key) => {
    if (!merged.includes(key)) {
      merged.push(key);
    }
  });

  return merged;
}

function normalizeEducationEntry(item: unknown): EducationEntry {
  const entry = (item ?? {}) as Partial<EducationEntry>;
  return {
    ...createEmptyEducationEntry(),
    ...entry,
    id: entry.id || createEntryId('edu'),
  };
}

function normalizeExperienceEntry(item: unknown): ExperienceEntry {
  const entry = (item ?? {}) as Partial<ExperienceEntry>;
  const normalizedDescription = typeof entry.description === 'string'
    ? entry.description.replace(/\r\n/g, '\n')
    : '';
  const highlights = normalizeHighlights(entry.highlights, normalizedDescription);

  return {
    ...createEmptyExperienceEntry(),
    ...entry,
    id: entry.id || createEntryId('exp'),
    highlights,
    description: normalizedDescription || serializeHighlights(highlights),
  };
}

function normalizeProjectEntry(item: unknown): ProjectEntry {
  const entry = (item ?? {}) as Partial<ProjectEntry>;
  const normalizedDescription = typeof entry.description === 'string'
    ? entry.description.replace(/\r\n/g, '\n')
    : '';
  const rawHighlights = normalizeHighlights(entry.highlights, normalizedDescription);
  const extractedMeta = extractProjectMeta(rawHighlights);
  const highlights = extractedMeta.highlights;

  return {
    ...createEmptyProjectEntry(),
    ...entry,
    id: entry.id || createEntryId('project'),
    link: normalizeProjectLink(entry.link || extractedMeta.link),
    techStack: normalizeTechStack(entry.techStack, extractedMeta.techStack),
    highlights,
    description: normalizedDescription || serializeHighlights(highlights),
  };
}

function normalizeHighlights(value: unknown, legacyDescription?: string) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? ''));
  }

  if (!legacyDescription) {
    return [] as string[];
  }

  return legacyDescription
    .split('\n')
    .map((item) => item.replace(/^[-•·]\s*/, '').trim())
    .filter(Boolean);
}

function normalizeProjectLink(value: unknown) {
  return String(value ?? '').trim();
}

function splitTechStackText(value: string) {
  return value
    .split(/\r?\n|[,，、]|[|｜]|\s+\/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTechStack(value: unknown, fallback: string[] = []) {
  const raw = Array.isArray(value)
    ? value.flatMap((item) => splitTechStackText(String(item ?? '')))
    : typeof value === 'string'
      ? splitTechStackText(value)
      : fallback;

  const seen = new Set<string>();

  return raw.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function extractUrlishText(value: string) {
  const matched = value.match(
    /((https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?)/i,
  );

  return matched?.[1]?.replace(/[),.;]+$/, '') ?? '';
}

function extractProjectMeta(highlights: string[]) {
  let link = '';
  let techStack: string[] = [];

  const remainingHighlights = highlights.filter((line) => {
    const normalizedLine = line.trim();
    if (!normalizedLine) {
      return false;
    }

    const linkMatch = normalizedLine.match(
      /^(项目地址|项目链接|链接|仓库地址|仓库链接|GitHub|Demo)\s*[:：-]\s*(.+)$/i,
    );

    if (linkMatch) {
      const extractedLink = extractUrlishText(linkMatch[2]);
      if (extractedLink) {
        link = link || extractedLink;
        return false;
      }
    }

    const stackMatch = normalizedLine.match(/^(技术栈|Tech Stack|Tech|技术方案|关键词|标签|工具|方法)\s*[:：-]\s*(.+)$/i);
    if (stackMatch) {
      const extractedTechStack = normalizeTechStack(stackMatch[2]);
      if (extractedTechStack.length) {
        techStack = techStack.length ? techStack : extractedTechStack;
        return false;
      }
    }

    return true;
  });

  return {
    link,
    techStack,
    highlights: remainingHighlights,
  };
}

function serializeHighlights(highlights: string[], legacyDescription = '') {
  const nextDescription = highlights.map((item) => item.trim()).filter(Boolean).join('\n');
  return nextDescription || legacyDescription || '';
}

function normalizeProfileFact(item: unknown): ProfileFact {
  const fact = (item ?? {}) as Partial<ProfileFact>;
  return {
    ...createProfileFact(),
    ...fact,
    id: fact.id || createEntryId('fact'),
  };
}

function normalizeCustomSection(item: unknown): CustomSection {
  const section = (item ?? {}) as Partial<CustomSection>;
  return {
    ...createEmptyCustomSection(),
    ...section,
    id: section.id || createEntryId('custom'),
    visible: section.visible ?? true,
  };
}

function normalizeLayoutPreset(value: unknown): ResumeLayoutPreset {
  return layoutPresets.includes(value as ResumeLayoutPreset)
    ? (value as ResumeLayoutPreset)
    : 'classic';
}

function normalizeAccentTone(value: unknown): ResumeAccentTone {
  return accentTones.includes(value as ResumeAccentTone)
    ? (value as ResumeAccentTone)
    : 'cobalt';
}

function normalizeFontFamily(value: unknown): ResumeFontFamily {
  return fontFamilies.includes(value as ResumeFontFamily)
    ? (value as ResumeFontFamily)
    : 'studio';
}

function normalizeTitleStyle(value: unknown): ResumeTitleStyle {
  return titleStyles.includes(value as ResumeTitleStyle)
    ? (value as ResumeTitleStyle)
    : 'rule';
}

function deriveDraftTitle(fullName: string, fallback = '未命名简历') {
  const normalizedName = fullName.trim();
  return normalizedName ? `${normalizedName}的简历` : fallback;
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  precision = 0,
) {
  const nextValue = Number(value);
  if (Number.isNaN(nextValue)) {
    return fallback;
  }

  const clamped = Math.min(Math.max(nextValue, min), max);
  if (precision <= 0) {
    return Math.round(clamped);
  }

  const factor = 10 ** precision;
  return Math.round(clamped * factor) / factor;
}

export function createEmptyDraft(id: string): ResumeDraft {
  const profile = {
    fullName: '陈一鸣',
    headline: '产品运营 / 通用求职',
    phone: '13800000000',
    email: 'chenyiming@example.com',
    location: '上海',
    website: 'chenyiming.me',
    avatar: '',
    facts: [createProfileFact('求职状态', '可尽快到岗')],
  };

  return {
    id,
    templateId: null,
    status: 'draft',
    visibility: 'private',
    title: deriveDraftTitle(profile.fullName),
    updatedAt: new Date().toISOString(),
    layoutPreset: 'classic',
    accentTone: 'cobalt',
    fontFamily: 'studio',
    titleStyle: 'rule',
    bodyFontSize: 13,
    lineHeight: 1.46,
    pagePadding: 24,
    sectionSpacing: 16,
    profile,
    summary:
      '关注内容组织、项目推进和用户体验，希望在产品、运营、项目协作或研究分析相关岗位持续积累方法。',
    education: [createEducationEntry()],
    experience: [createExperienceEntry()],
    projects: [createProjectEntry()],
    skills: '内容策划\n数据整理\n跨团队协作\n用户研究\nOffice / 飞书',
    awards: '校级奖学金\n英语六级',
    visibleSections: {
      summary: true,
      education: true,
      experience: true,
      projects: true,
      skills: true,
      awards: true,
    },
    sectionOrder: [...resumeSectionKeys],
    customSections: [],
  };
}

export function applyTemplateStarterContent(
  draft: ResumeDraft,
  starterContent?: ResumeDraftStarterContent | null,
): ResumeDraft {
  if (!starterContent) {
    return draft;
  }

  const starterProfile = starterContent.profile;

  return {
    ...draft,
    sectionOrder: draft.sectionOrder,
    profile: {
      ...draft.profile,
      ...(starterProfile ?? {}),
      facts: Array.isArray(starterProfile?.facts)
        ? starterProfile.facts.map((fact) => ({
            id: fact.id ?? createEntryId('fact'),
            label: fact.label,
            value: fact.value,
          }))
        : draft.profile.facts,
    },
    summary: typeof starterContent.summary === 'string' ? starterContent.summary : draft.summary,
    education: Array.isArray(starterContent.education)
      ? starterContent.education.map((entry) => createEducationEntryFromPreset(entry))
      : draft.education,
    experience: Array.isArray(starterContent.experience)
      ? starterContent.experience.map((entry) => createExperienceEntryFromPreset(entry))
      : draft.experience,
    projects: Array.isArray(starterContent.projects)
      ? starterContent.projects.map((entry) => createProjectEntryFromPreset(entry))
      : draft.projects,
    skills: typeof starterContent.skills === 'string' ? starterContent.skills : draft.skills,
    awards: typeof starterContent.awards === 'string' ? starterContent.awards : draft.awards,
    visibleSections: {
      ...draft.visibleSections,
      ...(starterContent.visibleSections ?? {}),
    },
  };
}

function normalizeDraft(input: unknown, id: string): ResumeDraft {
  const draft = (input ?? {}) as Partial<ResumeDraft>;
  const emptyDraft = createEmptyDraft(id);
  const profile = {
    ...emptyDraft.profile,
    ...(draft.profile ?? {}),
    facts: Array.isArray(draft.profile?.facts)
      ? draft.profile.facts.map(normalizeProfileFact)
      : emptyDraft.profile.facts,
  };
  const normalizedTitle = String(draft.title ?? '').trim();
  const normalizedLayoutPreset = normalizeLayoutPreset(draft.layoutPreset);
  const normalizedAccentTone = normalizeAccentTone(draft.accentTone);
  const normalizedFontFamily = normalizeFontFamily(draft.fontFamily);
  const normalizedTitleStyle = normalizeTitleStyle(draft.titleStyle);
  const normalizedBodyFontSize = normalizeNumber(draft.bodyFontSize, emptyDraft.bodyFontSize, 10.5, 17, 1);
  const normalizedLineHeight = normalizeNumber(draft.lineHeight, emptyDraft.lineHeight, 1.25, 1.95, 2);
  const normalizedPagePadding = normalizeNumber(draft.pagePadding, emptyDraft.pagePadding, 16, 40);
  const normalizedSectionSpacing = normalizeNumber(draft.sectionSpacing, emptyDraft.sectionSpacing, 10, 34);
  const shouldMigrateLegacyDefaultStyle =
    normalizedLayoutPreset === legacyRelaxedStyle.layoutPreset &&
    normalizedAccentTone === legacyRelaxedStyle.accentTone &&
    normalizedFontFamily === legacyRelaxedStyle.fontFamily &&
    normalizedTitleStyle === legacyRelaxedStyle.titleStyle &&
    normalizedBodyFontSize === legacyRelaxedStyle.bodyFontSize &&
    normalizedLineHeight === legacyRelaxedStyle.lineHeight &&
    normalizedPagePadding === legacyRelaxedStyle.pagePadding &&
    normalizedSectionSpacing === legacyRelaxedStyle.sectionSpacing;

  return {
    ...emptyDraft,
    ...draft,
    id,
    title:
      normalizedTitle && normalizedTitle !== '未命名简历'
        ? normalizedTitle
        : deriveDraftTitle(profile.fullName, emptyDraft.title),
    layoutPreset: normalizedLayoutPreset,
    accentTone: normalizedAccentTone,
    fontFamily: normalizedFontFamily,
    titleStyle: normalizedTitleStyle,
    bodyFontSize: shouldMigrateLegacyDefaultStyle ? emptyDraft.bodyFontSize : normalizedBodyFontSize,
    lineHeight: shouldMigrateLegacyDefaultStyle ? emptyDraft.lineHeight : normalizedLineHeight,
    pagePadding: shouldMigrateLegacyDefaultStyle ? emptyDraft.pagePadding : normalizedPagePadding,
    sectionSpacing: shouldMigrateLegacyDefaultStyle ? emptyDraft.sectionSpacing : normalizedSectionSpacing,
    profile,
    education: Array.isArray(draft.education)
      ? draft.education.map(normalizeEducationEntry)
      : emptyDraft.education,
    experience: Array.isArray(draft.experience)
      ? draft.experience.map(normalizeExperienceEntry)
      : emptyDraft.experience,
    projects: Array.isArray(draft.projects)
      ? draft.projects.map(normalizeProjectEntry)
      : emptyDraft.projects,
    visibleSections: {
      ...emptyDraft.visibleSections,
      ...(draft.visibleSections ?? {}),
    },
    sectionOrder: normalizeSectionOrder(draft.sectionOrder),
    customSections: Array.isArray(draft.customSections)
      ? draft.customSections.map(normalizeCustomSection)
      : [],
  };
}

export function hydrateDraft(input: unknown, id: string) {
  return normalizeDraft(input, id);
}

export function formatDraftTime(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
