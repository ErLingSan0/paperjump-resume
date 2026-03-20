package com.wh.resumeplatform.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wh.resumeplatform.model.ResumeTemplate;
import com.wh.resumeplatform.model.TemplateSchema;
import com.wh.resumeplatform.model.TemplateStyleSettings;

@Repository
public class ResumeTemplateRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    private final RowMapper<ResumeTemplate> rowMapper = (resultSet, rowNum) -> new ResumeTemplate(
            resultSet.getLong("id"),
            resultSet.getString("code"),
            resultSet.getString("name"),
            resultSet.getString("category"),
            resultSet.getString("cover_image_url"),
            parseSchema(resultSet.getString("schema_json")),
            resultSet.getBoolean("favorited"),
            toInstant(resultSet.getTimestamp("created_at")),
            toInstant(resultSet.getTimestamp("updated_at")));

    public ResumeTemplateRepository(NamedParameterJdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public List<ResumeTemplate> findActiveTemplates(Long userId) {
        return jdbcTemplate.query(
                """
                        SELECT t.id, t.code, t.name, t.category, t.cover_image_url, t.schema_json, t.created_at, t.updated_at,
                               CASE WHEN utf.id IS NULL THEN FALSE ELSE TRUE END AS favorited
                        FROM resume_template t
                        LEFT JOIN user_template_favorite utf
                          ON utf.template_id = t.id
                         AND utf.user_id = :userId
                        WHERE t.is_active = 1
                        ORDER BY t.id ASC
                        """,
                Map.of("userId", userId == null ? -1L : userId),
                rowMapper);
    }

    public Optional<ResumeTemplate> findActiveTemplateById(Long templateId, Long userId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    """
                            SELECT t.id, t.code, t.name, t.category, t.cover_image_url, t.schema_json, t.created_at, t.updated_at,
                                   CASE WHEN utf.id IS NULL THEN FALSE ELSE TRUE END AS favorited
                            FROM resume_template t
                            LEFT JOIN user_template_favorite utf
                              ON utf.template_id = t.id
                             AND utf.user_id = :userId
                            WHERE t.id = :templateId
                              AND t.is_active = 1
                            """,
                    new MapSqlParameterSource()
                            .addValue("templateId", templateId)
                            .addValue("userId", userId == null ? -1L : userId),
                    rowMapper));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    public void setFavorite(Long userId, Long templateId, boolean favorited) {
        if (favorited) {
            jdbcTemplate.update(
                    """
                            INSERT INTO user_template_favorite (user_id, template_id)
                            VALUES (:userId, :templateId)
                            ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
                            """,
                    Map.of("userId", userId, "templateId", templateId));
            return;
        }

        jdbcTemplate.update(
                """
                        DELETE FROM user_template_favorite
                        WHERE user_id = :userId
                          AND template_id = :templateId
                        """,
                Map.of("userId", userId, "templateId", templateId));
    }

    private TemplateSchema parseSchema(String schemaJson) {
        try {
            return objectMapper.readValue(schemaJson, TemplateSchema.class);
        } catch (Exception exception) {
            return new TemplateSchema(
                    "",
                    "",
                    "",
                    "",
                    "default",
                    new TemplateStyleSettings("classic", "cobalt", "studio", "rule", 13.0, 1.46, 24, 16));
        }
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
