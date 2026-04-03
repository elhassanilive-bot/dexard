# SQL scripts dedicated to video platform only

Run order in Supabase SQL editor:
1) 00_extensions.sql
2) 01_core_schema.sql
3) 02_triggers_and_functions.sql
4) 03_rls_policies.sql
5) 04_storage.sql

Or run all with psql using 99_run_all.sql.

These files are dedicated to:
- auth-linked profiles
- video publishing
- comments, likes/dislikes, subscriptions
- storage buckets and policies for videos/thumbnails