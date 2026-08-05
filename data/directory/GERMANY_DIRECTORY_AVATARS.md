# Germany directory avatars

Generated: 2026-08-05T05:26:40.079Z

- Avatars uploaded: **31**
- Profile rows patched via claim sign-in: **24**
- Client fallback map updated in `src/lib/directoryAvatars.ts`

Original DImarket-generated initials art only (no scraped logos/photos).

## Apply DB backfill (optional)

```bash
# After migration applied:
curl -X POST "$SUPABASE_URL/rest/v1/rpc/backfill_germany_directory_avatars" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'
```
