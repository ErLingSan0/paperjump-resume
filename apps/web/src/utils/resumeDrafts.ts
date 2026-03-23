import type {
  ResumeAccentTone,
  CustomSection,
  EducationEntry,
  ExperienceEntry,
  ProfileFact,
  ProjectEntry,
  ResumeDraft,
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

const templateStarterContentPresets = {
  'campus-launch': {
    profile: {
      fullName: '陈一鸣',
      headline: '新媒体内容运营专家',
      phone: '+86 138-013-8000',
      email: 'xiaoqu@example.com',
      location: '上海',
      website: '',
      avatar: '/template-avatars/cow-office.jpg',
      facts: [],
    },
    summary:
      '资深新媒体内容运营专家，具备深厚的 AIGC 应用背景，擅长利用 AI 技术提升内容创作效率和质量。精通多平台矩阵分发策略，能独立完成短视频脚本策划与制作，兼具内容策划、数据分析及用户增长能力。',
    education: [
      createEducationEntryFromPreset({
        school: '华东师范大学',
        major: '新闻与传播',
        degree: '硕士',
        startDate: '2018-09',
        endDate: '2021-06',
        description:
          '主修新闻学、传播学、新媒体理论等核心课程，深入研究数字媒体内容生产与传播规律。\n参与多项校级科研项目，撰写并发表关于短视频内容生态的学术论文，获优秀毕业生称号。\n在校期间积极参与社团活动，担任校报编辑部副部长，负责校内新闻采编与新媒体平台运营。',
      }),
    ],
    experience: [
      createExperienceEntryFromPreset({
        company: '某知名科技公司',
        role: '新媒体内容运营专家',
        startDate: '2021-07',
        endDate: '2024-06',
        description:
          '主导构建并优化 AIGC 内容生产流程，通过引入提示词工程与智能文案工具，将内容创作效率提升 30%，同时确保内容质量与品牌调性一致。\n负责多平台矩阵分发策略制定与执行，覆盖微信、微博、抖音、小红书等平台，实现全网曝光量月均增长 25%，粉丝互动率提升 18%。\n独立策划并撰写短视频脚本，运用逻辑拆解与用户心理分析，成功孵化 3 个爆款系列视频，其中单条视频播放量突破 500 万。',
        highlights: [
          '主导构建并优化 AIGC 内容生产流程，通过引入提示词工程与智能文案工具，将内容创作效率提升 30%，同时确保内容质量与品牌调性一致。',
          '负责多平台矩阵分发策略制定与执行，覆盖微信、微博、抖音、小红书等平台，实现全网曝光量月均增长 25%，粉丝互动率提升 18%。',
          '独立策划并撰写短视频脚本，运用逻辑拆解与用户心理分析，成功孵化 3 个爆款系列视频，其中单条视频播放量突破 500 万。',
        ],
      }),
    ],
    projects: [
      createProjectEntryFromPreset({
        name: 'AIGC 赋能内容创作平台项目',
        role: '项目负责人',
        startDate: '2023-03',
        endDate: '2023-09',
        link: '',
        techStack: ['AIGC', '提示词工程', '内容策略'],
        description:
          '作为项目核心成员，负责引入和测试多种 AIGC 工具，如 GPT 系列、Midjourney 等，并结合业务需求进行定制化开发，实现提示词提效与文案自动生成。\n设计并完善了 AIGC 生成内容的审核与优化流程，确保内容合规性与高质量输出，将初稿产出时间缩短了 50%。\n构建了基于 AIGC 的内容标签与分类系统，显著提升了内容管理与检索效率，降低人工分类错误率 20%。',
        highlights: [
          '作为项目核心成员，负责引入和测试多种 AIGC 工具，并结合业务需求进行定制化开发，实现提示词提效与文案自动生成。',
          '设计并完善 AIGC 生成内容的审核与优化流程，确保内容合规性与高质量输出，将初稿产出时间缩短 50%。',
          '构建内容标签与分类系统，显著提升内容管理与检索效率，降低人工分类错误率 20%。',
        ],
      }),
    ],
    skills:
      '内容创作与 AIGC｜4｜提示词工程、AI 文案生成、短视频脚本创作、内容策划、关键词优化\n新媒体运营｜4｜多平台矩阵分发、用户增长、社群运营、活动策划、SEO 策略\n数据分析与选题规划｜3｜热点监测、效果复盘、选题策划、用户洞察、传播优化',
    awards: '',
    visibleSections: {
      summary: true,
      education: true,
      experience: true,
      projects: true,
      skills: true,
      awards: false,
    },
  },
  'steady-general': {
    profile: {
      fullName: '林晓雯',
      headline: '高级前端架构师',
      phone: '13800138000',
      email: 'xiaow@example.com',
      location: '北京',
      website: '',
      avatar: '/template-avatars/pony-office.jpg',
      facts: [],
    },
    summary:
      '资深前端架构师，拥有超过 8 年 Web 前端开发经验，精通 Vue 与 React 体系，长期聚焦大型复杂前端系统的架构设计与性能优化。擅长组件库、工程化和前端性能体系建设，能同时兼顾交付效率、系统稳定性与团队协作。',
    education: [
      createEducationEntryFromPreset({
        school: '北京邮电大学',
        major: '计算机科学与技术',
        degree: '硕士',
        startDate: '2013-09',
        endDate: '2016-07',
        description:
          '主修软件工程、数据结构、算法设计与分析、操作系统等核心课程。\n参与多项科研项目，深入研究分布式系统与网络通信技术，奠定扎实理论基础。',
      }),
      createEducationEntryFromPreset({
        school: '北京邮电大学',
        major: '软件工程',
        degree: '本科',
        startDate: '2009-09',
        endDate: '2013-07',
        description:
          '系统学习软件开发生命周期、面向对象编程与数据库原理等专业知识。\n连续四年获得校级奖学金，积极参与学生社团活动，提升团队协作与领导能力。',
      }),
    ],
    experience: [
      createExperienceEntryFromPreset({
        company: '某知名互联网公司',
        role: '高级前端架构师',
        startDate: '2021-08',
        endDate: '2024-05',
        description:
          '主导公司级前端架构演进，负责核心业务线的微前端架构设计与落地。\n从零开始建设并维护企业级中台组件库，沉淀超过 100 个高复用组件。\n构建完善的前端性能监控体系，持续优化首屏加载与交互体验。',
        highlights: [
          '主导公司级前端架构演进，负责核心业务线的微前端架构设计与落地，有效支撑多个独立子应用的集成与管理。',
          '从零开始建设并维护企业级中台组件库，沉淀超过 100 个高复用组件，覆盖 80% 以上业务场景。',
          '构建完善的前端性能监控体系，持续追踪核心业务指标并优化，显著提升首屏加载与交互体验。',
        ],
      }),
      createExperienceEntryFromPreset({
        company: '某大型电商平台',
        role: '前端架构师',
        startDate: '2018-03',
        endDate: '2021-07',
        description:
          '负责核心交易系统前端架构设计与重构，推动老旧系统升级为 Vue/React 混合架构。\n设计并实践组件化开发规范，推动前端团队采用统一组件库。\n参与构建和优化前端 CI/CD 流程，集成自动化测试与代码质量扫描。',
        highlights: [
          '负责核心交易系统前端架构设计与重构，将老旧系统升级为 Vue/React 混合架构，提升页面交互性能 35%。',
          '设计并实践组件化开发规范，推动前端团队采用统一组件库，缩短开发周期 20%。',
          '参与构建和优化前端 CI/CD 流程，集成自动化测试与代码质量扫描，确保项目交付质量。',
        ],
      }),
      createExperienceEntryFromPreset({
        company: '某金融科技公司',
        role: '高级前端开发工程师',
        startDate: '2016-07',
        endDate: '2018-02',
        description:
          '核心负责金融产品数据可视化平台的开发与维护，利用 ECharts/D3 构建复杂图表组件。\n独立完成多个项目的技术选型与前端框架搭建。\n优化前端接口设计与联调流程，确保前后端数据传输效率与准确性。',
        highlights: [
          '核心负责金融产品数据可视化平台的开发与维护，利用 ECharts/D3 构建复杂图表组件，满足 100+ 种业务报表需求。',
          '独立完成多个项目的技术选型与前端框架搭建，采用 Vue.js 进行快速迭代开发。',
          '优化前端接口设计与联调流程，确保前后端数据传输效率与准确性。',
        ],
      }),
    ],
    projects: [
      createProjectEntryFromPreset({
        name: '企业级组件库与低代码平台',
        role: '架构负责人',
        startDate: '2022-01',
        endDate: '2023-06',
        link: '',
        techStack: ['Vue', 'React', 'Monorepo'],
        description:
          '设计统一规范、组件 API 与构建体系，覆盖多个业务场景并支持设计系统沉淀。\n推动表单、表格、图表等基础能力标准化，降低重复开发成本。',
        highlights: [
          '设计统一规范、组件 API 与构建体系，覆盖多个业务场景并支持设计系统沉淀。',
          '推动表单、表格、图表等基础能力标准化，降低重复开发成本。',
        ],
      }),
    ],
    skills:
      '前端架构｜Vue / React / 微前端 / 组件库 / 性能治理 / 工程化体系\n工程能力｜系统设计、复杂页面拆分、性能优化与团队协作推进',
    awards: '',
    visibleSections: {
      summary: true,
      education: true,
      experience: true,
      projects: false,
      skills: true,
      awards: false,
    },
  },
  'data-focus': {
    profile: {
      fullName: '苏清越',
      headline: '自动驾驶测试工程师',
      phone: '+86 13800138000',
      email: 'qingyue@example.com',
      location: '北京',
      website: '',
      avatar: '/template-avatars/cow-office.jpg',
      facts: [],
    },
    summary: '',
    education: [
      createEducationEntryFromPreset({
        school: '清华大学',
        major: '计算机科学与技术',
        degree: '硕士',
        startDate: '2018-09',
        endDate: '2021-06',
        description:
          '主修课程：高级操作系统、机器学习、计算机视觉、自动驾驶系统原理等。\n硕士论文：基于深度学习的自动驾驶感知系统鲁棒性研究。\n获得“优秀毕业生”称号，并多次获得“学业优秀奖学金”。',
      }),
      createEducationEntryFromPreset({
        school: '北京航空航天大学',
        major: '软件工程',
        degree: '本科',
        startDate: '2014-09',
        endDate: '2018-06',
        description:
          '核心课程：数据结构与算法、C++ 程序设计、操作系统、数据库原理。\n参与“智能交通系统设计”项目，负责车载通信模块开发。',
      }),
    ],
    experience: [
      createExperienceEntryFromPreset({
        company: '某头部自动驾驶公司',
        role: '自动驾驶测试工程师',
        startDate: '2021-07',
        endDate: '2024-07',
        description:
          '主导 L3/L4 级别自动驾驶系统的模拟仿真测试，设计并执行超过 5000 种极端场景测试用例。\n负责实车路测数据采集与分析，规划并执行覆盖 10 万公里的测试路线。\n开发并维护自动化测试工具与平台，使用 Python/C++ 编写测试脚本。',
        highlights: [
          '主导 L3/L4 级别自动驾驶系统的模拟仿真测试，设计并执行超过 5000 种极端场景测试用例，有效识别并修复 120+ 个关键缺陷。',
          '负责实车路测数据采集与分析，规划并执行覆盖 10 万公里的测试路线，构建高质量测试数据集。',
          '开发并维护自动化测试工具与平台，使用 Python/C++ 编写测试脚本，实现测试用例的自动化生成与执行。',
        ],
      }),
    ],
    projects: [
      createProjectEntryFromPreset({
        name: '自动驾驶场景库构建与测试平台开发',
        role: '项目核心成员',
        startDate: '2022-03',
        endDate: '2023-01',
        link: '',
        techStack: ['Python', 'C++', '自动化测试'],
        description:
          '项目背景：为提升自动驾驶系统在复杂交通环境下的鲁棒性，需要构建覆盖多样化场景的测试库，并开发高效自动化测试平台。\n个人职责：负责场景设计、仿真平台集成与自动化测试脚本开发。\n关键行动：将常见问题类型抽象为标准场景模板，提升问题复现效率。',
        highlights: [
          '项目背景：为提升自动驾驶系统在复杂交通环境下的鲁棒性，构建覆盖多样化场景的测试库并开发自动化测试平台。',
          '个人职责：负责场景设计、仿真平台集成与自动化测试脚本开发。',
          '关键行动：将常见问题类型抽象为标准场景模板，提升问题复现效率与回归验证速度。',
        ],
      }),
    ],
    skills: '',
    awards: '',
    visibleSections: {
      summary: false,
      education: true,
      experience: true,
      projects: true,
      skills: false,
      awards: false,
    },
  },
  'executive-brief': {
    profile: {
      fullName: '宋野',
      headline: '私域流量运营专家',
      phone: '+86 13800138000',
      email: 'songye@example.com',
      location: '上海',
      website: '',
      avatar: '/template-avatars/pony-office.jpg',
      facts: [],
    },
    summary:
      '资深私域流量运营专家，精通内容运营、企业微信运营体系搭建与优化，擅长社群分层 SOP 制定及全生命周期转化策略。具备卓越的数据分析能力和用户洞察力，能将增长、活跃度提升与 GMV 转化同步推进。',
    education: [
      createEducationEntryFromPreset({
        school: '上海交通大学',
        major: '市场营销',
        degree: '硕士',
        startDate: '2015-09',
        endDate: '2018-06',
        description:
          '主修市场营销策略、消费者行为学、品牌管理、数字营销等课程。\n参与多项市场调研项目，深入分析市场趋势与用户需求。\n论文研究方向：《基于社交媒体的私域流量构建与转化研究》。',
      }),
    ],
    experience: [
      createExperienceEntryFromPreset({
        company: '某知名互联网公司',
        role: '私域流量运营专家',
        startDate: '2021-08',
        endDate: '2024-05',
        description:
          '主导搭建并优化公司直营私域流量运营体系，通过个性化内容推荐与互动机制，实现用户活跃度提升 18%，日均互动量增加 25%。\n负责规划与实施企业微信运营策略，从 0 到 1 建立用户触达路径与服务标准。\n设计并落地社群分层 SOP，根据用户生命周期与价值贡献进行精细化运营。',
        highlights: [
          '主导搭建并优化公司直营私域流量运营体系，通过个性化内容推荐与互动机制，实现用户活跃度提升 18%，日均互动量增加 25%。',
          '负责规划与实施企业微信运营策略，从 0 到 1 建立用户触达路径与服务标准，在 6 个月内将企业微信好友总量提升至 50 万+。',
          '设计并落地社群分层 SOP，根据用户生命周期与价值贡献进行精细化运营，有效提升高价值用户转化率 20%。',
        ],
      }),
      createExperienceEntryFromPreset({
        company: '某电商平台',
        role: '高级运营经理',
        startDate: '2018-07',
        endDate: '2021-07',
        description:
          '负责平台用户增长与活跃度提升，通过策划并执行多项营销活动，实现月活用户增长 20%。\n主导用户社群运营，建立用户激励体系和 UGC 内容生态。\n与产品团队紧密协作，提出并落地多项核心功能优化建议。',
        highlights: [
          '负责平台用户增长与活跃度提升，通过策划并执行多项营销活动，实现月活用户增长 20%，促成交易额提升 25%。',
          '主导用户社群运营，建立用户激励体系和 UGC 内容生态，将核心用户社群活跃度提升 35%，贡献 15% 的销售增量。',
          '与产品团队紧密协作，提出并落地多项核心功能优化建议，显著提升用户体验。',
        ],
      }),
    ],
    projects: [
      createProjectEntryFromPreset({
        name: '企业微信增长链路重构',
        role: '项目负责人',
        startDate: '2022-04',
        endDate: '2022-11',
        link: '',
        techStack: ['企业微信', 'SOP', '活动转化'],
        description:
          '搭建拉新、养熟、转化的分层用户路径，联动内容、活动与客服运营动作。\n沉淀标准化运营素材与 SOP，提升团队复制效率。',
        highlights: [
          '搭建拉新、养熟、转化的分层用户路径，联动内容、活动与客服运营动作。',
          '沉淀标准化运营素材与 SOP，提升团队复制效率。',
        ],
      }),
    ],
    skills: '',
    awards: '',
    visibleSections: {
      summary: true,
      education: true,
      experience: true,
      projects: false,
      skills: false,
      awards: false,
    },
  },
} as const;

export function applyTemplateStarterContent(draft: ResumeDraft, templateCode?: string | null): ResumeDraft {
  if (!templateCode) {
    return draft;
  }

  const preset = templateStarterContentPresets[templateCode as keyof typeof templateStarterContentPresets];
  if (!preset) {
    return draft;
  }

  return {
    ...draft,
    sectionOrder: draft.sectionOrder,
    profile: {
      ...draft.profile,
      ...(preset.profile ?? {}),
    },
    summary: preset.summary ?? draft.summary,
    education: preset.education ?? draft.education,
    experience: preset.experience ?? draft.experience,
    projects: preset.projects ?? draft.projects,
    skills: preset.skills ?? draft.skills,
    awards: preset.awards ?? draft.awards,
    visibleSections: {
      ...draft.visibleSections,
      ...(preset.visibleSections ?? {}),
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
