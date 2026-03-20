INSERT INTO resume_template (code, name, category, cover_image_url, schema_json, is_active)
VALUES
  (
    'campus-launch',
    '校招清晰版',
    'campus',
    '/template-previews/campus-launch.svg',
    JSON_OBJECT(
      'description', '适合第一份正式简历，结构清楚、留白稳定。',
      'badge', '校招推荐',
      'mood', '校招 / 实习',
      'spotlight', '更容易做成一页成稿',
      'previewVariant', 'student',
      'settings', JSON_OBJECT(
        'layoutPreset', 'classic',
        'accentTone', 'cobalt',
        'fontFamily', 'studio',
        'titleStyle', 'rule',
        'bodyFontSize', 13.2,
        'lineHeight', 1.52,
        'pagePadding', 24,
        'sectionSpacing', 17
      )
    ),
    1
  ),
  (
    'internship-sprint',
    '实习强化版',
    'campus',
    '/template-previews/internship-sprint.svg',
    JSON_OBJECT(
      'description', '突出项目和执行经历，适合运营、产品、助理岗位。',
      'badge', '实习优先',
      'mood', '运营 / 增长',
      'spotlight', '强调经历推进和结果',
      'previewVariant', 'student',
      'settings', JSON_OBJECT(
        'layoutPreset', 'classic',
        'accentTone', 'sage',
        'fontFamily', 'system',
        'titleStyle', 'rule',
        'bodyFontSize', 13.0,
        'lineHeight', 1.5,
        'pagePadding', 24,
        'sectionSpacing', 16
      )
    ),
    1
  ),
  (
    'steady-general',
    '通用稳妥版',
    'general',
    '/template-previews/steady-general.svg',
    JSON_OBJECT(
      'description', '信息层级克制，适合大多数通用投递场景。',
      'badge', '通用经典',
      'mood', '通用投递',
      'spotlight', '最接近成熟投递文档',
      'previewVariant', 'default',
      'settings', JSON_OBJECT(
        'layoutPreset', 'classic',
        'accentTone', 'ink',
        'fontFamily', 'system',
        'titleStyle', 'minimal',
        'bodyFontSize', 12.8,
        'lineHeight', 1.44,
        'pagePadding', 23,
        'sectionSpacing', 15
      )
    ),
    1
  ),
  (
    'project-story',
    '项目展示版',
    'general',
    '/template-previews/project-story.svg',
    JSON_OBJECT(
      'description', '强化项目段落和案例表达，适合产品、运营、项目岗。',
      'badge', '项目导向',
      'mood', '产品 / 项目',
      'spotlight', '项目经历会更靠前',
      'previewVariant', 'creative',
      'settings', JSON_OBJECT(
        'layoutPreset', 'classic',
        'accentTone', 'cobalt',
        'fontFamily', 'studio',
        'titleStyle', 'banner',
        'bodyFontSize', 12.9,
        'lineHeight', 1.48,
        'pagePadding', 24,
        'sectionSpacing', 16
      )
    ),
    1
  ),
  (
    'design-showcase',
    '双栏设计版',
    'general',
    '/template-previews/design-showcase.svg',
    JSON_OBJECT(
      'description', '左侧信息聚合，右侧作品和经历更醒目，适合设计岗。',
      'badge', '双栏版式',
      'mood', '设计 / 创意',
      'spotlight', '视觉识别更强',
      'previewVariant', 'creative',
      'settings', JSON_OBJECT(
        'layoutPreset', 'classic',
        'accentTone', 'cobalt',
        'fontFamily', 'studio',
        'titleStyle', 'banner',
        'bodyFontSize', 12.7,
        'lineHeight', 1.46,
        'pagePadding', 22,
        'sectionSpacing', 15
      )
    ),
    1
  ),
  (
    'one-page-priority',
    '一页压缩版',
    'compact',
    '/template-previews/one-page-priority.svg',
    JSON_OBJECT(
      'description', '主动压缩留白和条目间距，适合内容偏多的投递版本。',
      'badge', '一页优先',
      'mood', '一页压缩',
      'spotlight', '内容偏多时更稳',
      'previewVariant', 'creative',
      'settings', JSON_OBJECT(
        'layoutPreset', 'compact',
        'accentTone', 'cobalt',
        'fontFamily', 'system',
        'titleStyle', 'rule',
        'bodyFontSize', 12.1,
        'lineHeight', 1.34,
        'pagePadding', 18,
        'sectionSpacing', 11
      )
    ),
    1
  ),
  (
    'data-focus',
    '数据分析版',
    'compact',
    '/template-previews/data-focus.svg',
    JSON_OBJECT(
      'description', '更强调指标、结果和项目拆解，适合数据、策略、商业分析。',
      'badge', '数据结果',
      'mood', '数据 / 分析',
      'spotlight', '指标和结果更容易前置',
      'previewVariant', 'default',
      'settings', JSON_OBJECT(
        'layoutPreset', 'compact',
        'accentTone', 'sage',
        'fontFamily', 'system',
        'titleStyle', 'minimal',
        'bodyFontSize', 12.3,
        'lineHeight', 1.36,
        'pagePadding', 20,
        'sectionSpacing', 12
      )
    ),
    1
  ),
  (
    'executive-brief',
    '咨询管理版',
    'compact',
    '/template-previews/executive-brief.svg',
    JSON_OBJECT(
      'description', '更成熟克制的文档气质，适合管理培训生、咨询和职能岗。',
      'badge', '成熟投递',
      'mood', '咨询 / 管理',
      'spotlight', '适合偏正式岗位',
      'previewVariant', 'default',
      'settings', JSON_OBJECT(
        'layoutPreset', 'classic',
        'accentTone', 'ink',
        'fontFamily', 'serif',
        'titleStyle', 'minimal',
        'bodyFontSize', 12.6,
        'lineHeight', 1.42,
        'pagePadding', 23,
        'sectionSpacing', 14
      )
    ),
    1
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  cover_image_url = VALUES(cover_image_url),
  schema_json = VALUES(schema_json),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;
