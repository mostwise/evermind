-- Length limits, and timestamps that cannot be null.
--
-- Two things the schema has never enforced.
--
-- 1. **Lengths.** `title`, `subject` and `description` are unbounded `TEXT`.
--    `docs/self-hosting.md` has been carrying this block as a snippet for
--    operators to apply by hand, which means almost nobody has it. The database
--    is the only place these can be enforced: assignment writes go from the
--    browser straight to PostgREST, so there is no server code between a user
--    and the column. The limits are generous — 300 characters is a long
--    assignment title — and chosen to stop abuse, not to shape input.
--
-- 2. **Null timestamps.** `created_at` and `updated_at` are `DEFAULT NOW()` but
--    nullable, so `supabase gen types` reports them as `string | null` while
--    every consumer in the app treats them as `string`. Nothing has ever
--    written a null — you would have to ask for one explicitly — so this
--    tightens the column to what the code already assumes rather than changing
--    any behaviour. The UPDATE before each is there so the ALTER cannot fail on
--    a row that somehow has one.
--
-- Idempotent: constraints are dropped by name before being added, and SET NOT
-- NULL on a column that is already NOT NULL is a no-op.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Length limits
-- ---------------------------------------------------------------------------

ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_title_length;
ALTER TABLE assignments
  ADD CONSTRAINT assignments_title_length CHECK (char_length(title) <= 300);

ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_subject_length;
ALTER TABLE assignments
  ADD CONSTRAINT assignments_subject_length CHECK (char_length(subject) <= 200);

-- `description` is nullable. A CHECK against NULL evaluates to NULL, which
-- passes, so this constrains the length of a description without requiring one.
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_description_length;
ALTER TABLE assignments
  ADD CONSTRAINT assignments_description_length CHECK (char_length(description) <= 10000);

-- ---------------------------------------------------------------------------
-- 2. Timestamps
-- ---------------------------------------------------------------------------

UPDATE assignments SET created_at = NOW() WHERE created_at IS NULL;
UPDATE assignments SET updated_at = COALESCE(created_at, NOW()) WHERE updated_at IS NULL;

ALTER TABLE assignments ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE assignments ALTER COLUMN updated_at SET NOT NULL;

UPDATE classes SET created_at = NOW() WHERE created_at IS NULL;

ALTER TABLE classes ALTER COLUMN created_at SET NOT NULL;

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification — run separately, after the transaction has committed
-- ---------------------------------------------------------------------------
--
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'assignments'::regclass AND contype = 'c'
--   ORDER BY conname;
--   -- expect: description_length, priority_check, status_check,
--   --         subject_length, title_length
--
--   SELECT column_name, is_nullable FROM information_schema.columns
--   WHERE table_name IN ('assignments', 'classes')
--     AND column_name IN ('created_at', 'updated_at')
--   ORDER BY table_name, column_name;
--   -- is_nullable must be NO for all three
