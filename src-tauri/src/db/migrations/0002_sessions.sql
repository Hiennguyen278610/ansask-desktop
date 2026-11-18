CREATE TABLE session_drafts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL UNIQUE REFERENCES exams(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('quiz', 'flashcard')),
  questions_json TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  first_try_json TEXT NOT NULL,
  current_index INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  elapsed_sec INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_session_drafts_updated ON session_drafts (updated_at DESC);
CREATE INDEX idx_attempts_page ON attempts (submitted_at DESC, id DESC);
