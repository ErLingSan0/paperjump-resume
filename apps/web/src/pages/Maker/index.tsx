import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  ReactNode,
} from 'react';
import { useEffect, useRef, useState } from 'react';

import {
  AppstoreOutlined,
  BgColorsOutlined,
  BookOutlined,
  ClockCircleOutlined,
  ColumnWidthOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  ExportOutlined,
  FilePdfOutlined,
  HolderOutlined,
  HomeOutlined,
  LaptopOutlined,
  PlusOutlined,
  PrinterOutlined,
  RedoOutlined,
  SaveOutlined,
  SolutionOutlined,
  StarFilled,
  StarOutlined,
  ToolOutlined,
  UndoOutlined,
  UpOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import {
  Button,
  Drawer,
  Input,
  Popconfirm,
  Slider,
  Switch,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';

import TemplatePaperPreview from '@/components/TemplatePaperPreview';
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
  ResumeSectionKey,
  ResumeTitleStyle,
} from '@/types/resume';
import {
  queryResume,
  updateResume,
} from '@/services/resumes';
import type { ResumeTemplate } from '@/services/templates';
import {
  queryTemplates,
  setTemplateFavorite,
} from '@/services/templates';
import {
  createEmptyDraft,
  formatDraftTime,
  hydrateDraft,
} from '@/utils/resumeDrafts';
import { getErrorMessage } from '@/utils/request';
import {
  applyTemplateSettingsToDraft,
  buildTemplatePickerPath,
  getTemplateLayoutVariant,
  getTemplateSectionClassName as getSharedTemplateSectionClassName,
  sidebarTemplateSectionKeys,
} from '@/utils/templateFlow';

const { TextArea } = Input;
const productName = '纸跃简历';

const builtInSections: Array<{
  key: ResumeSectionKey;
  label: string;
  icon: ReactNode;
}> = [
  { key: 'summary', label: '个人简介', icon: <SolutionOutlined /> },
  { key: 'education', label: '教育经历', icon: <BookOutlined /> },
  { key: 'experience', label: '工作经历', icon: <LaptopOutlined /> },
  { key: 'projects', label: '项目经历', icon: <StarOutlined /> },
  { key: 'skills', label: '技能清单', icon: <ToolOutlined /> },
  { key: 'awards', label: '奖项补充', icon: <ClockCircleOutlined /> },
];

const styleWorkspaceSections = [
  {
    id: 'section-layout-recipes',
    label: '模板方案',
    icon: <AppstoreOutlined />,
    tag: '模板',
  },
  {
    id: 'section-layout-type',
    label: '字体与标题',
    icon: <BgColorsOutlined />,
    tag: '样式',
  },
  {
    id: 'section-layout-spacing',
    label: '页面节奏',
    icon: <ColumnWidthOutlined />,
    tag: '微调',
  },
] as const;

const builtInSectionMeta = Object.fromEntries(
  builtInSections.map((section) => [section.key, section]),
) as Record<ResumeSectionKey, (typeof builtInSections)[number]>;

const layoutOptions: Array<{
  key: ResumeLayoutPreset;
  title: string;
  description: string;
}> = [
  {
    key: 'classic',
    title: '经典单栏',
    description: '稳妥清晰，适合大多数岗位。',
  },
  {
    key: 'compact',
    title: '紧凑模式',
    description: '压缩留白，适合内容偏多时收在一页。',
  },
];

const accentOptions: Array<{
  key: ResumeAccentTone;
  label: string;
  color: string;
}> = [
  { key: 'cobalt', label: '钴蓝', color: '#2151ff' },
  { key: 'sage', label: '松绿', color: '#7b9464' },
  { key: 'ink', label: '墨黑', color: '#101418' },
];

const fontOptions: Array<{
  key: ResumeFontFamily;
  label: string;
  description: string;
  preview: string;
}> = [
  {
    key: 'studio',
    label: '工作室无衬线',
    description: '现代、稳妥，适合大多数校招和社招岗位。',
    preview: 'Aa 字体节奏',
  },
  {
    key: 'system',
    label: '系统通勤体',
    description: '更接近日常文档工具，阅读阻力最低。',
    preview: '排版清爽',
  },
  {
    key: 'serif',
    label: '中文衬线',
    description: '更正式，适合研究、内容、设计类简历。',
    preview: '细节更文气',
  },
];

const titleStyleOptions: Array<{
  key: ResumeTitleStyle;
  label: string;
  caption: string;
}> = [
  {
    key: 'rule',
    label: '细分隔线',
    caption: '清楚',
  },
  {
    key: 'banner',
    label: '强调条',
    caption: '醒目',
  },
  {
    key: 'minimal',
    label: '极简文本',
    caption: '克制',
  },
];

const previewFontFamilyMap: Record<ResumeFontFamily, string> = {
  studio: "'Plus Jakarta Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  system: "'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif",
  serif: "'Songti SC', 'STSong', 'Noto Serif SC', serif",
};

type TemplateFilterKey = 'all' | 'campus' | 'general' | 'compact' | 'favorites';
type PreviewLayoutVariant = 'default' | 'student' | 'project' | 'sidebar' | 'executive';

type StyleRecipeSettings = Pick<
  ResumeDraft,
  | 'layoutPreset'
  | 'accentTone'
  | 'fontFamily'
  | 'titleStyle'
  | 'bodyFontSize'
  | 'lineHeight'
  | 'pagePadding'
  | 'sectionSpacing'
>;

type ExportState = 'idle' | 'pdf';
type WorkspaceMode = 'content' | 'style';
type ChecklistLevel = 'ready' | 'attention' | 'missing';
const templateFilterOptions: Array<{
  key: TemplateFilterKey;
  label: string;
  match: (recipe: ResumeTemplate, favorites: number[]) => boolean;
}> = [
  {
    key: 'all',
    label: '全部模板',
    match: () => true,
  },
  {
    key: 'campus',
    label: '校招 / 实习',
    match: (recipe) => recipe.category === 'campus',
  },
  {
    key: 'general',
    label: '通用投递',
    match: (recipe) => recipe.category === 'general',
  },
  {
    key: 'compact',
    label: '一页压缩',
    match: (recipe) => recipe.category === 'compact',
  },
  {
    key: 'favorites',
    label: '已收藏',
    match: (recipe, favorites) => favorites.includes(recipe.id),
  },
];

export default function MakerPage() {
  const params = useParams<{ resumeId: string }>();
  const routeResumeId = params.resumeId ?? 'new';
  const [draft, setDraft] = useState<ResumeDraft | null>(null);
  const [saveState, setSaveState] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');
  const lastSerializedRef = useRef('');
  const historyRef = useRef<{ undo: string[]; redo: string[] }>({ undo: [], redo: [] });
  const navigationLockTimerRef = useRef<number | null>(null);
  const navigationLockTargetRef = useRef<string | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const previewPaperRef = useRef<HTMLDivElement | null>(null);
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('content');
  const [activeSectionId, setActiveSectionId] = useState('section-profile');
  const [historyVersion, setHistoryVersion] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [templateFilter, setTemplateFilter] = useState<TemplateFilterKey>('all');
  const [confirmNewDraftOpen, setConfirmNewDraftOpen] = useState(false);
  const [draggingSectionKey, setDraggingSectionKey] = useState<ResumeSectionKey | null>(null);
  const [dragOverSectionKey, setDragOverSectionKey] = useState<ResumeSectionKey | null>(null);
  const [styleRecipeOptions, setStyleRecipeOptions] = useState<ResumeTemplate[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapTemplates() {
      try {
        const templates = await queryTemplates();
        if (!cancelled) {
          setStyleRecipeOptions(templates);
        }
      } catch (error) {
        if (!cancelled) {
          message.error(getErrorMessage(error, '模板列表加载失败，请稍后再试'));
        }
      }
    }

    void bootstrapTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapDraft() {
      setSaveState('loading');

      try {
        if (!routeResumeId || routeResumeId === 'new') {
          if (!cancelled) {
            history.replace(buildTemplatePickerPath({ from: 'maker', intent: 'create' }));
          }
          return;
        }

        const nextDraft = await queryResume(routeResumeId);
        if (cancelled) {
          return;
        }

        const serialized = JSON.stringify(nextDraft);
        lastSerializedRef.current = serialized;
        historyRef.current = { undo: [], redo: [] };
        setHistoryVersion(0);
        setWorkspaceMode('content');
        setActiveSectionId('section-profile');
        setDraft(nextDraft);
        setSaveState('saved');
      } catch (error) {
        if (cancelled) {
          return;
        }

        message.error(getErrorMessage(error, '简历加载失败，请稍后再试'));
        history.replace('/resumes');
      }
    }

    bootstrapDraft();

    return () => {
      cancelled = true;
    };
  }, [routeResumeId]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const serialized = JSON.stringify(draft);
    if (serialized === lastSerializedRef.current) {
      return;
    }

    setSaveState('saving');
    const timer = window.setTimeout(async () => {
      try {
        const savedDraft = await updateResume(draft.id, draft);
        setDraft((current) => {
          if (!current || current.id !== draft.id) {
            return current;
          }

          if (JSON.stringify(current) !== serialized) {
            return current;
          }

          lastSerializedRef.current = JSON.stringify(savedDraft);
          return savedDraft;
        });
        setSaveState('saved');
      } catch (error) {
        setSaveState('error');
        message.error(getErrorMessage(error, '自动保存失败，请稍后再试'));
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    const root = editorScrollRef.current;
    if (!root) {
      return;
    }

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('.paperjump-maker__section[id]'),
    ).filter((section) => !section.hidden);
    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              Math.abs(left.boundingClientRect.top - 156) -
              Math.abs(right.boundingClientRect.top - 156),
          );

        const nextId = (visibleEntries[0]?.target as HTMLElement | undefined)?.id;
        if (nextId) {
          const lockedTarget = navigationLockTargetRef.current;
          if (lockedTarget && nextId !== lockedTarget) {
            return;
          }
          setActiveSectionId((current) => (current === nextId ? current : nextId));
        }
      },
      {
        root,
        threshold: [0.18, 0.38, 0.6],
        rootMargin: '-8% 0px -58% 0px',
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [draft, collapsedSections, workspaceMode]);

  useEffect(() => {
    return () => {
      if (navigationLockTimerRef.current) {
        window.clearTimeout(navigationLockTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const isModifierPressed = event.metaKey || event.ctrlKey;
      if (!isModifierPressed) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? '';
      const isTypingContext =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        target?.isContentEditable ||
        Boolean(target?.closest('.ant-select-selection-search-input'));

      if (!isTypingContext) {
        return;
      }

      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (key === 'y') {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        handleUndo();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [draft]);

  if (!draft) {
    return null;
  }

  const previewPaperStyle = {
    '--resume-font-family': previewFontFamilyMap[draft.fontFamily],
    '--resume-body-size': `${draft.bodyFontSize}px`,
    '--resume-line-height': String(draft.lineHeight),
    '--resume-page-padding': `${draft.pagePadding}px`,
    '--resume-section-gap': `${draft.sectionSpacing}px`,
  } as CSSProperties;
  const activeStyleRecipe = findActiveStyleRecipe(draft, styleRecipeOptions);
  const currentTemplateRecipe =
    styleRecipeOptions.find((option) => option.id === draft.templateId) ?? activeStyleRecipe;
  const previewLayoutVariant = getTemplateLayoutVariant(currentTemplateRecipe?.code);
  const isPdfExporting = exportState === 'pdf';
  const orderedSections = draft.sectionOrder.map((key) => builtInSectionMeta[key]);
  const currentLayoutOption = layoutOptions.find((option) => option.key === draft.layoutPreset);
  const currentFontOption = fontOptions.find((option) => option.key === draft.fontFamily);
  const currentTitleOption = titleStyleOptions.find((option) => option.key === draft.titleStyle);
  const currentAccentOption = accentOptions.find((option) => option.key === draft.accentTone);
  const canUndo = historyRef.current.undo.length > 0;
  const canRedo = historyRef.current.redo.length > 0;
  const activeSectionLabel = getSectionDisplayLabel(activeSectionId, draft.customSections.length);
  const completion = getResumeCompletion(draft);
  const contentChecklist = buildContentChecklist(draft);
  const checklistSummary = summarizeChecklist(contentChecklist);
  const sidebarMetaLabel =
    workspaceMode === 'style'
      ? `${styleWorkspaceSections.length + 1} 组设置`
      : `${completion.completed}/${completion.total}`;
  const favoriteRecipeIds = styleRecipeOptions
    .filter((item) => item.favorited)
    .map((item) => item.id);
  const checklistById = Object.fromEntries(
    contentChecklist.map((item) => [item.id, item]),
  ) as Record<string, ContentChecklistItem>;
  const filteredStyleRecipes = styleRecipeOptions.filter((recipe) =>
    templateFilterOptions
      .find((option) => option.key === templateFilter)
      ?.match(recipe, favoriteRecipeIds),
  );
  const layoutSummaryItems = [
    activeStyleRecipe ? `方案：${activeStyleRecipe.name}` : '方案：已自定义',
    `密度：${currentLayoutOption?.title ?? '经典单栏'}`,
    `字体：${currentFontOption?.label ?? '工作室无衬线'}`,
    `标题：${currentTitleOption?.label ?? '细分隔线'}`,
    `强调：${currentAccentOption?.label ?? '钴蓝'}`,
    `正文 ${draft.bodyFontSize}px / 行距 ${draft.lineHeight.toFixed(2)}`,
  ];
  const headerMetaItems = [
    draft.profile.phone,
    draft.profile.email,
    draft.profile.location,
    draft.profile.website,
    ...draft.profile.facts
      .filter((item) => item.label.trim() && item.value.trim())
      .map((item) => `${item.label}：${item.value}`),
  ].filter(Boolean);
  const previewSections = orderedSections
    .map((section) => ({
      key: section.key,
      node: renderBuiltInPreviewSection(section.key),
    }))
    .filter(
      (item): item is { key: ResumeSectionKey; node: ReactNode } => item.node !== null,
    );
  const customPreviewSections = draft.customSections
    .filter(
      (item) =>
        item.visible &&
        (item.title.trim() || item.subtitle.trim() || item.time.trim() || item.content.trim()),
    )
    .map((item) => renderCustomPreviewSection(item));
  const sidebarPreviewSections =
    previewLayoutVariant === 'sidebar'
      ? previewSections.filter((item) => sidebarTemplateSectionKeys.has(item.key))
      : [];
  const mainPreviewSections =
    previewLayoutVariant === 'sidebar'
      ? previewSections.filter((item) => !sidebarTemplateSectionKeys.has(item.key))
      : previewSections;
  const useSidebarPreview = previewLayoutVariant === 'sidebar' && sidebarPreviewSections.length > 0;

  function updateDraft(updater: (current: ResumeDraft) => ResumeDraft) {
    let didChange = false;
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const currentSerialized = JSON.stringify(current);
      const candidate = updater(current);
      if (JSON.stringify(candidate) === currentSerialized) {
        return current;
      }

      historyRef.current.undo = [...historyRef.current.undo.slice(-79), currentSerialized];
      historyRef.current.redo = [];
      didChange = true;
      return finalizeDraft(candidate);
    });

    if (didChange) {
      setHistoryVersion((current) => current + 1);
    }
  }

  function restoreHistorySnapshot(snapshot: string) {
    const restoredDraft = finalizeDraft(JSON.parse(snapshot) as ResumeDraft);
    setDraft(restoredDraft);
  }

  function handleUndo() {
    if (!canUndo || !draft) {
      return;
    }

    const previousSnapshot = historyRef.current.undo.at(-1);
    if (!previousSnapshot) {
      return;
    }

    historyRef.current.undo = historyRef.current.undo.slice(0, -1);
    historyRef.current.redo = [...historyRef.current.redo.slice(-79), JSON.stringify(draft)];
    restoreHistorySnapshot(previousSnapshot);
    setHistoryVersion((current) => current + 1);
  }

  function handleRedo() {
    if (!canRedo || !draft) {
      return;
    }

    const nextSnapshot = historyRef.current.redo.at(-1);
    if (!nextSnapshot) {
      return;
    }

    historyRef.current.redo = historyRef.current.redo.slice(0, -1);
    historyRef.current.undo = [...historyRef.current.undo.slice(-79), JSON.stringify(draft)];
    restoreHistorySnapshot(nextSnapshot);
    setHistoryVersion((current) => current + 1);
  }

  function updateProfile<K extends keyof ResumeDraft['profile']>(
    field: K,
    value: ResumeDraft['profile'][K],
  ) {
    updateDraft((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [field]: value,
      },
    }));
  }

  function updateSection(key: ResumeSectionKey, checked: boolean) {
    updateDraft((current) => ({
      ...current,
      visibleSections: {
        ...current.visibleSections,
        [key]: checked,
      },
    }));
  }

  function updateLayoutPreset(layoutPreset: ResumeLayoutPreset) {
    updateDraft((current) => ({
      ...current,
      layoutPreset,
    }));
  }

  function updateAccentTone(accentTone: ResumeAccentTone) {
    updateDraft((current) => ({
      ...current,
      accentTone,
    }));
  }

  function updateFontFamily(fontFamily: ResumeFontFamily) {
    updateDraft((current) => ({
      ...current,
      fontFamily,
    }));
  }

  function updateTitleStyle(titleStyle: ResumeTitleStyle) {
    updateDraft((current) => ({
      ...current,
      titleStyle,
    }));
  }

  function updateBodyFontSize(bodyFontSize: number) {
    updateDraft((current) => ({
      ...current,
      bodyFontSize,
    }));
  }

  function updateLineHeight(lineHeight: number) {
    updateDraft((current) => ({
      ...current,
      lineHeight,
    }));
  }

  function updatePagePadding(pagePadding: number) {
    updateDraft((current) => ({
      ...current,
      pagePadding,
    }));
  }

  function updateSectionSpacing(sectionSpacing: number) {
    updateDraft((current) => ({
      ...current,
      sectionSpacing,
    }));
  }

  function applyStyleRecipe(recipe: ResumeTemplate) {
    updateDraft((current) => applyTemplateSettingsToDraft(current, recipe));
  }

  function toggleSectionCollapse(id: string) {
    setCollapsedSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function getSectionToggleProps(id: string) {
    return {
      collapsed: Boolean(collapsedSections[id]),
      onToggleCollapse: () => toggleSectionCollapse(id),
    };
  }

  function reorderBuiltInSection(sourceKey: ResumeSectionKey, targetKey: ResumeSectionKey) {
    if (sourceKey === targetKey) {
      return;
    }

    updateDraft((current) => ({
      ...current,
      sectionOrder: reorderValue(current.sectionOrder, sourceKey, targetKey),
    }));
  }

  function handleSectionDragStart(
    event: ReactDragEvent<HTMLButtonElement>,
    sectionKey: ResumeSectionKey,
  ) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', sectionKey);
    setDraggingSectionKey(sectionKey);
    setDragOverSectionKey(sectionKey);
  }

  function handleSectionDragOver(
    event: ReactDragEvent<HTMLDivElement>,
    sectionKey: ResumeSectionKey,
  ) {
    if (!draggingSectionKey || draggingSectionKey === sectionKey) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverSectionKey !== sectionKey) {
      setDragOverSectionKey(sectionKey);
    }
  }

  function handleSectionDrop(
    event: ReactDragEvent<HTMLDivElement>,
    sectionKey: ResumeSectionKey,
  ) {
    event.preventDefault();
    const sourceKey =
      draggingSectionKey || (event.dataTransfer.getData('text/plain') as ResumeSectionKey);

    setDragOverSectionKey(null);
    setDraggingSectionKey(null);

    if (!sourceKey || sourceKey === sectionKey) {
      return;
    }

    reorderBuiltInSection(sourceKey, sectionKey);
  }

  function handleSectionDragEnd() {
    setDraggingSectionKey(null);
    setDragOverSectionKey(null);
  }

  function addProfileFact() {
    updateDraft((current) => ({
      ...current,
      profile: {
        ...current.profile,
        facts: [
          ...current.profile.facts,
          {
            id: createLocalId('fact'),
            label: '',
            value: '',
          },
        ],
      },
    }));
  }

  function updateProfileFact(id: string, field: keyof ProfileFact, value: string) {
    updateDraft((current) => ({
      ...current,
      profile: {
        ...current.profile,
        facts: current.profile.facts.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      },
    }));
  }

  function removeProfileFact(id: string) {
    updateDraft((current) => ({
      ...current,
      profile: {
        ...current.profile,
        facts: current.profile.facts.filter((item) => item.id !== id),
      },
    }));
  }

  function addEducation() {
    updateDraft((current) => ({
      ...current,
      education: [
        ...current.education,
        {
          id: createLocalId('edu'),
          school: '',
          major: '',
          degree: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    }));
  }

  function addExperience() {
    updateDraft((current) => ({
      ...current,
      experience: [
        ...current.experience,
        {
          id: createLocalId('exp'),
          company: '',
          role: '',
          startDate: '',
          endDate: '',
          description: '',
          highlights: [],
        },
      ],
    }));
  }

  function addProject() {
    updateDraft((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          id: createLocalId('project'),
          name: '',
          role: '',
          startDate: '',
          endDate: '',
          link: '',
          techStack: [],
          description: '',
          highlights: [],
        },
      ],
    }));
  }

  function addCustomSection() {
    updateDraft((current) => ({
      ...current,
      customSections: [
        ...current.customSections,
        {
          id: createLocalId('custom'),
          title: '',
          subtitle: '',
          time: '',
          location: '',
          content: '',
          visible: true,
        },
      ],
    }));
  }

  function updateEducation(id: string, field: keyof EducationEntry, value: string) {
    updateDraft((current) => ({
      ...current,
      education: current.education.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function updateExperience<K extends keyof ExperienceEntry>(
    id: string,
    field: K,
    value: ExperienceEntry[K],
  ) {
    updateDraft((current) => ({
      ...current,
      experience: current.experience.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function updateProject<K extends keyof ProjectEntry>(
    id: string,
    field: K,
    value: ProjectEntry[K],
  ) {
    updateDraft((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function updateExperienceDescription(id: string, value: string) {
    const highlights = splitLines(value).map(normalizeBulletLine).filter(Boolean);
    updateDraft((current) => ({
      ...current,
      experience: current.experience.map((item) =>
        item.id === id
          ? {
              ...item,
              description: value,
              highlights,
            }
          : item,
      ),
    }));
  }

  function updateProjectDescription(id: string, value: string) {
    const highlights = splitLines(value).map(normalizeBulletLine).filter(Boolean);
    updateDraft((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === id
          ? {
              ...item,
              description: value,
              highlights,
            }
          : item,
      ),
    }));
  }

  function updateProjectKeywords(id: string, value: string) {
    updateDraft((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === id
          ? {
              ...item,
              techStack: normalizeTagValues([value]),
            }
          : item,
      ),
    }));
  }

  function updateCustomSection<K extends keyof CustomSection>(
    id: string,
    field: K,
    value: CustomSection[K],
  ) {
    updateDraft((current) => ({
      ...current,
      customSections: current.customSections.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function removeEducation(id: string) {
    updateDraft((current) => ({
      ...current,
      education: current.education.filter((item) => item.id !== id),
    }));
  }

  function removeExperience(id: string) {
    updateDraft((current) => ({
      ...current,
      experience: current.experience.filter((item) => item.id !== id),
    }));
  }

  function removeProject(id: string) {
    updateDraft((current) => ({
      ...current,
      projects: current.projects.filter((item) => item.id !== id),
    }));
  }

  function removeCustomSection(id: string) {
    updateDraft((current) => ({
      ...current,
      customSections: current.customSections.filter((item) => item.id !== id),
    }));
  }

  function moveEducation(id: string, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      education: moveItem(current.education, id, direction),
    }));
  }

  function moveExperience(id: string, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      experience: moveItem(current.experience, id, direction),
    }));
  }

  function moveProject(id: string, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      projects: moveItem(current.projects, id, direction),
    }));
  }

  function moveCustomSection(id: string, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      customSections: moveItem(current.customSections, id, direction),
    }));
  }

  function scrollToSection(id: string) {
    setWorkspaceMode(resolveWorkspaceMode(id));
    setActiveSectionId(id);
    if (navigationLockTimerRef.current) {
      window.clearTimeout(navigationLockTimerRef.current);
    }
    navigationLockTargetRef.current = id;
    navigationLockTimerRef.current = window.setTimeout(() => {
      navigationLockTargetRef.current = null;
      navigationLockTimerRef.current = null;
    }, 640);
    setCollapsedSections((current) =>
      current[id]
        ? {
            ...current,
            [id]: false,
          }
        : current,
    );

    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleWorkspaceModeChange(nextMode: WorkspaceMode) {
    if (nextMode === 'style') {
      scrollToSection('section-layout-recipes');
      return;
    }

    setWorkspaceMode('content');
    if (isStyleSectionId(activeSectionId)) {
      scrollToSection('section-profile');
    }
  }

  function handleSectionActivate(id: string) {
    if (navigationLockTimerRef.current) {
      window.clearTimeout(navigationLockTimerRef.current);
      navigationLockTimerRef.current = null;
    }
    navigationLockTargetRef.current = null;
    setActiveSectionId(id);
    setWorkspaceMode(resolveWorkspaceMode(id));
  }

  function getEditorSectionProps(id: string) {
    return {
      ...getSectionToggleProps(id),
      active: activeSectionId === id,
      onActivate: () => handleSectionActivate(id),
    };
  }

  function handlePrintExport() {
    setExportDrawerOpen(false);
    window.print();
  }

  async function handleExportPdf() {
    const previewPaper = previewPaperRef.current;

    if (!previewPaper) {
      message.error('暂时没有可导出的简历预览');
      return;
    }

    setExportState('pdf');
    message.open({
      key: 'resume-pdf-export',
      type: 'loading',
      content: '正在生成 PDF...',
      duration: 0,
    });

    try {
      await exportResumePdf(previewPaper, createDownloadFilename(draft.title, 'pdf'));
      message.open({
        key: 'resume-pdf-export',
        type: 'success',
        content: 'PDF 已开始下载',
      });
      setExportDrawerOpen(false);
    } catch (error) {
      console.error(error);
      message.open({
        key: 'resume-pdf-export',
        type: 'error',
        content: getReadableExportError(error),
        duration: 5,
      });
    } finally {
      setExportState('idle');
    }
  }

  function handleExportJson() {
    downloadTextFile({
      content: JSON.stringify(draft, null, 2),
      filename: `${createDownloadFilename(draft.title, 'json')}`,
      type: 'application/json;charset=utf-8',
    });
    message.success('已导出当前草稿 JSON 备份');
  }

  async function handleCopyPlainText() {
    try {
      await navigator.clipboard.writeText(buildResumePlainText(draft));
      message.success('已复制纯文本版简历');
      setExportDrawerOpen(false);
    } catch {
      message.error('复制失败，请稍后再试');
    }
  }

  async function handleImportJson(file: File) {
    try {
      const raw = await file.text();
      const importedDraft = finalizeDraft(hydrateDraft(JSON.parse(raw), draft.id));
      historyRef.current = { undo: [], redo: [] };
      setHistoryVersion((current) => current + 1);
      setWorkspaceMode('content');
      setActiveSectionId('section-profile');
      setDraft(importedDraft);
      setExportDrawerOpen(false);
      message.success('已导回 JSON 草稿');
    } catch {
      message.error('JSON 备份无法识别，请确认文件来自纸跃简历。');
    }

    return Upload.LIST_IGNORE;
  }

  async function toggleFavoriteRecipe(template: ResumeTemplate) {
    try {
      await setTemplateFavorite(template.id, !template.favorited);
      const templates = await queryTemplates();
      setStyleRecipeOptions(templates);
      message.success(template.favorited ? '已取消收藏模板' : '已收藏模板');
    } catch (error) {
      message.error(getErrorMessage(error, '模板收藏失败，请稍后再试'));
    }
  }

  function handleRequestNewDraft() {
    if (!hasDraftContent(draft) || isStarterDraft(draft)) {
      history.push(buildTemplatePickerPath({ from: 'maker', intent: 'create' }));
      return;
    }

    setConfirmNewDraftOpen(true);
  }

  function handleCreateNewDraft() {
    setConfirmNewDraftOpen(false);
    history.push(buildTemplatePickerPath({ from: 'maker', intent: 'create' }));
  }

  function renderStyleSections() {
    return (
      <>
        <EditorSection
          id="section-layout-recipes"
          title="模板方案"
          description="先选一个接近目标岗位的文档模板，再决定是否继续细调。"
          hidden={workspaceMode !== 'style'}
          extra={
            <div className="paperjump-maker__layout-toolbar">
              <Tag color={activeStyleRecipe ? 'processing' : 'default'}>
                {activeStyleRecipe ? activeStyleRecipe.name : '已自定义'}
              </Tag>
              <Tag>{favoriteRecipeIds.length} 个收藏</Tag>
            </div>
          }
          {...getEditorSectionProps('section-layout-recipes')}
        >
          <div className="paperjump-maker__layout-group paperjump-maker__layout-group--compact">
            <div className="paperjump-maker__layout-group-head">
              <div>
                <Typography.Title level={5}>文档模板</Typography.Title>
                <Typography.Text type="secondary">
                  模板决定第一印象，适合先定方向，再去写内容和微调。
                </Typography.Text>
              </div>
              <AppstoreOutlined />
            </div>

            <div className="paperjump-maker__template-filter-row">
              {templateFilterOptions.map((option) => {
                const count = styleRecipeOptions.filter((recipe) =>
                  option.match(recipe, favoriteRecipeIds),
                ).length;

                return (
                  <button
                    key={option.key}
                    type="button"
                    className={
                      templateFilter === option.key
                        ? 'paperjump-maker__template-filter paperjump-maker__template-filter--active'
                        : 'paperjump-maker__template-filter'
                    }
                    onClick={() => setTemplateFilter(option.key)}
                  >
                    <span>{option.label}</span>
                    <em>{count}</em>
                  </button>
                );
              })}
            </div>

            <div className="paperjump-maker__preset-grid">
              {filteredStyleRecipes.map((option) => {
                const isActiveRecipe = activeStyleRecipe?.id === option.id;

                return (
                  <div
                    key={option.id}
                    className={
                      isActiveRecipe
                        ? 'paperjump-maker__preset-card paperjump-maker__preset-card--active'
                        : 'paperjump-maker__preset-card'
                    }
                  >
                    <div className="paperjump-maker__preset-card-head">
                      <div className="paperjump-maker__preset-card-meta">
                        <span className="paperjump-maker__preset-spotlight">{option.spotlight}</span>
                        {isActiveRecipe ? (
                          <span className="paperjump-maker__preset-status">当前使用</span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className={
                          favoriteRecipeIds.includes(option.id)
                            ? 'paperjump-maker__preset-favorite paperjump-maker__preset-favorite--active'
                            : 'paperjump-maker__preset-favorite'
                        }
                        aria-label={favoriteRecipeIds.includes(option.id) ? '取消收藏模板' : '收藏模板'}
                        onClick={(event) => {
                          event.stopPropagation();
                          void toggleFavoriteRecipe(option);
                        }}
                      >
                        {favoriteRecipeIds.includes(option.id) ? <StarFilled /> : <StarOutlined />}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="paperjump-maker__preset-apply"
                      onClick={() => applyStyleRecipe(option)}
                    >
                      <TemplateRecipePreview recipe={option} />
                      <div className="paperjump-maker__preset-copy">
                        <strong>{option.name}</strong>
                        <span className="paperjump-maker__preset-description">{option.description}</span>
                        <em className="paperjump-maker__preset-note">{buildTemplateSummary(option)}</em>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {!filteredStyleRecipes.length ? (
              <div className="paperjump-maker__template-empty">
                <strong>当前筛选下还没有模板</strong>
                <span>先去收藏一套常用模板，或者切回“全部模板”继续挑选。</span>
              </div>
            ) : null}

            <div className="paperjump-maker__layout-summary">
              {layoutSummaryItems.map((item) => (
                <span key={item} className="paperjump-maker__layout-summary-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </EditorSection>

        <EditorSection
          id="section-layout-type"
          title="字体与标题"
          description="字体、标题样式和强调色决定整份简历的气质，比局部装饰更重要。"
          hidden={workspaceMode !== 'style'}
          {...getEditorSectionProps('section-layout-type')}
        >
          <div className="paperjump-maker__layout-compact">
            <div className="paperjump-maker__layout-inline">
              <div className="paperjump-maker__layout-inline-copy">
                <div className="paperjump-maker__layout-inline-head">
                  <SolutionOutlined />
                  <span>字体</span>
                </div>
                <p className="paperjump-maker__layout-inline-description">
                  先确定阅读感受，正文和联系方式都会跟着统一变化。
                </p>
              </div>
              <div className="paperjump-maker__compact-chip-row">
                {fontOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={
                      draft.fontFamily === option.key
                        ? 'paperjump-maker__compact-chip paperjump-maker__compact-chip--active'
                        : 'paperjump-maker__compact-chip'
                    }
                    onClick={() => updateFontFamily(option.key)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.preview}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="paperjump-maker__layout-inline">
              <div className="paperjump-maker__layout-inline-copy">
                <div className="paperjump-maker__layout-inline-head">
                  <ColumnWidthOutlined />
                  <span>标题样式</span>
                </div>
                <p className="paperjump-maker__layout-inline-description">
                  决定分区标题的存在感，建议和目标岗位气质保持一致。
                </p>
              </div>
              <div className="paperjump-maker__compact-chip-row">
                {titleStyleOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={
                      draft.titleStyle === option.key
                        ? 'paperjump-maker__compact-chip paperjump-maker__compact-chip--active'
                        : 'paperjump-maker__compact-chip'
                    }
                    onClick={() => updateTitleStyle(option.key)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.caption}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="paperjump-maker__layout-group paperjump-maker__layout-group--compact">
              <div className="paperjump-maker__layout-group-head">
                <div>
                  <Typography.Title level={5}>主颜色</Typography.Title>
                  <Typography.Text type="secondary">
                    强调色会覆盖标题和标签，建议控制在一份简历只用一个主色。
                  </Typography.Text>
                </div>
                <BgColorsOutlined />
              </div>
              <div className="paperjump-maker__accent-row">
                {accentOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={
                      draft.accentTone === option.key
                        ? 'paperjump-maker__accent-chip paperjump-maker__accent-chip--active'
                        : 'paperjump-maker__accent-chip'
                    }
                    onClick={() => updateAccentTone(option.key)}
                  >
                    <span
                      className="paperjump-maker__accent-swatch"
                      style={{ background: option.color }}
                    />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </EditorSection>

        <EditorSection
          id="section-layout-spacing"
          title="页面节奏"
          description="在这里调整密度、字号、行距和页边距，让纸面更像一份正式文档。"
          hidden={workspaceMode !== 'style'}
          {...getEditorSectionProps('section-layout-spacing')}
        >
          <div className="paperjump-maker__layout-compact">
            <div className="paperjump-maker__layout-inline">
              <div className="paperjump-maker__layout-inline-copy">
                <div className="paperjump-maker__layout-inline-head">
                  <AppstoreOutlined />
                  <span>密度</span>
                </div>
                <p className="paperjump-maker__layout-inline-description">
                  先决定整页是舒展还是紧凑，再去细调字号和留白。
                </p>
              </div>
              <div className="paperjump-maker__compact-chip-row">
                {layoutOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={
                      draft.layoutPreset === option.key
                        ? 'paperjump-maker__compact-chip paperjump-maker__compact-chip--active'
                        : 'paperjump-maker__compact-chip'
                    }
                    onClick={() => updateLayoutPreset(option.key)}
                  >
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="paperjump-maker__layout-group paperjump-maker__layout-group--compact">
              <div className="paperjump-maker__layout-group-head">
                <div>
                  <Typography.Title level={5}>页面节奏</Typography.Title>
                  <Typography.Text type="secondary">
                    用四个文档级旋钮控制信息密度，不再把微调藏在零碎选项里。
                  </Typography.Text>
                </div>
                <ColumnWidthOutlined />
              </div>

              <div className="paperjump-maker__range-grid">
                <RangeSetting
                  label="正文大小"
                  hint="控制段落阅读密度和纸面观感。"
                  min={10.5}
                  max={16}
                  step={0.5}
                  value={draft.bodyFontSize}
                  suffix="px"
                  onChange={updateBodyFontSize}
                />
                <RangeSetting
                  label="行距"
                  hint="让段落更透气，或者更适合压缩内容。"
                  min={1.25}
                  max={1.95}
                  step={0.05}
                  precision={2}
                  value={draft.lineHeight}
                  onChange={updateLineHeight}
                />
                <RangeSetting
                  label="页边距"
                  hint="决定纸张四周的留白感。"
                  min={16}
                  max={40}
                  step={1}
                  value={draft.pagePadding}
                  suffix="px"
                  onChange={updatePagePadding}
                />
                <RangeSetting
                  label="模块间距"
                  hint="控制各区块之间的呼吸感。"
                  min={10}
                  max={34}
                  step={1}
                  value={draft.sectionSpacing}
                  suffix="px"
                  onChange={updateSectionSpacing}
                />
              </div>
            </div>
          </div>
        </EditorSection>
      </>
    );
  }

  function renderContentBoard() {
    if (workspaceMode !== 'content') {
      return null;
    }

    const primaryTodo = contentChecklist.find((item) => item.level !== 'ready') ?? null;
    const boardTitle = checklistSummary.missing || checklistSummary.attention ? '下一步' : '内容已就绪';
    const boardSummary = primaryTodo
      ? `先补完${primaryTodo.title}，右侧纸面会更完整。`
      : '可以继续微调样式，或者直接导出成品。';

    return (
      <section
        className={[
          'paperjump-maker__content-board',
          'paperjump-maker__content-board--streamlined',
          primaryTodo ? '' : 'paperjump-maker__content-board--complete',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="paperjump-maker__content-board-head">
          <div className="paperjump-maker__content-board-copy-intro">
            <Typography.Title level={4}>{boardTitle}</Typography.Title>
            <Typography.Text type="secondary">
              {boardSummary}
            </Typography.Text>
          </div>
          <div className="paperjump-maker__content-board-meta">
            <span className="paperjump-maker__content-board-pill">
              已完成 {checklistSummary.ready}/{contentChecklist.length}
            </span>
            <span className="paperjump-maker__content-board-pill paperjump-maker__content-board-pill--muted">
              缺失 {checklistSummary.missing}
            </span>
          </div>
        </div>

        <div className="paperjump-maker__content-board-inline">
          {primaryTodo ? (
            <button
              type="button"
              className="paperjump-maker__content-board-inline-action"
              onClick={() => scrollToSection(primaryTodo.id)}
            >
              <div className="paperjump-maker__content-board-inline-copy">
                <span>优先补强</span>
                <strong>{primaryTodo.title}</strong>
              </div>
              <em>{primaryTodo.action}</em>
            </button>
          ) : (
            <button
              type="button"
              className="paperjump-maker__content-board-inline-action paperjump-maker__content-board-inline-action--complete"
              onClick={() => setExportDrawerOpen(true)}
            >
              <div className="paperjump-maker__content-board-inline-copy">
                <span>已就绪</span>
                <strong>打开导出</strong>
              </div>
              <em>内容已经完整，可以直接生成 PDF。</em>
            </button>
          )}
        </div>
      </section>
    );
  }

  function renderSidebarRows() {
    if (workspaceMode === 'style') {
      return (
        <>
          {styleWorkspaceSections.map((section) => (
            <SidebarSectionRow
              key={section.id}
              icon={section.icon}
              label={section.label}
              active={activeSectionId === section.id}
              right={<Tag color="processing">{section.tag}</Tag>}
              onClick={() => scrollToSection(section.id)}
            />
          ))}

          <SidebarSectionRow
            icon={<DownloadOutlined />}
            label="导出与恢复"
            right={<Tag color="default">文档</Tag>}
            onClick={() => setExportDrawerOpen(true)}
          />
        </>
      );
    }

    return (
      <>
        <SidebarSectionRow
          icon={<UserOutlined />}
          label="基本信息"
          active={activeSectionId === 'section-profile'}
          right={(
            <div className="paperjump-maker__section-side-meta paperjump-maker__section-side-meta--anchored">
              <SectionStatusDot level={checklistById['section-profile']?.level} />
              <Tag color="default">固定</Tag>
            </div>
          )}
          onClick={() => scrollToSection('section-profile')}
        />

        {orderedSections.map((section) => (
          <SidebarSectionRow
            key={section.key}
            icon={section.icon}
            label={section.label}
            className={[
              activeSectionId === `section-${section.key}`
                ? 'paperjump-maker__section-row--active'
                : '',
              draggingSectionKey === section.key ? 'paperjump-maker__section-row--dragging' : '',
              dragOverSectionKey === section.key && draggingSectionKey !== section.key
                ? 'paperjump-maker__section-row--drop-target'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => scrollToSection(`section-${section.key}`)}
            onDragOver={(event) => handleSectionDragOver(event, section.key)}
            onDrop={(event) => handleSectionDrop(event, section.key)}
            onDragEnd={handleSectionDragEnd}
            right={(
              <div className="paperjump-maker__section-controls">
                <SectionStatusDot level={checklistById[`section-${section.key}`]?.level} />
                <button
                  type="button"
                  className="paperjump-maker__section-drag"
                  draggable
                  aria-label={`拖动排序 ${section.label}`}
                  title={`拖动排序 ${section.label}`}
                  onClick={(event) => event.stopPropagation()}
                  onDragStart={(event) => handleSectionDragStart(event, section.key)}
                  onDragEnd={handleSectionDragEnd}
                >
                  <HolderOutlined />
                </button>
                <span className="paperjump-maker__section-switch">
                  <Switch
                    size="small"
                    checked={draft.visibleSections[section.key]}
                    onChange={(next) => updateSection(section.key, next)}
                  />
                </span>
              </div>
            )}
          />
        ))}

        <SidebarSectionRow
          icon={<PlusOutlined />}
          label={`自定义模块${draft.customSections.length ? ` (${draft.customSections.length})` : ''}`}
          active={activeSectionId === 'section-custom'}
          right={(
            <div className="paperjump-maker__section-side-meta paperjump-maker__section-side-meta--anchored">
              {draft.customSections.length ? (
                <SectionStatusDot level={checklistById['section-custom']?.level} />
              ) : null}
              <Tag color="processing">扩展</Tag>
            </div>
          )}
          onClick={() => scrollToSection('section-custom')}
        />
      </>
    );
  }

  function renderProfileSection() {
    return (
      <EditorSection
        id="section-profile"
        title="基本信息"
        description="把抬头区域做厚一点，头像、主标题、联系方式和补充字段都可以自由组合。"
        hidden={workspaceMode !== 'content'}
        {...getEditorSectionProps('section-profile')}
      >
        <div className="paperjump-maker__profile-grid">
          <div className="paperjump-maker__avatar-panel">
            <div className="paperjump-maker__avatar-preview">
              {draft.profile.avatar ? (
                <img src={draft.profile.avatar} alt={draft.profile.fullName || '头像'} />
              ) : (
                <span>{draft.profile.fullName?.slice(0, 1) || '纸'}</span>
              )}
            </div>
            <div className="paperjump-maker__avatar-actions">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={async (file) => {
                  const dataUrl = await readFileAsDataUrl(file as File);
                  updateProfile('avatar', dataUrl);
                  return Upload.LIST_IGNORE;
                }}
              >
                <Button icon={<UploadOutlined />} block>
                  上传头像
                </Button>
              </Upload>
              {draft.profile.avatar ? (
                <Button danger block onClick={() => updateProfile('avatar', '')}>
                  移除头像
                </Button>
              ) : null}
            </div>
          </div>

          <div className="paperjump-maker__profile-fields">
            <div className="paperjump-maker__field-grid">
              <Field label="姓名">
                <Input
                  placeholder="例如：陈一鸣"
                  value={draft.profile.fullName}
                  onChange={(event) => updateProfile('fullName', event.target.value)}
                />
              </Field>
              <Field label="求职标题">
                <Input
                  placeholder="例如：前端开发工程师 / 校招"
                  value={draft.profile.headline}
                  onChange={(event) => updateProfile('headline', event.target.value)}
                />
              </Field>
              <Field label="手机号">
                <Input
                  placeholder="例如：13800000000"
                  value={draft.profile.phone}
                  onChange={(event) => updateProfile('phone', event.target.value)}
                />
              </Field>
              <Field label="邮箱">
                <Input
                  placeholder="例如：hello@example.com"
                  value={draft.profile.email}
                  onChange={(event) => updateProfile('email', event.target.value)}
                />
              </Field>
              <Field label="城市">
                <Input
                  placeholder="例如：上海"
                  value={draft.profile.location}
                  onChange={(event) => updateProfile('location', event.target.value)}
                />
              </Field>
              <Field label="作品集 / 个人链接">
                <Input
                  placeholder="例如：https://github.com/xxx"
                  value={draft.profile.website}
                  onChange={(event) => updateProfile('website', event.target.value)}
                />
              </Field>
            </div>

            <div className="paperjump-maker__subsection">
              <div className="paperjump-maker__subsection-head">
                <div>
                  <Typography.Title level={5}>补充信息</Typography.Title>
                  <Typography.Text type="secondary">
                    像求职状态、GitHub、微信、年龄这些都可以按自己的方式加进来。
                  </Typography.Text>
                </div>
                <Button icon={<PlusOutlined />} onClick={addProfileFact}>
                  添加字段
                </Button>
              </div>

              {draft.profile.facts.length ? (
                <div className="paperjump-maker__stack">
                  {draft.profile.facts.map((item) => (
                    <div className="paperjump-maker__fact-row" key={item.id}>
                      <Input
                        placeholder="字段名，例如：求职状态"
                        value={item.label}
                        onChange={(event) => updateProfileFact(item.id, 'label', event.target.value)}
                      />
                      <Input
                        placeholder="字段值，例如：可在 2 周内到岗"
                        value={item.value}
                        onChange={(event) => updateProfileFact(item.id, 'value', event.target.value)}
                      />
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => removeProfileFact(item.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="paperjump-maker__subsection-empty">
                  没有额外字段时，基础联系方式就会保持简洁。
                </div>
              )}
            </div>
          </div>
        </div>
      </EditorSection>
    );
  }

  function renderBuiltInEditorSection(key: ResumeSectionKey) {
    if (key === 'summary') {
      return (
        <EditorSection
          key={key}
          id="section-summary"
          title="个人简介"
          description="推荐按段落写，不用刻意缩成一句话；右侧会按自然段展示。"
          hidden={workspaceMode !== 'content' || !draft.visibleSections.summary}
          {...getEditorSectionProps('section-summary')}
        >
          <Field label="简介内容">
            <GuidedTextarea
              rows={6}
              placeholder="你是谁、擅长什么、想找什么样的机会。可以用空行分段。"
              value={draft.summary}
              onChange={(value) => updateDraft((current) => ({ ...current, summary: value }))}
            />
          </Field>
        </EditorSection>
      );
    }

    if (key === 'education') {
      return (
        <EditorSection
          key={key}
          id="section-education"
          title="教育经历"
          description="不仅能写学校和专业，也能把成绩、课程、交换经历拆成多行。"
          hidden={workspaceMode !== 'content' || !draft.visibleSections.education}
          {...getEditorSectionProps('section-education')}
          extra={(
            <Button icon={<PlusOutlined />} onClick={addEducation}>
              添加教育经历
            </Button>
          )}
        >
          <div className="paperjump-maker__stack">
            {draft.education.map((item) => (
              <EntryCard
                key={item.id}
                title={item.school || '未填写学校'}
                onMoveUp={() => moveEducation(item.id, -1)}
                onMoveDown={() => moveEducation(item.id, 1)}
                disableMoveUp={draft.education[0]?.id === item.id}
                disableMoveDown={draft.education[draft.education.length - 1]?.id === item.id}
                onRemove={() => removeEducation(item.id)}
              >
                <div className="paperjump-maker__field-grid">
                  <Field label="学校">
                    <Input
                      value={item.school}
                      onChange={(event) => updateEducation(item.id, 'school', event.target.value)}
                    />
                  </Field>
                  <Field label="专业">
                    <Input
                      value={item.major}
                      onChange={(event) => updateEducation(item.id, 'major', event.target.value)}
                    />
                  </Field>
                  <Field label="学历">
                    <Input
                      value={item.degree}
                      onChange={(event) => updateEducation(item.id, 'degree', event.target.value)}
                    />
                  </Field>
                  <Field label="时间">
                    <Input
                      placeholder="例如：2020.09 - 2024.06"
                      value={joinDuration(item.startDate, item.endDate)}
                      onChange={(event) => {
                        const [startDate, endDate] = splitDurationInput(event.target.value);
                        updateEducation(item.id, 'startDate', startDate);
                        updateEducation(item.id, 'endDate', endDate);
                      }}
                    />
                  </Field>
                  <Field label="补充说明" fullWidth>
                    <GuidedTextarea
                      rows={4}
                      placeholder="每行都可以是一条信息，例如 GPA、排名、核心课程、交换项目。"
                      value={item.description}
                      onChange={(value) => updateEducation(item.id, 'description', value)}
                    />
                  </Field>
                </div>
              </EntryCard>
            ))}
          </div>
        </EditorSection>
      );
    }

    if (key === 'experience') {
      return (
        <EditorSection
          key={key}
          id="section-experience"
          title="工作经历"
          description="按自然表达直接写就行，建议一行一条经历要点，右侧会自动排成列表。"
          hidden={workspaceMode !== 'content' || !draft.visibleSections.experience}
          {...getEditorSectionProps('section-experience')}
          extra={(
            <Button icon={<PlusOutlined />} onClick={addExperience}>
              添加工作经历
            </Button>
          )}
        >
          <div className="paperjump-maker__stack">
            {draft.experience.map((item) => (
              <EntryCard
                key={item.id}
                title={item.company || '未填写公司'}
                onMoveUp={() => moveExperience(item.id, -1)}
                onMoveDown={() => moveExperience(item.id, 1)}
                disableMoveUp={draft.experience[0]?.id === item.id}
                disableMoveDown={draft.experience[draft.experience.length - 1]?.id === item.id}
                onRemove={() => removeExperience(item.id)}
              >
                <div className="paperjump-maker__field-grid">
                  <Field label="公司">
                    <Input
                      value={item.company}
                      onChange={(event) => updateExperience(item.id, 'company', event.target.value)}
                    />
                  </Field>
                  <Field label="岗位">
                    <Input
                      value={item.role}
                      onChange={(event) => updateExperience(item.id, 'role', event.target.value)}
                    />
                  </Field>
                  <Field label="时间">
                    <Input
                      placeholder="例如：2023.07 - 2023.12"
                      value={joinDuration(item.startDate, item.endDate)}
                      onChange={(event) => {
                        const [startDate, endDate] = splitDurationInput(event.target.value);
                        updateExperience(item.id, 'startDate', startDate);
                        updateExperience(item.id, 'endDate', endDate);
                      }}
                    />
                  </Field>
                  <Field label="经历描述" fullWidth>
                    <GuidedTextarea
                      rows={6}
                      placeholder="每行写一条内容，例如负责内容、推进过程、结果产出或服务对象。"
                      value={item.description}
                      onChange={(value) => updateExperienceDescription(item.id, value)}
                    />
                  </Field>
                </div>
              </EntryCard>
            ))}
          </div>
        </EditorSection>
      );
    }

    if (key === 'projects') {
      return (
        <EditorSection
          key={key}
          id="section-projects"
          title="项目经历"
          description="项目不只面向技术岗位。把链接和关键词作为补充，项目描述直接写清楚做了什么。"
          hidden={workspaceMode !== 'content' || !draft.visibleSections.projects}
          {...getEditorSectionProps('section-projects')}
          extra={(
            <Button icon={<PlusOutlined />} onClick={addProject}>
              添加项目
            </Button>
          )}
        >
          <div className="paperjump-maker__stack">
            {draft.projects.map((item) => (
              <EntryCard
                key={item.id}
                title={item.name || '未填写项目'}
                onMoveUp={() => moveProject(item.id, -1)}
                onMoveDown={() => moveProject(item.id, 1)}
                disableMoveUp={draft.projects[0]?.id === item.id}
                disableMoveDown={draft.projects[draft.projects.length - 1]?.id === item.id}
                onRemove={() => removeProject(item.id)}
              >
                <div className="paperjump-maker__field-grid">
                  <Field label="项目名称">
                    <Input
                      value={item.name}
                      onChange={(event) => updateProject(item.id, 'name', event.target.value)}
                    />
                  </Field>
                  <Field label="角色">
                    <Input
                      value={item.role}
                      onChange={(event) => updateProject(item.id, 'role', event.target.value)}
                    />
                  </Field>
                  <Field label="时间">
                    <Input
                      placeholder="例如：2023.03 - 2023.06"
                      value={joinDuration(item.startDate, item.endDate)}
                      onChange={(event) => {
                        const [startDate, endDate] = splitDurationInput(event.target.value);
                        updateProject(item.id, 'startDate', startDate);
                        updateProject(item.id, 'endDate', endDate);
                      }}
                    />
                  </Field>
                  <Field label="项目链接">
                    <Input
                      placeholder="可选，例如作品链接、案例地址、活动链接"
                      value={item.link}
                      onChange={(event) => updateProject(item.id, 'link', event.target.value)}
                    />
                  </Field>
                  <Field label="关键词 / 标签" fullWidth>
                    <GuidedTextarea
                      rows={3}
                      placeholder="可选。每行一项，或用逗号分隔，例如：用户研究、活动策划、Figma、SQL"
                      value={item.techStack.join('\n')}
                      onChange={(value) => updateProjectKeywords(item.id, value)}
                    />
                  </Field>
                  <Field label="项目描述" fullWidth>
                    <GuidedTextarea
                      rows={6}
                      placeholder="每行写一条内容，例如项目目标、你的职责、推进方式、结果或复盘。"
                      value={item.description}
                      onChange={(value) => updateProjectDescription(item.id, value)}
                    />
                  </Field>
                </div>
              </EntryCard>
            ))}
          </div>
        </EditorSection>
      );
    }

    if (key === 'skills') {
      return (
        <EditorSection
          key={key}
          id="section-skills"
          title="技能清单"
          description="如果是一行一个关键词会显示成标签；如果写成长句，就会按列表展示。"
          hidden={workspaceMode !== 'content' || !draft.visibleSections.skills}
          {...getEditorSectionProps('section-skills')}
        >
          <Field label="技能">
            <GuidedTextarea
              rows={6}
              placeholder="例如：\n用户研究\n数据分析\n跨团队协作\n或者：\n内容策划：能独立完成专题梳理和落地执行"
              value={draft.skills}
              onChange={(value) => updateDraft((current) => ({ ...current, skills: value }))}
            />
          </Field>
        </EditorSection>
      );
    }

    return (
      <EditorSection
        key={key}
        id="section-awards"
        title="奖项 / 补充信息"
        description="这里不必只写奖项，也可以放证书、语言、开源贡献或补充说明。"
        hidden={workspaceMode !== 'content' || !draft.visibleSections.awards}
        {...getEditorSectionProps('section-awards')}
      >
        <Field label="补充信息">
          <GuidedTextarea
            rows={5}
            placeholder="一行一条，例如：\n全国大学生软件设计大赛省奖\n英语六级 580"
            value={draft.awards}
            onChange={(value) => updateDraft((current) => ({ ...current, awards: value }))}
          />
        </Field>
      </EditorSection>
    );
  }

function renderCustomPreviewSection(item: CustomSection) {
  return (
    <ResumePreviewSection
      key={item.id}
      sectionId="section-custom"
      title={item.title || '自定义模块'}
      className={getPreviewSectionClassName('awards', currentTemplateRecipe?.code, previewLayoutVariant)}
      active={activeSectionId === 'section-custom'}
      onClick={() => scrollToSection('section-custom')}
    >
      <PreviewTimelineItem
        title={item.subtitle}
        subtitle={item.location}
        duration={item.time}
        description={item.content}
      />
    </ResumePreviewSection>
  );
}

  function renderBuiltInPreviewSection(key: ResumeSectionKey) {
    if (key === 'summary' && draft.visibleSections.summary && draft.summary.trim()) {
      return (
        <ResumePreviewSection
          key={key}
          sectionId="section-summary"
          title="个人简介"
          className={getPreviewSectionClassName(key, currentTemplateRecipe?.code, previewLayoutVariant)}
          active={activeSectionId === 'section-summary'}
          onClick={() => scrollToSection('section-summary')}
        >
          {renderParagraphContent(draft.summary)}
        </ResumePreviewSection>
      );
    }

    if (key === 'education' && draft.visibleSections.education && draft.education.length) {
      return (
        <ResumePreviewSection
          key={key}
          sectionId="section-education"
          title="教育经历"
          className={getPreviewSectionClassName(key, currentTemplateRecipe?.code, previewLayoutVariant)}
          active={activeSectionId === 'section-education'}
          onClick={() => scrollToSection('section-education')}
        >
          {draft.education.map((item) => (
            <PreviewTimelineItem
              key={item.id}
              title={item.school}
              subtitle={[item.major, item.degree].filter(Boolean).join(' ｜ ')}
              duration={joinDuration(item.startDate, item.endDate)}
              description={item.description}
            />
          ))}
        </ResumePreviewSection>
      );
    }

    if (key === 'experience' && draft.visibleSections.experience && draft.experience.length) {
      return (
        <ResumePreviewSection
          key={key}
          sectionId="section-experience"
          title="工作经历"
          className={getPreviewSectionClassName(key, currentTemplateRecipe?.code, previewLayoutVariant)}
          active={activeSectionId === 'section-experience'}
          onClick={() => scrollToSection('section-experience')}
        >
          {draft.experience.map((item) => (
            <PreviewTimelineItem
              key={item.id}
              title={item.company}
              subtitle={item.role}
              duration={joinDuration(item.startDate, item.endDate)}
              content={renderBulletLines(item.highlights.length ? item.highlights : splitLines(item.description))}
            />
          ))}
        </ResumePreviewSection>
      );
    }

    if (key === 'projects' && draft.visibleSections.projects && draft.projects.length) {
      return (
        <ResumePreviewSection
          key={key}
          sectionId="section-projects"
          title="项目经历"
          className={getPreviewSectionClassName(key, currentTemplateRecipe?.code, previewLayoutVariant)}
          active={activeSectionId === 'section-projects'}
          onClick={() => scrollToSection('section-projects')}
        >
          {draft.projects.map((item) => (
            <PreviewTimelineItem
              key={item.id}
              title={item.name}
              subtitle={item.role}
              duration={joinDuration(item.startDate, item.endDate)}
              meta={renderProjectMeta(item)}
              content={renderBulletLines(item.highlights.length ? item.highlights : splitLines(item.description))}
            />
          ))}
        </ResumePreviewSection>
      );
    }

    if (key === 'skills' && draft.visibleSections.skills && draft.skills.trim()) {
      return (
        <ResumePreviewSection
          key={key}
          sectionId="section-skills"
          title="技能清单"
          className={getPreviewSectionClassName(key, currentTemplateRecipe?.code, previewLayoutVariant)}
          active={activeSectionId === 'section-skills'}
          onClick={() => scrollToSection('section-skills')}
        >
          {renderSkillsPreview(draft.skills)}
        </ResumePreviewSection>
      );
    }

    if (key === 'awards' && draft.visibleSections.awards && draft.awards.trim()) {
      return (
        <ResumePreviewSection
          key={key}
          sectionId="section-awards"
          title="奖项 / 补充信息"
          className={getPreviewSectionClassName(key, currentTemplateRecipe?.code, previewLayoutVariant)}
          active={activeSectionId === 'section-awards'}
          onClick={() => scrollToSection('section-awards')}
        >
          {renderBulletContent(draft.awards)}
        </ResumePreviewSection>
      );
    }

    return null;
  }

  return (
    <div className="paperjump-maker">
      <header className="paperjump-maker__header">
        <div className="paperjump-maker__shell paperjump-maker__header-inner">
          <div className="paperjump-maker__brand">
            <div className="paperjump-maker__brand-mark">纸</div>
            <div>
              <strong>{productName}</strong>
              <span>边写边排的专业简历编辑器</span>
            </div>
          </div>
          <div className="paperjump-maker__header-actions">
            <Button
              className="paperjump-maker__header-btn paperjump-maker__header-btn--quiet"
              icon={<AppstoreOutlined />}
              onClick={() => history.push('/resumes')}
            >
              返回简历库
            </Button>
            <Button
              className="paperjump-maker__header-btn paperjump-maker__header-btn--quiet"
              icon={<HomeOutlined />}
              onClick={() => history.push('/')}
            >
              返回首页
            </Button>
            <Button
              className="paperjump-maker__header-btn paperjump-maker__header-btn--secondary"
              icon={<ColumnWidthOutlined />}
              onClick={() =>
                history.push(
                  buildTemplatePickerPath({ from: 'maker', intent: 'switch', resumeId: draft.id }),
                )
              }
            >
              更换模板
            </Button>
            <Popconfirm
              open={confirmNewDraftOpen}
              title="开始一份新的简历？"
              description="当前这份会保留在简历库里，下一步会先去模板中心选择版式。"
              okText="去选模板"
              cancelText="取消"
              onConfirm={handleCreateNewDraft}
              onCancel={() => setConfirmNewDraftOpen(false)}
            >
              <Button
                className="paperjump-maker__header-btn paperjump-maker__header-btn--primary"
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleRequestNewDraft}
              >
                新建简历
              </Button>
            </Popconfirm>
          </div>
        </div>
      </header>

      <div className="paperjump-maker__body paperjump-maker__shell">
        <aside className="paperjump-maker__sidebar">
          <div className="paperjump-maker__sidebar-scroll">
            <div className="paperjump-maker__sidebar-head">
              <div className="paperjump-maker__sidebar-head-copy">
                <Typography.Title level={4}>
                  {workspaceMode === 'style' ? '样式设置' : '写作大纲'}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {workspaceMode === 'style' ? '模板、字体和页面节奏' : '按模块顺序编辑当前简历'}
                </Typography.Text>
              </div>
              <div className="paperjump-maker__sidebar-head-meta">
                <span className="paperjump-maker__sidebar-head-note">{sidebarMetaLabel}</span>
              </div>
            </div>

            <div className="paperjump-maker__section-nav">{renderSidebarRows()}</div>

            <div className="paperjump-maker__autosave">
              <span className="paperjump-maker__autosave-dot" />
              <SaveOutlined />
              <span>
                {saveState === 'saving'
                  ? '自动保存中'
                  : saveState === 'error'
                    ? '自动保存失败'
                    : `已保存 ${formatDraftTime(draft.updatedAt)}`}
              </span>
            </div>
          </div>
        </aside>

        <div className="paperjump-maker__editor">
          <section className="paperjump-maker__editor-head">
            <div className="paperjump-maker__editor-toolbar">
              <div className="paperjump-maker__editor-toolbar-group">
                <button
                  type="button"
                  className={[
                    'paperjump-maker__workspace-chip',
                    workspaceMode === 'content' ? 'paperjump-maker__workspace-chip--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleWorkspaceModeChange('content')}
                >
                  <SolutionOutlined />
                  <span>内容</span>
                </button>
                <button
                  type="button"
                  className={[
                    'paperjump-maker__workspace-chip',
                    workspaceMode === 'style' ? 'paperjump-maker__workspace-chip--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleWorkspaceModeChange('style')}
                >
                  <BgColorsOutlined />
                  <span>样式</span>
                </button>
              </div>
              <div className="paperjump-maker__editor-toolbar-meta">
                <span className="paperjump-maker__editor-progress">
                  {completion.completed}/{completion.total} 已完成
                </span>
                <Button
                  className="paperjump-maker__editor-toolbar-btn paperjump-maker__editor-toolbar-btn--primary"
                  icon={<ExportOutlined />}
                  onClick={() => setExportDrawerOpen(true)}
                >
                  导出
                </Button>
                <Button
                  className="paperjump-maker__editor-toolbar-btn"
                  icon={<UndoOutlined />}
                  disabled={!canUndo}
                  title="Cmd/Ctrl + Z"
                  onClick={handleUndo}
                >
                  撤销
                </Button>
                <Button
                  className="paperjump-maker__editor-toolbar-btn"
                  icon={<RedoOutlined />}
                  disabled={!canRedo}
                  title="Shift + Cmd/Ctrl + Z"
                  onClick={handleRedo}
                >
                  重做
                </Button>
              </div>
            </div>
          </section>
          <div className="paperjump-maker__editor-scroll" ref={editorScrollRef}>
            <div className="paperjump-maker__form-sections">
              {renderStyleSections()}
              {renderContentBoard()}
              {renderProfileSection()}
              {orderedSections.map((section) => renderBuiltInEditorSection(section.key))}

              <EditorSection
                id="section-custom"
                title="自定义模块"
                description="研究经历、校园经历、个人作品、志愿服务，或者任何默认模块之外的内容，都可以放在这里。"
                hidden={workspaceMode !== 'content'}
                {...getEditorSectionProps('section-custom')}
                extra={(
                  <Button icon={<PlusOutlined />} onClick={addCustomSection}>
                    添加自定义模块
                  </Button>
                )}
              >
                {draft.customSections.length ? (
                  <div className="paperjump-maker__stack">
                    {draft.customSections.map((item) => (
                      <EntryCard
                        key={item.id}
                        title={item.title || '未命名自定义模块'}
                        status={(
                          <Tag color={item.visible ? 'blue' : 'default'}>
                            {item.visible ? '显示中' : '已隐藏'}
                          </Tag>
                        )}
                        onMoveUp={() => moveCustomSection(item.id, -1)}
                        onMoveDown={() => moveCustomSection(item.id, 1)}
                        disableMoveUp={draft.customSections[0]?.id === item.id}
                        disableMoveDown={
                          draft.customSections[draft.customSections.length - 1]?.id === item.id
                        }
                        extraActions={(
                          <Button type="text" onClick={() => updateCustomSection(item.id, 'visible', !item.visible)}>
                            {item.visible ? '隐藏' : '显示'}
                          </Button>
                        )}
                        onRemove={() => removeCustomSection(item.id)}
                      >
                        <div className="paperjump-maker__field-grid">
                          <Field label="模块标题">
                            <Input
                              placeholder="例如：校园经历"
                              value={item.title}
                              onChange={(event) =>
                                updateCustomSection(item.id, 'title', event.target.value)
                              }
                            />
                          </Field>
                          <Field label="副标题 / 角色">
                            <Input
                              placeholder="例如：校学生会 / 技术负责人"
                              value={item.subtitle}
                              onChange={(event) =>
                                updateCustomSection(item.id, 'subtitle', event.target.value)
                              }
                            />
                          </Field>
                          <Field label="时间">
                            <Input
                              placeholder="例如：2022.09 - 2024.06"
                              value={item.time}
                              onChange={(event) =>
                                updateCustomSection(item.id, 'time', event.target.value)
                              }
                            />
                          </Field>
                          <Field label="地点">
                            <Input
                              placeholder="例如：上海"
                              value={item.location}
                              onChange={(event) =>
                                updateCustomSection(item.id, 'location', event.target.value)
                              }
                            />
                          </Field>
                          <Field label="内容" fullWidth>
                            <GuidedTextarea
                              rows={5}
                              placeholder="推荐一行一条，方便右侧自动排成列表。"
                              value={item.content}
                              onChange={(value) =>
                                updateCustomSection(item.id, 'content', value)
                              }
                            />
                          </Field>
                        </div>
                      </EntryCard>
                    ))}
                  </div>
                ) : (
                  <div className="paperjump-maker__subsection-empty">
                    先把默认模块写好也可以；需要扩展时，再加自定义模块就行。
                  </div>
                )}
              </EditorSection>
            </div>
          </div>
        </div>

        <aside className="paperjump-maker__preview">
          <div className="paperjump-maker__preview-inner">
            <div className="paperjump-maker__preview-head">
              <div className="paperjump-maker__preview-copy">
                <Typography.Title level={5}>纸面预览</Typography.Title>
                <Typography.Text type="secondary">
                  A4 文档视图
                </Typography.Text>
              </div>
              <div className="paperjump-maker__preview-meta">
                <span className="paperjump-maker__preview-focus">
                  {workspaceMode === 'style' ? '样式预览' : activeSectionLabel}
                </span>
              </div>
            </div>

            <div
              ref={previewPaperRef}
              className={[
                'paperjump-maker__preview-paper',
                `paperjump-maker__preview-paper--${draft.layoutPreset}`,
                `paperjump-maker__preview-paper--accent-${draft.accentTone}`,
                `paperjump-maker__preview-paper--title-${draft.titleStyle}`,
                `paperjump-maker__preview-paper--variant-${previewLayoutVariant}`,
                currentTemplateRecipe?.code
                  ? `paperjump-maker__preview-paper--template-${currentTemplateRecipe.code}`
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={previewPaperStyle}
            >
              <div>
                <div
                  className={[
                    'paperjump-maker__resume-header',
                    `paperjump-maker__resume-header--${previewLayoutVariant}`,
                  ].join(' ')}
                  data-resume-section="section-profile"
                  onClick={() => scrollToSection('section-profile')}
                >
                  <div className="paperjump-maker__resume-header-main">
                    <div className="paperjump-maker__resume-header-copy">
                      <Typography.Title level={2}>
                        {draft.profile.fullName || '你的名字'}
                      </Typography.Title>
                      <Typography.Text className="paperjump-maker__resume-headline">
                        {draft.profile.headline}
                      </Typography.Text>
                    </div>
                    {draft.profile.avatar ? (
                      <div className="paperjump-maker__resume-avatar">
                        <img src={draft.profile.avatar} alt={draft.profile.fullName || '头像'} />
                      </div>
                    ) : null}
                  </div>

                  <div className="paperjump-maker__resume-meta">
                    {headerMetaItems.map((item) => (
                      <span key={item} className="paperjump-maker__resume-meta-item">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {useSidebarPreview ? (
                  <div className="paperjump-maker__resume-layout paperjump-maker__resume-layout--sidebar">
                    <aside className="paperjump-maker__resume-sidebar">
                      {sidebarPreviewSections.map((item) => item.node)}
                    </aside>
                    <div className="paperjump-maker__resume-main">
                      {mainPreviewSections.map((item) => item.node)}
                      {customPreviewSections}
                    </div>
                  </div>
                ) : (
                  <div
                    className={[
                      'paperjump-maker__resume-layout',
                      `paperjump-maker__resume-layout--${previewLayoutVariant}`,
                    ].join(' ')}
                  >
                    {mainPreviewSections.map((item) => item.node)}
                    {customPreviewSections}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Drawer
        title="文档操作"
        placement="right"
        width={360}
        open={exportDrawerOpen}
        onClose={() => setExportDrawerOpen(false)}
      >
        <div className="paperjump-maker__export-panel">
          <Typography.Paragraph>
            这里收纳导出、备份和恢复，先确认右侧纸面就是你想要的版本再操作。
          </Typography.Paragraph>

          <div className="paperjump-maker__export-section">
            <div className="paperjump-maker__export-section-head">
              <strong>导出成品</strong>
              <span>用于投递、打印和快速粘贴。</span>
            </div>
            <div className="paperjump-maker__export-stack">
              <ExportActionCard
                icon={<FilePdfOutlined />}
                title="下载 PDF 成品"
                description="直接按当前纸面预览生成正式 PDF，内容偏长时会自动分页。"
                onClick={handleExportPdf}
                disabled={isPdfExporting}
                statusText={isPdfExporting ? '生成中...' : '推荐'}
              />
              <ExportActionCard
                icon={<CopyOutlined />}
                title="复制纯文本"
                description="把当前内容整理成纯文本版，方便投递平台或即时粘贴。"
                onClick={handleCopyPlainText}
                disabled={isPdfExporting}
              />
            </div>
          </div>

          <div className="paperjump-maker__export-section">
            <div className="paperjump-maker__export-section-head">
              <strong>备份与恢复</strong>
              <span>跨设备继续写，或者保留一个安全副本。</span>
            </div>
            <div className="paperjump-maker__export-stack">
              <ExportActionCard
                icon={<DownloadOutlined />}
                title="下载 JSON 备份"
                description="把当前草稿完整备份下来，之后可以重新导回或迁移。"
                onClick={handleExportJson}
                disabled={isPdfExporting}
              />
              <Upload
                accept=".json,application/json"
                showUploadList={false}
                beforeUpload={(file) => handleImportJson(file as File)}
              >
                <div>
                  <ExportActionCard
                    icon={<UploadOutlined />}
                    title="导回 JSON 草稿"
                    description="把之前下载的 JSON 备份重新恢复到当前草稿，适合换设备继续写。"
                    onClick={() => undefined}
                    disabled={isPdfExporting}
                  />
                </div>
              </Upload>
            </div>
          </div>

          <div className="paperjump-maker__export-footnote">
            <div className="paperjump-maker__export-footnote-meta">
              <Typography.Text type="secondary">
                最近保存 {formatDraftTime(draft.updatedAt)}
              </Typography.Text>
            </div>
            <Button
              type="text"
              size="small"
              icon={<PrinterOutlined />}
              onClick={handlePrintExport}
              disabled={isPdfExporting}
            >
              仍可使用浏览器打印
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function Field(props: { label: string; children: ReactNode; fullWidth?: boolean }) {
  const { label, children, fullWidth } = props;

  return (
    <label className={fullWidth ? 'paperjump-maker__field paperjump-maker__field--full' : 'paperjump-maker__field'}>
      <span className="paperjump-maker__field-label">{label}</span>
      {children}
    </label>
  );
}

function GuidedTextarea(props: {
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder?: string;
}) {
  const { value, onChange, rows, placeholder } = props;

  return (
    <div className="paperjump-maker__guided-textarea">
      <TextArea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function RangeSetting(props: {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  precision?: number;
}) {
  const {
    label,
    hint,
    min,
    max,
    step,
    value,
    onChange,
    suffix,
    precision = 0,
  } = props;

  return (
    <div className="paperjump-maker__range-card">
      <div className="paperjump-maker__range-head">
        <div>
          <strong>{label}</strong>
          <span className="paperjump-maker__range-description">{hint}</span>
        </div>
        <span className="paperjump-maker__range-value">
          {value.toFixed(precision)}
          {suffix}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(nextValue) => onChange(Number(Array.isArray(nextValue) ? nextValue[0] : nextValue))}
      />
    </div>
  );
}

function TemplateRecipePreview(props: { recipe: ResumeTemplate }) {
  const { recipe } = props;
  const accentColor =
    accentOptions.find((item) => item.key === recipe.settings.accentTone)?.color ?? '#2151ff';

  return (
    <div
      className={[
        'paperjump-maker__template-preview',
        `paperjump-maker__template-preview--${recipe.settings.layoutPreset}`,
      ].join(' ')}
      style={
        {
          '--template-accent': accentColor,
        } as CSSProperties
      }
    >
      <TemplatePaperPreview template={recipe} mode="picker" />
      <span className="paperjump-maker__template-preview-accent" />
    </div>
  );
}

function EditorSection(props: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  extra?: ReactNode;
  hidden?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  active?: boolean;
  onActivate?: () => void;
}) {
  const {
    id,
    title,
    description,
    children,
    extra,
    hidden,
    collapsed,
    onToggleCollapse,
    active,
    onActivate,
  } = props;

  if (hidden) {
    return null;
  }

  return (
    <section
      className={[
        'paperjump-maker__section',
        active ? 'paperjump-maker__section--active' : '',
        collapsed ? 'paperjump-maker__section--collapsed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      id={id}
      onFocusCapture={onActivate}
      onMouseDownCapture={onActivate}
    >
      <div className="paperjump-maker__section-head">
        <div className="paperjump-maker__section-head-top">
          <div className="paperjump-maker__section-head-copy">
            <Typography.Title level={3}>{title}</Typography.Title>
          </div>
          <div className="paperjump-maker__section-head-actions">
            {!collapsed && extra ? <div className="paperjump-maker__section-extra">{extra}</div> : null}
            {onToggleCollapse ? (
              <Button className="paperjump-maker__section-toggle" size="small" onClick={onToggleCollapse}>
                {collapsed ? '展开' : '收起'}
              </Button>
            ) : null}
          </div>
        </div>
        <Typography.Paragraph className="paperjump-maker__section-head-description">
          {description}
        </Typography.Paragraph>
      </div>
      {collapsed ? null : children}
    </section>
  );
}

function SidebarSectionRow(props: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  right?: ReactNode;
  className?: string;
  onClick: () => void;
  onDragOver?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDrop?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: ReactDragEvent<HTMLDivElement>) => void;
}) {
  const { icon, label, active, right, className, onClick, onDragOver, onDrop, onDragEnd } = props;

  return (
    <div
      className={[
        'paperjump-maker__section-row',
        active ? 'paperjump-maker__section-row--active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <button type="button" className="paperjump-maker__section-main" onClick={onClick}>
        <span className="paperjump-maker__section-icon">{icon}</span>
        <span className="paperjump-maker__section-label">{label}</span>
      </button>
      {right}
    </div>
  );
}

type ContentChecklistItem = {
  id: string;
  title: string;
  level: ChecklistLevel;
  note: string;
  action: string;
};

function SectionStatusDot(props: { level?: ChecklistLevel }) {
  const { level } = props;

  if (!level) {
    return null;
  }

  return (
    <span
      className={[
        'paperjump-maker__section-status-dot',
        `paperjump-maker__section-status-dot--${level}`,
      ].join(' ')}
    />
  );
}

function EntryCard(props: {
  title: string;
  children: ReactNode;
  status?: ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
  extraActions?: ReactNode;
  onRemove: () => void;
}) {
  const {
    title,
    children,
    status,
    onMoveUp,
    onMoveDown,
    disableMoveUp,
    disableMoveDown,
    extraActions,
    onRemove,
  } = props;

  return (
    <div className="paperjump-maker__entry-card">
      <div className="paperjump-maker__entry-head">
        <div className="paperjump-maker__entry-title">
          <strong>{title}</strong>
          {status}
        </div>
        <div className="paperjump-maker__entry-actions">
          {extraActions}
          <Button
            type="text"
            icon={<UpOutlined />}
            onClick={onMoveUp}
            disabled={disableMoveUp || !onMoveUp}
          >
            上移
          </Button>
          <Button
            type="text"
            icon={<DownOutlined />}
            onClick={onMoveDown}
            disabled={disableMoveDown || !onMoveDown}
          >
            下移
          </Button>
          <Button danger type="text" icon={<DeleteOutlined />} onClick={onRemove}>
            删除
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

function ResumePreviewSection(props: {
  title: string;
  children: ReactNode;
  sectionId?: string;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const { title, children, sectionId, active, className, onClick } = props;

  return (
    <section
      className={[
        'paperjump-maker__resume-section',
        active ? 'paperjump-maker__resume-section--active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-resume-section={sectionId}
      onClick={onClick}
    >
      <div className="paperjump-maker__resume-section-title">{title}</div>
      {children}
    </section>
  );
}

function ExportActionCard(props: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  statusText?: string;
}) {
  const { icon, title, description, onClick, disabled, statusText } = props;

  return (
    <button
      type="button"
      className="paperjump-maker__export-action"
      onClick={() => void onClick()}
      disabled={disabled}
    >
      <span className="paperjump-maker__export-action-icon">{icon}</span>
      <span className="paperjump-maker__export-action-copy">
        <strong>
          {title}
          {statusText ? (
            <em className="paperjump-maker__export-action-status">{statusText}</em>
          ) : null}
        </strong>
        <span>{description}</span>
      </span>
    </button>
  );
}

function PreviewTimelineItem(props: {
  title?: string;
  subtitle?: string;
  duration?: string;
  meta?: ReactNode;
  description?: string;
  content?: ReactNode;
}) {
  const { title, subtitle, duration, meta, description, content } = props;
  const detail = description?.trim();

  return (
    <div className="paperjump-maker__timeline-item">
      {(title || subtitle || duration) ? (
        <div className="paperjump-maker__timeline-head">
          <div className="paperjump-maker__timeline-head-main">
            <strong className="paperjump-maker__timeline-title">{title || '未填写内容'}</strong>
            {subtitle ? <span className="paperjump-maker__timeline-subtitle">{subtitle}</span> : null}
          </div>
          {duration ? <em className="paperjump-maker__timeline-duration">{duration}</em> : null}
        </div>
      ) : null}
      {meta ? <div className="paperjump-maker__timeline-meta">{meta}</div> : null}
      {content ?? (detail ? renderStructuredContent(detail) : null)}
    </div>
  );
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function finalizeDraft(nextDraft: ResumeDraft, updatedAt = new Date().toISOString()) {
  return {
    ...nextDraft,
    updatedAt,
    title: nextDraft.profile.fullName ? `${nextDraft.profile.fullName}的简历` : '未命名简历',
  };
}

function resolveWorkspaceMode(sectionId: string): WorkspaceMode {
  return isStyleSectionId(sectionId) ? 'style' : 'content';
}

function isStyleSectionId(sectionId: string) {
  return sectionId.startsWith('section-layout');
}

function getSectionDisplayLabel(sectionId: string, customSectionCount: number) {
  if (sectionId === 'section-layout-recipes') {
    return '模板方案';
  }

  if (sectionId === 'section-layout-type') {
    return '字体与标题';
  }

  if (sectionId === 'section-layout-spacing') {
    return '页面节奏';
  }

  if (sectionId === 'section-profile') {
    return '基本信息';
  }

  if (sectionId === 'section-custom') {
    return customSectionCount ? `自定义模块 (${customSectionCount})` : '自定义模块';
  }

  if (!sectionId.startsWith('section-')) {
    return '简历内容';
  }

  const key = sectionId.replace('section-', '') as ResumeSectionKey;
  return builtInSectionMeta[key]?.label ?? '简历内容';
}

function getResumeCompletion(draft: ResumeDraft) {
  let completed = 0;
  let total = 1;

  const hasProfile = Boolean(
    draft.profile.fullName.trim() &&
      draft.profile.headline.trim() &&
      (draft.profile.phone.trim() || draft.profile.email.trim()),
  );
  if (hasProfile) {
    completed += 1;
  }

  const sectionChecks: Record<ResumeSectionKey, boolean> = {
    summary: Boolean(draft.summary.trim()),
    education: draft.education.some((item) => Boolean(item.school.trim() || item.major.trim())),
    experience: draft.experience.some(
      (item) =>
        Boolean(item.company.trim() || item.role.trim() || item.highlights.some((line) => line.trim())),
    ),
    projects: draft.projects.some(
      (item) =>
        Boolean(item.name.trim() || item.role.trim() || item.highlights.some((line) => line.trim())),
    ),
    skills: Boolean(draft.skills.trim()),
    awards: Boolean(draft.awards.trim()),
  };

  builtInSections.forEach((section) => {
    if (!draft.visibleSections[section.key]) {
      return;
    }

    total += 1;
    if (sectionChecks[section.key]) {
      completed += 1;
    }
  });

  if (draft.customSections.length) {
    total += 1;
    if (
      draft.customSections.some((item) =>
        Boolean(item.title.trim() || item.subtitle.trim() || item.time.trim() || item.content.trim()),
      )
    ) {
      completed += 1;
    }
  }

  return { completed, total };
}

function hasDraftContent(draft: ResumeDraft) {
  const profileFactsFilled = draft.profile.facts.some(
    (item) => item.label.trim() || item.value.trim(),
  );
  const educationFilled = draft.education.some((item) =>
    Boolean(
      item.school.trim() ||
        item.major.trim() ||
        item.degree.trim() ||
        item.description.trim() ||
        item.startDate.trim() ||
        item.endDate.trim(),
    ),
  );
  const experienceFilled = draft.experience.some((item) =>
    Boolean(
      item.company.trim() ||
        item.role.trim() ||
        item.description.trim() ||
        item.highlights.some((line) => line.trim()) ||
        item.startDate.trim() ||
        item.endDate.trim(),
    ),
  );
  const projectsFilled = draft.projects.some((item) =>
    Boolean(
      item.name.trim() ||
        item.role.trim() ||
        item.description.trim() ||
        item.link.trim() ||
        item.techStack.length ||
        item.highlights.some((line) => line.trim()) ||
        item.startDate.trim() ||
        item.endDate.trim(),
    ),
  );
  const customFilled = draft.customSections.some((item) =>
    Boolean(
      item.title.trim() ||
        item.subtitle.trim() ||
        item.location.trim() ||
        item.time.trim() ||
        item.content.trim(),
    ),
  );

  return Boolean(
    draft.profile.fullName.trim() ||
      draft.profile.headline.trim() ||
      draft.profile.phone.trim() ||
      draft.profile.email.trim() ||
      draft.profile.location.trim() ||
      draft.profile.website.trim() ||
      draft.profile.avatar ||
      profileFactsFilled ||
      draft.summary.trim() ||
      educationFilled ||
      experienceFilled ||
      projectsFilled ||
      draft.skills.trim() ||
      draft.awards.trim() ||
      customFilled,
  );
}

function getDraftContentSignature(draft: ResumeDraft) {
  return JSON.stringify({
    profile: {
      fullName: draft.profile.fullName,
      headline: draft.profile.headline,
      phone: draft.profile.phone,
      email: draft.profile.email,
      location: draft.profile.location,
      website: draft.profile.website,
      avatar: draft.profile.avatar,
      facts: draft.profile.facts.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    },
    summary: draft.summary,
    education: draft.education.map((item) => ({
      school: item.school,
      major: item.major,
      degree: item.degree,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
    })),
    experience: draft.experience.map((item) => ({
      company: item.company,
      role: item.role,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
      highlights: item.highlights,
    })),
    projects: draft.projects.map((item) => ({
      name: item.name,
      role: item.role,
      startDate: item.startDate,
      endDate: item.endDate,
      link: item.link,
      techStack: item.techStack,
      description: item.description,
      highlights: item.highlights,
    })),
    skills: draft.skills,
    awards: draft.awards,
    customSections: draft.customSections.map((item) => ({
      title: item.title,
      subtitle: item.subtitle,
      time: item.time,
      location: item.location,
      content: item.content,
      visible: item.visible,
    })),
    visibleSections: draft.visibleSections,
    sectionOrder: draft.sectionOrder,
    layoutPreset: draft.layoutPreset,
    accentTone: draft.accentTone,
    fontFamily: draft.fontFamily,
    titleStyle: draft.titleStyle,
    bodyFontSize: draft.bodyFontSize,
    lineHeight: draft.lineHeight,
    pagePadding: draft.pagePadding,
    sectionSpacing: draft.sectionSpacing,
  });
}

function isStarterDraft(draft: ResumeDraft) {
  return getDraftContentSignature(draft) === getDraftContentSignature(createEmptyDraft('__starter__'));
}

function buildContentChecklist(draft: ResumeDraft): ContentChecklistItem[] {
  const items: ContentChecklistItem[] = [];
  const missingProfileFields = [];

  if (!draft.profile.fullName.trim()) {
    missingProfileFields.push('姓名');
  }
  if (!draft.profile.headline.trim()) {
    missingProfileFields.push('求职标题');
  }
  if (!draft.profile.phone.trim() && !draft.profile.email.trim()) {
    missingProfileFields.push('手机号或邮箱');
  }

  items.push(
    missingProfileFields.length
      ? {
          id: 'section-profile',
          title: '基本信息',
          level: 'missing',
          note: `还缺少 ${missingProfileFields.join('、')}`,
          action: '补齐抬头',
        }
      : draft.profile.location.trim() && draft.profile.website.trim()
        ? {
            id: 'section-profile',
            title: '基本信息',
            level: 'ready',
            note: '抬头区域已经完整，可以直接支撑纸面预览。',
            action: '已完成',
          }
        : {
            id: 'section-profile',
            title: '基本信息',
            level: 'attention',
            note: '建议补上城市或个人链接，抬头会更像正式简历。',
            action: '补强信息',
          },
  );

  if (draft.visibleSections.summary) {
    const summaryLength = draft.summary.trim().length;
    items.push(
      summaryLength === 0
        ? {
            id: 'section-summary',
            title: '个人简介',
            level: 'missing',
            note: '还没有一句简介，纸面开头会显得空。',
            action: '去补简介',
          }
        : {
            id: 'section-summary',
            title: '个人简介',
            level: 'ready',
            note: '已经补上简介，纸面开头不会再空着。',
            action: '已完成',
          },
    );
  }

  if (draft.visibleSections.education) {
    const hasEducation = draft.education.some((item) => item.school.trim() || item.major.trim());
    const hasEducationDetails = draft.education.some((item) => item.description.trim());
    items.push(
      !hasEducation
        ? {
            id: 'section-education',
            title: '教育经历',
            level: 'missing',
            note: '学校和专业还没有补全。',
            action: '补齐经历',
          }
        : hasEducationDetails
          ? {
              id: 'section-education',
              title: '教育经历',
              level: 'ready',
              note: '基础信息和补充说明都已经具备。',
              action: '已完成',
            }
          : {
              id: 'section-education',
              title: '教育经历',
              level: 'attention',
              note: '建议补一条 GPA、课程或竞赛，让教育经历更有信息量。',
              action: '补充说明',
            },
    );
  }

  if (draft.visibleSections.experience) {
    const hasExperience = draft.experience.some((item) => item.company.trim() || item.role.trim());
    const completeExperience = draft.experience.every((item) =>
      item.highlights.some((line) => line.trim()),
    );
    items.push(
      !hasExperience
        ? {
            id: 'section-experience',
            title: '工作经历',
            level: 'missing',
            note: '还没有写任何公司或岗位，是最值得优先补的部分。',
            action: '去补工作',
          }
        : completeExperience
          ? {
              id: 'section-experience',
              title: '工作经历',
              level: 'ready',
              note: '每段经历都有要点，已经接近投递状态。',
              action: '已完成',
            }
          : {
              id: 'section-experience',
              title: '工作经历',
              level: 'attention',
              note: '至少有一段经历还没有写完整，建议补几行关键内容。',
              action: '补充描述',
            },
    );
  }

  if (draft.visibleSections.projects) {
    const hasProjects = draft.projects.some((item) => item.name.trim() || item.role.trim());
    const projectQuality = draft.projects.every(
      (item) =>
        item.highlights.some((line) => line.trim()) &&
        (item.techStack.length > 0 || item.link.trim()),
    );
    items.push(
      !hasProjects
        ? {
            id: 'section-projects',
            title: '项目经历',
            level: 'missing',
            note: '还没有项目内容，很多岗位会直接看这里。',
            action: '去补项目',
          }
        : projectQuality
          ? {
              id: 'section-projects',
              title: '项目经历',
              level: 'ready',
              note: '项目描述和补充信息都比较完整，阅读阻力很低。',
              action: '已完成',
            }
          : {
              id: 'section-projects',
              title: '项目经历',
              level: 'attention',
              note: '建议补足项目描述、关键词或链接，让信息更完整。',
              action: '补强项目',
            },
    );
  }

  if (draft.visibleSections.skills) {
    const skillLines = splitLines(draft.skills);
    items.push(
      !skillLines.length
        ? {
            id: 'section-skills',
            title: '技能清单',
            level: 'missing',
            note: '还没有技能关键词，纸面会缺少能力轮廓。',
            action: '补技能',
          }
        : skillLines.length < 3
          ? {
              id: 'section-skills',
              title: '技能清单',
              level: 'attention',
              note: '技能项偏少，建议补到至少 3 个关键词。',
              action: '补技能',
            }
          : {
              id: 'section-skills',
              title: '技能清单',
              level: 'ready',
              note: '技能列表已经形成基本能力轮廓。',
              action: '已完成',
            },
    );
  }

  if (draft.visibleSections.awards) {
    items.push(
      draft.awards.trim()
        ? {
            id: 'section-awards',
            title: '奖项 / 补充信息',
            level: 'ready',
            note: '补充信息已经到位，可以支撑完整度。',
            action: '已完成',
          }
        : {
            id: 'section-awards',
            title: '奖项 / 补充信息',
            level: 'attention',
            note: '可以考虑补证书、语言成绩或开源贡献，不一定非写奖项。',
            action: '补充一条',
          },
    );
  }

  if (draft.customSections.length) {
    const hasCustomContent = draft.customSections.some((item) =>
      Boolean(item.title.trim() || item.subtitle.trim() || item.content.trim()),
    );
    items.push(
      hasCustomContent
        ? {
            id: 'section-custom',
            title: '自定义模块',
            level: 'ready',
            note: '扩展信息已经被纳入文档，不会散在别处。',
            action: '已完成',
          }
        : {
            id: 'section-custom',
            title: '自定义模块',
            level: 'attention',
            note: '你已经创建了扩展区，但内容还没有写进去。',
            action: '补扩展项',
          },
    );
  }

  return items;
}

function summarizeChecklist(items: ContentChecklistItem[]) {
  return items.reduce(
    (summary, item) => {
      summary[item.level] += 1;
      return summary;
    },
    {
      ready: 0,
      attention: 0,
      missing: 0,
    } as Record<ChecklistLevel, number>,
  );
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBulletLine(value: string) {
  return value.replace(/\s*\n+\s*/g, ' ').replace(/^[-•·]\s*/, '').trim();
}

function normalizeBulletDraftLines(value: string[]) {
  return value.map((item) => normalizeBulletLine(item));
}

function stringifyHighlights(highlights: string[]) {
  return highlights
    .map((item) => normalizeBulletLine(item))
    .filter(Boolean)
    .join('\n');
}

function splitTagValues(value: string) {
  return value
    .split(/\r?\n|[,，、]|[|｜]|\s+\/\s+/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function normalizeTagValues(values: string[]) {
  const seen = new Set<string>();

  return values
    .flatMap((item) => splitTagValues(item))
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function findActiveStyleRecipe(draft: ResumeDraft, recipes: ResumeTemplate[]) {
  return (
    recipes.find((option) =>
      styleRecipeSettingKeys.every((key) => draft[key] === option.settings[key]),
    ) ?? null
  );
}

function buildTemplateSummary(template: ResumeTemplate) {
  const layoutLabel =
    template.settings.layoutPreset === 'compact' ? '紧凑模式' : '经典单栏';
  const accentLabel = accentOptions.find((item) => item.key === template.settings.accentTone)?.label ?? '钴蓝';
  return `${layoutLabel} · ${accentLabel} · ${template.mood}`;
}

function getPreviewSectionClassName(
  key: ResumeSectionKey,
  templateCode: string | null | undefined,
  previewLayoutVariant: PreviewLayoutVariant,
) {
  return getSharedTemplateSectionClassName({
    key,
    templateCode,
    layoutVariant: previewLayoutVariant,
  });
}

function ensureExternalHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatProjectLinkLabel(value: string) {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function renderProjectMeta(item: ProjectEntry) {
  const hasTechStack = item.techStack.length > 0;
  const hasLink = Boolean(item.link.trim());

  if (!hasTechStack && !hasLink) {
    return null;
  }

  return (
    <div className="paperjump-maker__timeline-meta-inline">
      {hasTechStack ? (
        <span className="paperjump-maker__timeline-meta-chip">
          <span className="paperjump-maker__timeline-meta-label">关键词</span>
          <span className="paperjump-maker__timeline-meta-text">{item.techStack.join(' / ')}</span>
        </span>
      ) : null}
      {hasLink ? (
        <span className="paperjump-maker__timeline-meta-chip">
          <span className="paperjump-maker__timeline-meta-label">链接</span>
          <a
            className="paperjump-maker__timeline-meta-link"
            href={ensureExternalHref(item.link)}
            target="_blank"
            rel="noreferrer"
          >
            {formatProjectLinkLabel(item.link)}
          </a>
        </span>
      ) : null}
    </div>
  );
}

const styleRecipeSettingKeys: Array<keyof StyleRecipeSettings> = [
  'layoutPreset',
  'accentTone',
  'fontFamily',
  'titleStyle',
  'bodyFontSize',
  'lineHeight',
  'pagePadding',
  'sectionSpacing',
];

function createDownloadFilename(title: string, extension: 'json' | 'txt' | 'pdf') {
  const normalizedTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 48);

  return `${normalizedTitle || 'paperjump-resume'}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function downloadTextFile(props: {
  filename: string;
  content: string;
  type: string;
}) {
  const { filename, content, type } = props;
  const blob = new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

async function exportResumePdf(previewPaper: HTMLDivElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  if ('fonts' in document) {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  }

  const canvas = await html2canvas(previewPaper, {
    backgroundColor: '#ffffff',
    scale: clampNumber(window.devicePixelRatio || 1.8, 1.8, 2.6),
    useCORS: true,
    onclone: (clonedDocument) => {
      clonedDocument
        .querySelector('.paperjump-maker__preview-paper')
        ?.classList.add('paperjump-maker__preview-paper--exporting');
    },
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const pageContentHeightPx = Math.floor((usableHeight * canvas.width) / usableWidth);
  const pageSlices = createPdfPageSlices(previewPaper, canvas.height, pageContentHeightPx);

  pageSlices.forEach((slice, pageIndex) => {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = slice.end - slice.start;

    const pageContext = pageCanvas.getContext('2d');
    if (!pageContext) {
      throw new Error('无法创建 PDF 分页画布');
    }

    pageContext.fillStyle = '#ffffff';
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageContext.drawImage(
      canvas,
      0,
      slice.start,
      canvas.width,
      slice.end - slice.start,
      0,
      0,
      canvas.width,
      slice.end - slice.start,
    );

    const pageImageHeight = ((slice.end - slice.start) * usableWidth) / canvas.width;

    pdf.addImage(
      pageCanvas.toDataURL('image/png'),
      'PNG',
      margin,
      margin,
      usableWidth,
      pageImageHeight,
      undefined,
      'FAST',
    );
  });

  pdf.save(filename);
}

function createPdfPageSlices(
  previewPaper: HTMLDivElement,
  canvasHeight: number,
  pageContentHeightPx: number,
) {
  const { sectionStarts, detailStarts } = collectPdfBreakStarts(previewPaper, canvasHeight);
  const slices: Array<{ start: number; end: number }> = [];
  const minSectionBreakOffset = pageContentHeightPx * 0.52;
  const minDetailBreakOffset = pageContentHeightPx * 0.68;
  const minSliceHeight = Math.max(220, pageContentHeightPx * 0.45);
  let start = 0;

  while (start < canvasHeight - 2) {
    const idealEnd = Math.min(start + pageContentHeightPx, canvasHeight);

    if (idealEnd >= canvasHeight) {
      slices.push({ start, end: canvasHeight });
      break;
    }

    let end =
      findLastBreakBefore(sectionStarts, start + minSectionBreakOffset, idealEnd - 8) ??
      findLastBreakBefore(detailStarts, start + minDetailBreakOffset, idealEnd - 8) ??
      idealEnd;

    if (end - start < minSliceHeight) {
      end = idealEnd;
    }

    slices.push({ start, end });
    start = end;
  }

  return slices;
}

function collectPdfBreakStarts(previewPaper: HTMLDivElement, canvasHeight: number) {
  const sectionStarts = collectBlockStarts(previewPaper, canvasHeight, [
    '.paperjump-maker__resume-header',
    '.paperjump-maker__resume-section',
  ]);
  const detailStarts = collectBlockStarts(previewPaper, canvasHeight, [
    '.paperjump-maker__timeline-item',
    '.paperjump-maker__skill-list',
    '.paperjump-maker__bullet-list',
    '.paperjump-maker__paragraphs',
  ]);

  return {
    sectionStarts,
    detailStarts,
  };
}

function collectBlockStarts(
  previewPaper: HTMLDivElement,
  canvasHeight: number,
  selectors: string[],
) {
  const paperRect = previewPaper.getBoundingClientRect();
  const paperHeight = previewPaper.scrollHeight || paperRect.height || 1;
  const ratio = canvasHeight / paperHeight;

  return Array.from(previewPaper.querySelectorAll<HTMLElement>(selectors.join(',')))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const top = Math.round((rect.top - paperRect.top) * ratio);
      const height = Math.round(rect.height * ratio);

      return {
        top: clampNumber(top, 0, canvasHeight),
        height,
      };
    })
    .filter((item) => item.top > 0 && item.height > 24)
    .sort((left, right) => left.top - right.top)
    .filter((item, index, list) => {
      const previous = list[index - 1];
      return !previous || item.top - previous.top > 20;
    })
    .map((item) => item.top);
}

function findLastBreakBefore(
  breakpoints: number[],
  minExclusive: number,
  maxExclusive: number,
) {
  for (let index = breakpoints.length - 1; index >= 0; index -= 1) {
    const breakpoint = breakpoints[index];
    if (breakpoint >= maxExclusive) {
      continue;
    }

    if (breakpoint <= minExclusive) {
      break;
    }

    return breakpoint;
  }

  return null;
}

function getReadableExportError(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '未知错误';
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    normalizedMessage.includes('failed to fetch dynamically imported module') ||
    normalizedMessage.includes('loading chunk') ||
    normalizedMessage.includes('importing a module script failed')
  ) {
    return 'PDF 导出组件加载失败，请刷新页面后再试一次。';
  }

  if (
    normalizedMessage.includes('tainted') ||
    normalizedMessage.includes('cross-origin') ||
    normalizedMessage.includes('cross origin')
  ) {
    return '简历里可能有跨域图片，先移除外链头像或图片后再试一次。';
  }

  if (normalizedMessage.includes('canvas')) {
    return '预览转图片时失败了，刷新页面后再试一次。';
  }

  return `PDF 导出失败：${rawMessage}`;
}

function buildResumePlainText(draft: ResumeDraft) {
  const lines: string[] = [];
  const headerLine = [
    draft.profile.phone,
    draft.profile.email,
    draft.profile.location,
    draft.profile.website,
    ...draft.profile.facts
      .filter((item) => item.label.trim() && item.value.trim())
      .map((item) => `${item.label}：${item.value}`),
  ]
    .filter(Boolean)
    .join(' | ');

  if (draft.profile.fullName.trim()) {
    lines.push(draft.profile.fullName.trim());
  }

  if (draft.profile.headline.trim()) {
    lines.push(draft.profile.headline.trim());
  }

  if (headerLine) {
    lines.push(headerLine);
  }

  appendPlainTextSection(lines, '个人简介', draft.visibleSections.summary ? splitLines(draft.summary) : []);

  if (draft.visibleSections.education) {
    appendPlainTextSection(
      lines,
      '教育经历',
      draft.education.flatMap((item) => {
        const row = compactText(
          [
            compactText([item.school, item.major], ' · '),
            item.degree,
            compactText([item.startDate, item.endDate], ' - '),
          ],
          ' | ',
        );

        return [row, ...splitLines(item.description)].filter(Boolean);
      }),
    );
  }

  if (draft.visibleSections.experience) {
    appendPlainTextSection(
      lines,
      '工作经历',
      draft.experience.flatMap((item) => {
        const head = compactText(
          [
            compactText([item.company, item.role], ' · '),
            compactText([item.startDate, item.endDate], ' - '),
          ],
          ' | ',
        );

        const bullets = item.highlights.length ? item.highlights : splitLines(item.description);
        return [head, ...bullets.map((bullet) => `- ${normalizeBulletLine(bullet)}`)].filter(Boolean);
      }),
    );
  }

  if (draft.visibleSections.projects) {
    appendPlainTextSection(
      lines,
      '项目经历',
      draft.projects.flatMap((item) => {
        const meta = compactText(
          [
            compactText([item.name, item.role], ' · '),
            compactText([item.startDate, item.endDate], ' - '),
            item.techStack.length ? `关键词：${item.techStack.join(' / ')}` : '',
            item.link,
          ],
          ' | ',
        );

        const bullets = item.highlights.length ? item.highlights : splitLines(item.description);
        return [meta, ...bullets.map((bullet) => `- ${normalizeBulletLine(bullet)}`)].filter(Boolean);
      }),
    );
  }

  appendPlainTextSection(
    lines,
    '技能清单',
    draft.visibleSections.skills ? splitLines(draft.skills) : [],
  );
  appendPlainTextSection(
    lines,
    '奖项 / 补充信息',
    draft.visibleSections.awards ? splitLines(draft.awards) : [],
  );

  draft.customSections
    .filter((item) => item.visible)
    .forEach((item) => {
      appendPlainTextSection(
        lines,
        item.title || '自定义模块',
        [
          compactText([item.subtitle, compactText([item.time, item.location], ' · ')], ' | '),
          ...splitLines(item.content).map((line) =>
            /^[\-•·]/.test(line) ? `- ${normalizeBulletLine(line)}` : line,
          ),
        ].filter(Boolean),
      );
    });

  return lines.join('\n').trim();
}

function appendPlainTextSection(lines: string[], title: string, contentLines: string[]) {
  const normalized = contentLines.map((item) => item.trim()).filter(Boolean);
  if (!normalized.length) {
    return;
  }

  if (lines.length) {
    lines.push('');
  }

  lines.push(title);
  lines.push(...normalized);
}

function compactText(values: string[], separator: string) {
  return values.map((item) => item.trim()).filter(Boolean).join(separator);
}

function renderParagraphContent(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return <Typography.Paragraph>{value.trim()}</Typography.Paragraph>;
  }

  return (
    <div className="paperjump-maker__paragraphs">
      {paragraphs.map((item, index) => (
        <Typography.Paragraph key={`${index}-${item.slice(0, 24)}`}>{item}</Typography.Paragraph>
      ))}
    </div>
  );
}

function renderBulletContent(value: string) {
  const lines = splitLines(value).map(normalizeBulletLine);

  return renderBulletLines(lines);
}

function renderBulletLines(lines: string[]) {
  const normalized = normalizeBulletDraftLines(lines).filter(Boolean);

  return (
    <ul className="paperjump-maker__bullet-list">
      {normalized.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  );
}

function renderStructuredContent(value: string) {
  const lines = splitLines(value);

  if (lines.length > 1) {
    return renderBulletContent(value);
  }

  return <Typography.Paragraph>{normalizeBulletLine(value.trim())}</Typography.Paragraph>;
}

function renderSkillsPreview(value: string) {
  const lines = splitLines(value);
  const shouldUseTags = lines.every(
    (item) => item.length <= 18 && !/[：:，,。；;]/.test(item),
  );

  if (shouldUseTags) {
    return (
      <div className="paperjump-maker__skill-list paperjump-maker__skill-list--inline">
        {lines.map((item, index) => (
          <span key={`${index}-${item}`} className="paperjump-maker__skill-token">
            {item}
          </span>
        ))}
      </div>
    );
  }

  return renderBulletContent(value);
}

function joinDuration(startDate: string, endDate: string) {
  return [startDate, endDate].filter(Boolean).join(' - ');
}

function splitDurationInput(value: string) {
  const [startDate = '', endDate = ''] = value.split('-').map((item) => item.trim());
  return [startDate, endDate] as const;
}

function moveItem<T extends { id: string }>(items: T[], id: string, direction: -1 | 1) {
  const currentIndex = items.findIndex((item) => item.id === id);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [target] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, target);
  return nextItems;
}

function moveValue<T>(items: T[], target: T, direction: -1 | 1) {
  const currentIndex = items.findIndex((item) => item === target);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, item);
  return nextItems;
}

function reorderValue<T>(items: T[], source: T, target: T) {
  const sourceIndex = items.findIndex((item) => item === source);
  const targetIndex = items.findIndex((item) => item === target);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, item);
  return nextItems;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
