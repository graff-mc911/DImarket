# Poland directory avatars

Generated: 2026-08-05T05:34:23.943Z

- Avatars uploaded: **15**
- Profile rows patched via claim sign-in: **15**
- Client fallback map updated in `src/lib/directoryAvatars.ts`

Original DImarket-generated initials art only (no scraped logos/photos).

## Apply DB backfill (optional)

```bash
# After migration applied:
curl -X POST "$SUPABASE_URL/rest/v1/rpc/backfill_poland_directory_avatars" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'
```
