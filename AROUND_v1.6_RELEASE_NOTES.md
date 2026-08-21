AROUND Product Organization v1.6

- Personal Collections work for guests via localStorage.
- Account mode uses existing Supabase user_collections and user_collection_items tables.
- Guest Collections are designed to merge into the account after auth is restored.
- MY AROUND saved rows can be assigned to a Collection.
- Personal Collection overview: /my-around/collections
- Personal Collection detail: /my-around/collections/[id]
- Mobile Collections nav now points to personal Collections, not editorial Collections.
- Pre-live auth/SMTP checklist added under docs/PRE_LIVE_LAUNCH.md.
- No database migration required.
