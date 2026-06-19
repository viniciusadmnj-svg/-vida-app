-- Vida App — Schema PostgreSQL
-- Executado automaticamente na inicialização do servidor

CREATE TABLE IF NOT EXISTS goals (
  id          SERIAL PRIMARY KEY,
  title       TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  target_value INTEGER NOT NULL DEFAULT 1,
  unit        TEXT    NOT NULL DEFAULT 'dias',
  start_date  TEXT,
  end_date    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_checkins (
  id         SERIAL PRIMARY KEY,
  goal_id    INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  date       TEXT    NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diary_entries (
  id         SERIAL PRIMARY KEY,
  content    TEXT    NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id            SERIAL PRIMARY KEY,
  day_of_week   INTEGER NOT NULL,
  exercise_name TEXT    NOT NULL DEFAULT '',
  sets          INTEGER,
  reps          INTEGER,
  weight        NUMERIC,
  notes         TEXT    NOT NULL DEFAULT '',
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_entries (
  id           SERIAL PRIMARY KEY,
  day          INTEGER NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  entrada      NUMERIC NOT NULL DEFAULT 0,
  saida        NUMERIC NOT NULL DEFAULT 0,
  month        INTEGER NOT NULL,
  year         INTEGER NOT NULL,
  recurring_id INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_recurring (
  id          SERIAL PRIMARY KEY,
  description TEXT    NOT NULL DEFAULT '',
  entrada     NUMERIC NOT NULL DEFAULT 0,
  saida       NUMERIC NOT NULL DEFAULT 0,
  day         INTEGER NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_entries (
  id          SERIAL PRIMARY KEY,
  date        TEXT,
  entry_type  TEXT    NOT NULL DEFAULT 'custom',
  food_eaten  TEXT    NOT NULL DEFAULT '',
  is_complied INTEGER NOT NULL DEFAULT 0,
  notes       TEXT    NOT NULL DEFAULT '',
  month       INTEGER NOT NULL,
  year        INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_plan (
  id          SERIAL PRIMARY KEY,
  meal_name   TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_projects (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  emoji       TEXT NOT NULL DEFAULT '📚',
  color       TEXT NOT NULL DEFAULT '#6366f1',
  status      TEXT NOT NULL DEFAULT 'ativo',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_tasks (
  id         SERIAL  PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES work_projects(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL DEFAULT '',
  url        TEXT    NOT NULL DEFAULT '',
  notes      TEXT    NOT NULL DEFAULT '',
  priority   TEXT    NOT NULL DEFAULT 'media',
  due_date   TEXT,
  status     TEXT    NOT NULL DEFAULT 'a_fazer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_rules (
  id          SERIAL PRIMARY KEY,
  pattern     TEXT    NOT NULL DEFAULT '',
  label       TEXT    NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
