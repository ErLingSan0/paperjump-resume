import type {
  ResumeAccentTone,
  CustomSection,
  EducationEntry,
  ExperienceEntry,
  ProfileFact,
  ProjectEntry,
  ResumeDraft,
  ResumeDraftSummary,
  ResumeFontFamily,
  ResumeLayoutPreset,
  ResumeTitleStyle,
} from '@/types/resume';
import { resumeSectionKeys } from '@/types/resume';

const STORAGE_PREFIX = 'paperjump-resume';
const DRAFT_INDEX_KEY = `${STORAGE_PREFIX}:draft-index`;
const layoutPresets: ResumeLayoutPreset[] = ['classic', 'compact'];
const accentTones: ResumeAccentTone[] = ['cobalt', 'sage', 'ink'];
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

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function draftKey(id: string) {
  return `${STORAGE_PREFIX}:draft:${id}`;
}

function createEntryId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDraftId() {
  return `draft-${Date.now().toString(36)}`;
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
    school: '北京邮电大学',
    major: '软件工程',
    degree: '本科',
    startDate: '2020.09',
    endDate: '2024.06',
    description: 'GPA 3.8 / 4.0，主修数据结构、操作系统、计算机网络。',
  };
}

function createExperienceEntry(): ExperienceEntry {
  return {
    id: createEntryId('exp'),
    company: '星桥科技',
    role: '前端开发实习生',
    startDate: '2023.07',
    endDate: '2023.12',
    description: '负责运营后台和活动页面开发，推动表单渲染效率优化，页面交付效率提升约 30%。',
    highlights: [
      '负责运营后台和活动页面开发，推动表单渲染效率优化，页面交付效率提升约 30%。',
    ],
  };
}

function createProjectEntry(): ProjectEntry {
  return {
    id: createEntryId('project'),
    name: '简历编辑器',
    role: '项目负责人',
    startDate: '2023.03',
    endDate: '2023.06',
    link: 'https://github.com/chenyiming/resume-editor',
    techStack: ['React', 'TypeScript', 'Umi 4', 'Ant Design'],
    description: '从 0 到 1 设计在线写简历产品原型，支持结构化表单录入、实时预览和草稿保存。',
    highlights: [
      '从 0 到 1 设计在线写简历产品原型，支持结构化表单录入、实时预览和草稿保存。',
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
  const highlights = normalizeHighlights(entry.highlights, entry.description);

  return {
    ...createEmptyExperienceEntry(),
    ...entry,
    id: entry.id || createEntryId('exp'),
    highlights,
    description: serializeHighlights(highlights, entry.description),
  };
}

function normalizeProjectEntry(item: unknown): ProjectEntry {
  const entry = (item ?? {}) as Partial<ProjectEntry>;
  const rawHighlights = normalizeHighlights(entry.highlights, entry.description);
  const extractedMeta = extractProjectMeta(rawHighlights);
  const highlights = extractedMeta.highlights;

  return {
    ...createEmptyProjectEntry(),
    ...entry,
    id: entry.id || createEntryId('project'),
    link: normalizeProjectLink(entry.link || extractedMeta.link),
    techStack: normalizeTechStack(entry.techStack, extractedMeta.techStack),
    highlights,
    description: serializeHighlights(highlights),
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

    const stackMatch = normalizedLine.match(/^(技术栈|Tech Stack|Tech|技术方案)\s*[:：-]\s*(.+)$/i);
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
    headline: '前端开发工程师 / 校招',
    phone: '13800000000',
    email: 'chenyiming@example.com',
    location: '上海',
    website: 'github.com/chenyiming',
    avatar: '',
    facts: [createProfileFact('求职状态', '2026 届应届生')],
  };

  return {
    id,
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
      '熟悉 React、TypeScript 与工程化流程，关注界面体验与可维护性，希望寻找一份能持续打磨产品质量的前端岗位。',
    education: [createEducationEntry()],
    experience: [createExperienceEntry()],
    projects: [createProjectEntry()],
    skills: 'React\nTypeScript\nAnt Design\nVite / Umi\nNode.js',
    awards: '校二等奖学金\n全国大学生软件设计大赛省奖',
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

export function loadDraft(id: string) {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(draftKey(id));
  if (!raw) {
    return null;
  }

  try {
    return normalizeDraft(JSON.parse(raw), id);
  } catch {
    return null;
  }
}

export function loadDraftIndex() {
  const storage = getStorage();
  if (!storage) {
    return [] as ResumeDraftSummary[];
  }

  const raw = storage.getItem(DRAFT_INDEX_KEY);
  if (!raw) {
    return [] as ResumeDraftSummary[];
  }

  try {
    return (JSON.parse(raw) as ResumeDraftSummary[]).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  } catch {
    return [] as ResumeDraftSummary[];
  }
}

export function saveDraft(draft: ResumeDraft) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(draftKey(draft.id), JSON.stringify(draft));

  const nextSummary: ResumeDraftSummary = {
    id: draft.id,
    title: draft.title,
    headline: draft.profile.headline,
    updatedAt: draft.updatedAt,
  };

  const nextIndex = loadDraftIndex().filter((item) => item.id !== draft.id);
  nextIndex.unshift(nextSummary);
  storage.setItem(DRAFT_INDEX_KEY, JSON.stringify(nextIndex));
}

export function removeDraft(id: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(draftKey(id));
  const nextIndex = loadDraftIndex().filter((item) => item.id !== id);
  storage.setItem(DRAFT_INDEX_KEY, JSON.stringify(nextIndex));
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
