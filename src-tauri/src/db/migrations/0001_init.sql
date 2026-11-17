CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  exam_count INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  content TEXT NOT NULL
);
CREATE TABLE options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1))
);
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('quiz', 'flashcard')),
  snapshot_json TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  total INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  score REAL NOT NULL,
  elapsed_sec INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER NOT NULL
);
CREATE INDEX idx_subjects_page ON subjects (deleted_at, created_at DESC, id DESC);
CREATE INDEX idx_exams_page ON exams (subject_id, deleted_at, created_at DESC, id DESC);
CREATE INDEX idx_questions_exam ON questions (exam_id, position);
CREATE INDEX idx_options_question ON options (question_id, position);
CREATE INDEX idx_attempts_recent ON attempts (submitted_at DESC);
CREATE INDEX idx_attempts_exam ON attempts (exam_id);
CREATE INDEX idx_subjects_trash ON subjects (deleted_at DESC, id DESC) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_exams_trash ON exams (deleted_at DESC, id DESC) WHERE deleted_at IS NOT NULL;
