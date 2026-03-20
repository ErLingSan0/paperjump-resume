ALTER TABLE user_account
  ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'active' AFTER role,
  ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

CREATE TABLE IF NOT EXISTS user_template_favorite (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  template_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_template_favorite_user FOREIGN KEY (user_id) REFERENCES user_account (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_template_favorite_template FOREIGN KEY (template_id) REFERENCES resume_template (id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_template_favorite_user_template (user_id, template_id)
);

CREATE INDEX idx_user_template_favorite_user_id ON user_template_favorite (user_id);

INSERT INTO resume_template (code, name, category, cover_image_url, schema_json, is_active)
VALUES
  (
    'campus-launch',
    'Campus Launch',
    'campus',
    NULL,
    JSON_OBJECT(
      'description', '更像成熟校招成品，保留呼吸感但不会轻易拖成很多页。',
      'badge', 'Starter',
      'mood', '校招 / 实习',
      'spotlight', '更适合第一份正式简历',
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
    'steady-general',
    'Steady General',
    'general',
    NULL,
    JSON_OBJECT(
      'description', '信息关系更紧凑，接近成熟投递文档的排版密度。',
      'badge', 'Popular',
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
    'one-page-priority',
    'One-Page Priority',
    'compact',
    NULL,
    JSON_OBJECT(
      'description', '主动压缩留白和条目间距，适合内容偏多的投递版本。',
      'badge', 'Compact',
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
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  cover_image_url = VALUES(cover_image_url),
  schema_json = VALUES(schema_json),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;
