package com.wh.resumeplatform.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

import com.wh.resumeplatform.model.UserAccount;

@Repository
public class UserAccountRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    private final RowMapper<UserAccount> rowMapper = (resultSet, rowNum) -> new UserAccount(
            resultSet.getLong("id"),
            resultSet.getString("email"),
            resultSet.getString("display_name"),
            resultSet.getString("password_hash"),
            resultSet.getString("role"),
            resultSet.getString("status"),
            toInstant(resultSet.getTimestamp("created_at")),
            toInstant(resultSet.getTimestamp("updated_at")),
            toInstant(resultSet.getTimestamp("last_login_at")));

    public UserAccountRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<UserAccount> findById(Long id) {
        return findOne(
                """
                        SELECT id, email, display_name, password_hash, role, status, created_at, updated_at, last_login_at
                        FROM user_account
                        WHERE id = :id
                        """,
                Map.of("id", id));
    }

    public Optional<UserAccount> findByEmail(String email) {
        return findOne(
                """
                        SELECT id, email, display_name, password_hash, role, status, created_at, updated_at, last_login_at
                        FROM user_account
                        WHERE email = :email
                        """,
                Map.of("email", email));
    }

    public UserAccount create(String email, String displayName, String passwordHash, String role, String status) {
        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("email", email)
                .addValue("displayName", displayName)
                .addValue("passwordHash", passwordHash)
                .addValue("role", role)
                .addValue("status", status);

        jdbcTemplate.update(
                """
                        INSERT INTO user_account (email, display_name, password_hash, role, status)
                        VALUES (:email, :displayName, :passwordHash, :role, :status)
                        """,
                parameters,
                keyHolder,
                new String[] {"id"});

        Number key = keyHolder.getKey();
        return findById(key == null ? null : key.longValue())
                .orElseThrow(() -> new IllegalStateException("Failed to load created user"));
    }

    public void updateLastLoginAt(Long id) {
        jdbcTemplate.update(
                """
                        UPDATE user_account
                        SET last_login_at = CURRENT_TIMESTAMP
                        WHERE id = :id
                        """,
                Map.of("id", id));
    }

    private Optional<UserAccount> findOne(String sql, Map<String, ?> parameters) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, parameters, rowMapper));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
