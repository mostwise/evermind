-- The length limit `classes.name` never got.
--
-- `20260904120100_tighten_column_constraints.sql` bounded every free-text column
-- on `assignments` and stated the reason plainly: assignment writes go from the
-- browser straight to PostgREST, so the database is the only place a limit can
-- be enforced. `classes.name` is written the same way and was missed.
--
-- It matters now because `lib/api/schemas.ts` refuses a class name over 200
-- characters, and a rule enforced in one of its two places is worse than a rule
-- enforced in neither — it reads as covered while the direct-to-PostgREST path
-- that most of the app still uses walks straight past it.
--
-- 200 to match `assignments.subject`, which holds the same string: a class is
-- promoted from a subject already typed on an assignment, so a class name that
-- could not fit in `subject` would be a name no assignment could ever be filed
-- under.
--
-- Idempotent: dropped by name before being added. The UPDATE is there so the
-- ADD cannot fail on a row that predates the rule; there should be none, and
-- truncating is better than a migration that will not apply.

BEGIN;

UPDATE classes SET name = left(name, 200) WHERE char_length(name) > 200;

ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_name_length;
ALTER TABLE classes
  ADD CONSTRAINT classes_name_length CHECK (char_length(name) <= 200);

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification — run separately, after the transaction has committed
-- ---------------------------------------------------------------------------
--
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'classes'::regclass AND contype = 'c'
--   ORDER BY conname;
--   -- expect: classes_name_length
--
--   SELECT count(*) FROM classes WHERE char_length(name) > 200;
--   -- expect: 0
