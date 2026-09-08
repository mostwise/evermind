-- Baseline: the 2.14.5 schema, as the first CLI-managed migration.
--
-- Everything `scripts/001_create_assignments_table.sql`,
-- `scripts/002_create_classes_table.sql` and `scripts/004_updated_at_trigger.sql`
-- produce between them, in one file. Running this on an empty project gives the
-- same database those three give; running it on a database that already has them
-- changes nothing, because every statement here is idempotent.
--
-- Two deliberate differences from `scripts/001`:
--
--   1. The `status` CHECK constraint is `('pending', 'completed')`, not
--      ('pending', 'completed', 'overdue'). `scripts/003` narrows it for a
--      database upgraded from 2.9.0, but a *fresh* install from 001 never runs
--      003, so fresh installs have been carrying a constraint one value wider
--      than `Status` in `lib/types.ts` allows. Nothing has ever written
--      'overdue' — commit 4aa2bb9 describes it as unused — so the UPDATE below
--      is expected to match zero rows. It runs first because the narrowed
--      constraint cannot be added while a row violates it.
--
--   2. The policies are dropped before being created, following 002's pattern
--      rather than 001's, so this file can be re-run.
--
-- USING decides which rows may be targeted; WITH CHECK decides what a row is
-- allowed to become. Postgres infers neither from the other, so an UPDATE policy
-- without WITH CHECK lets a user move one of their rows into another account by
-- rewriting `user_id`. That was audit finding C2.
--
-- Existing deployments: the CLI tracks applied migrations in
-- `supabase_migrations.schema_migrations`, which a hand-run database does not
-- have. Run `supabase migration repair --status applied 20260904120000` once, so
-- the CLI knows this baseline is already in place, before pushing anything after
-- it. `docs/self-hosting.md` walks through it.

BEGIN;

-- ---------------------------------------------------------------------------
-- assignments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For a database created from `scripts/001`, where the constraint is wider.
UPDATE assignments SET status = 'pending' WHERE status = 'overdue';

ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_status_check;
ALTER TABLE assignments
  ADD CONSTRAINT assignments_status_check CHECK (status IN ('pending', 'completed'));

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own assignments" ON assignments;
CREATE POLICY "Users can view their own assignments"
  ON assignments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignments;
CREATE POLICY "Users can insert their own assignments"
  ON assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assignments" ON assignments;
CREATE POLICY "Users can update their own assignments"
  ON assignments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own assignments" ON assignments;
CREATE POLICY "Users can delete their own assignments"
  ON assignments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- ---------------------------------------------------------------------------
-- classes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own classes" ON classes;
CREATE POLICY "Users can view their own classes"
  ON classes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own classes" ON classes;
CREATE POLICY "Users can insert their own classes"
  ON classes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own classes" ON classes;
CREATE POLICY "Users can update their own classes"
  ON classes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own classes" ON classes;
CREATE POLICY "Users can delete their own classes"
  ON classes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(user_id);

-- One "Chemistry" per student, however they capitalised it the second time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_user_id_name ON classes(user_id, lower(name));

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
-- `moddatetime` writes the transaction timestamp into the named column on every
-- UPDATE, whatever the statement said that column should be. INSERT needs
-- nothing: the column already defaults to NOW().

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DROP TRIGGER IF EXISTS handle_updated_at ON assignments;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification — run separately, after the transaction has committed
-- ---------------------------------------------------------------------------
--
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('assignments', 'classes');
--   -- relrowsecurity must be true for both
--
--   SELECT tablename, cmd, with_check IS NOT NULL AS has_with_check
--   FROM pg_policies WHERE tablename IN ('assignments', 'classes')
--   ORDER BY tablename, cmd;
--   -- eight rows; has_with_check true on both INSERT and both UPDATE rows
--
--   SELECT count(*) FROM assignments WHERE status NOT IN ('pending', 'completed');
--   -- zero
