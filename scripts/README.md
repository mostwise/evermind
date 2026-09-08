# `scripts/` — the 2.x schema files

These are the hand-run SQL files Evermind used through 2.14.5. **They are frozen.** Nothing
new goes in here, and nothing already here gets edited: deployments have run these exact
statements, and an edit would never reach them.

From 3.0.0 the schema is managed by the Supabase CLI in [`supabase/migrations/`](../supabase/migrations/).

| File | What it does | Still needed? |
|---|---|---|
| `001_create_assignments_table.sql` | Creates `assignments`, its indexes and its four RLS policies. | Superseded by the 3.0.0 baseline migration. |
| `002_create_classes_table.sql` | Creates `classes`, its indexes and its four RLS policies. | Superseded by the same baseline. |
| `003_migrate_2_9_0_to_2_14_5.sql` | Upgrades a 2.9.0 database: adds `classes`, repairs the `assignments` policies, narrows the `status` constraint. | **Yes**, if you are coming from 2.9.0 or earlier. Run it before the 3.0.0 migrations. |
| `004_updated_at_trigger.sql` | Hands `updated_at` to the `handle_updated_at` trigger. | Superseded by the same baseline. |

## If you are already running Evermind

The baseline migration reproduces 001 + 002 + 004 and every statement in it is idempotent, so
applying it to a database that already has them changes nothing. What it *does* fix, for a
database created from `001` on a fresh install, is the `status` CHECK constraint: 001 still
permits `'overdue'`, which the code has not recognised since 2.10, and only `003` — the upgrade
path — ever narrowed it.

The CLI tracks what it has applied in `supabase_migrations.schema_migrations`, which a
hand-built database does not have. Tell it the baseline is already in place before pushing
anything after it:

```bash
supabase link --project-ref <your-project-ref>
supabase migration repair --status applied 20260904120000
supabase db push
```

[`docs/self-hosting.md`](../docs/self-hosting.md) has the full upgrade path.
