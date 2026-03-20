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
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

import com.wh.resumeplatform.model.ResumeDocument;

@Repository
public class ResumeRepository {

    private static final String BASE_SELECT = """
            SELECT r.id, r.user_id, r.template_id, t.name AS template_name, r.title, r.status, r.visibility,
                   r.content_json, r.created_at, r.updated_at
            FROM resume r
            LEFT JOIN resume_template t ON t.id = r.template_id
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    private final RowMapper<ResumeDocument> rowMapper = (resultSet, rowNum) -> new ResumeDocument(
            resultSet.getLong("id"),
            resultSet.getLong("user_id"),
            resultSet.getObject("template_id", Long.class),
            resultSet.getString("template_name"),
            resultSet.getString("title"),
            resultSet.getString("status"),
            resultSet.getString("visibility"),
            resultSet.getString("content_json"),
            toInstant(resultSet.getTimestamp("created_at")),
            toInstant(resultSet.getTimestamp("updated_at")));

    public ResumeRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ResumeDocument> findByUserId(Long userId) {
        return jdbcTemplate.query(
                BASE_SELECT + """
                        WHERE r.user_id = :userId
                        ORDER BY r.updated_at DESC, r.id DESC
                        """,
                Map.of("userId", userId),
                rowMapper);
    }

    public Optional<ResumeDocument> findByIdAndUserId(Long resumeId, Long userId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    BASE_SELECT + """
                            WHERE r.id = :resumeId
                              AND r.user_id = :userId
                            """,
                    Map.of("resumeId", resumeId, "userId", userId),
                    rowMapper));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    public ResumeDocument create(Long userId, Long templateId, String title, String status, String visibility, String contentJson) {
        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("templateId", templateId)
                .addValue("title", title)
                .addValue("status", status)
                .addValue("visibility", visibility)
                .addValue("contentJson", contentJson);

        jdbcTemplate.update(
                """
                        INSERT INTO resume (user_id, template_id, title, status, visibility, content_json)
                        VALUES (:userId, :templateId, :title, :status, :visibility, :contentJson)
                        """,
                parameters,
                keyHolder,
                new String[] {"id"});

        Number key = keyHolder.getKey();
        return findByIdAndUserId(key == null ? null : key.longValue(), userId)
                .orElseThrow(() -> new IllegalStateException("Failed to load created resume"));
    }

    public ResumeDocument update(Long resumeId, Long userId, Long templateId, String title, String status, String visibility, String contentJson) {
        jdbcTemplate.update(
                """
                        UPDATE resume
                        SET template_id = :templateId,
                            title = :title,
                            status = :status,
                            visibility = :visibility,
                            content_json = :contentJson
                        WHERE id = :resumeId
                          AND user_id = :userId
                        """,
                new MapSqlParameterSource()
                        .addValue("resumeId", resumeId)
                        .addValue("userId", userId)
                        .addValue("templateId", templateId)
                        .addValue("title", title)
                        .addValue("status", status)
                        .addValue("visibility", visibility)
                        .addValue("contentJson", contentJson));

        return findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new IllegalStateException("Failed to load updated resume"));
    }

    public void delete(Long resumeId, Long userId) {
        jdbcTemplate.update(
                """
                        DELETE FROM resume
                        WHERE id = :resumeId
                          AND user_id = :userId
                        """,
                Map.of("resumeId", resumeId, "userId", userId));
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
