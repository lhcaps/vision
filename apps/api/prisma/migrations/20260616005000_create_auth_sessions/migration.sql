-- Auth session table for cookie-based login. Idempotent for existing local DBs.

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_hash CHAR(64) NOT NULL,
  official_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME(0) NOT NULL,
  ip_address VARCHAR(100) NULL,
  user_agent TEXT NULL,
  created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  updated_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_token (token_hash),
  KEY idx_auth_sessions_official (official_id),
  KEY idx_auth_sessions_expires (expires_at),
  CONSTRAINT fk_auth_sessions_official
    FOREIGN KEY (official_id) REFERENCES officials(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);
