-- 001_init.sql — Sprint 00
-- Schema lõi theo docs/db.dbml (7 bảng + partial unique index Q-15 + trash index Q-21
-- + snapshot columns Q-04 + option_order Q-19).
-- PRAGMA foreign_keys=ON được set ở tầng pool (per-connection), không đặt ở đây.

CREATE TABLE IF NOT EXISTS subjects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  color           TEXT NOT NULL DEFAULT '#262b33',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at      TEXT NULL,
  delete_batch_id TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_subjects_created_at         ON subjects(created_at);
CREATE INDEX IF NOT EXISTS idx_subjects_deleted_at         ON subjects(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_delete_batch_id    ON subjects(delete_batch_id) WHERE deleted_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_subjects_name_active
  ON subjects(lower(trim(name))) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS exams (
  id              TEXT PRIMARY KEY,
  subject_id      TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  title           TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at      TEXT NULL,
  delete_batch_id TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id                ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject_created_at        ON exams(subject_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exams_deleted_at                ON exams(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_delete_batch_id           ON exams(delete_batch_id) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_subject_deleted_at        ON exams(subject_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_exams_subject_title_active
  ON exams(subject_id, lower(trim(title))) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS questions (
  id          TEXT PRIMARY KEY,
  exam_id     TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  ask         TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL CHECK (position >= 0),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (exam_id, position)
);

CREATE TABLE IF NOT EXISTS answer_options (
  id          TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL DEFAULT '',
  is_correct  INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0,1)),
  position    INTEGER NOT NULL CHECK (position >= 0),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (question_id, position)
);

CREATE TABLE IF NOT EXISTS attempts (
  id              TEXT PRIMARY KEY,
  exam_id         TEXT NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
  subject_id      TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  exam_title      TEXT NOT NULL,
  subject_name    TEXT NOT NULL,
  submitted_at    TEXT NOT NULL,
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  correct_count   INTEGER NOT NULL CHECK (correct_count >= 0 AND correct_count <= total_questions),
  score           REAL NOT NULL CHECK (score >= 0 AND score <= 10),
  duration_sec    INTEGER NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_submitted    ON attempts(exam_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_attempts_subject_submitted ON attempts(subject_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted_at      ON attempts(submitted_at);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id                 TEXT PRIMARY KEY,
  attempt_id         TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id        TEXT NULL REFERENCES questions(id) ON DELETE SET NULL,
  position           INTEGER NOT NULL CHECK (position >= 0),
  selected_option_id TEXT NULL REFERENCES answer_options(id) ON DELETE SET NULL,
  selected_option_ids TEXT NOT NULL DEFAULT '[]',
  question_text      TEXT NOT NULL DEFAULT '',
  options_snapshot   TEXT NOT NULL DEFAULT '[]',
  correct_option_ids TEXT NOT NULL DEFAULT '[]',
  option_order       TEXT NOT NULL DEFAULT '[]',
  is_correct         INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0,1)),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (attempt_id, position)
);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question        ON attempt_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_selected_option ON attempt_answers(selected_option_id);

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Seed mặc định
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'system');
