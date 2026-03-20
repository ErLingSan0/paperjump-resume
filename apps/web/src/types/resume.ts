export const resumeSectionKeys = [
  'summary',
  'education',
  'experience',
  'projects',
  'skills',
  'awards',
] as const;

export type ResumeSectionKey = (typeof resumeSectionKeys)[number];

export type ResumeLayoutPreset = 'classic' | 'compact';

export type ResumeAccentTone = 'cobalt' | 'sage' | 'ink';

export type ResumeFontFamily = 'studio' | 'system' | 'serif';

export type ResumeTitleStyle = 'rule' | 'banner' | 'minimal';

export type ProfileFact = {
  id: string;
  label: string;
  value: string;
};

export type ResumeProfile = {
  fullName: string;
  headline: string;
  phone: string;
  email: string;
  location: string;
  website: string;
  avatar: string;
  facts: ProfileFact[];
};

export type ResumeSectionVisibility = Record<ResumeSectionKey, boolean>;

export type EducationEntry = {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ExperienceEntry = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
};

export type ProjectEntry = {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  link: string;
  techStack: string[];
  description: string;
  highlights: string[];
};

export type CustomSection = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  location: string;
  content: string;
  visible: boolean;
};

export type ResumeDraft = {
  id: string;
  templateId: number | null;
  status: string;
  visibility: string;
  title: string;
  updatedAt: string;
  layoutPreset: ResumeLayoutPreset;
  accentTone: ResumeAccentTone;
  fontFamily: ResumeFontFamily;
  titleStyle: ResumeTitleStyle;
  bodyFontSize: number;
  lineHeight: number;
  pagePadding: number;
  sectionSpacing: number;
  profile: ResumeProfile;
  summary: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string;
  awards: string;
  visibleSections: ResumeSectionVisibility;
  sectionOrder: ResumeSectionKey[];
  customSections: CustomSection[];
};

export type ResumeDraftSummary = {
  id: string;
  title: string;
  headline: string;
  templateId: number | null;
  templateName: string | null;
  status: string;
  visibility: string;
  updatedAt: string;
};
