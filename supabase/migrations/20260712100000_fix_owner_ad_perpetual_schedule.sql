/*
  Виправлення бага: порожнє «Кінець показу» зберігалось як starts_at + 90 днів.
  Кампанії owner_managed з таким автоматичним терміном, що вже минув,
  повертаємо до безстрокового показу (ends_at = NULL).
*/

UPDATE ad_campaigns
SET
  ends_at = NULL,
  updated_at = now()
WHERE (review_note LIKE 'owner_managed%')
  AND status = 'active'
  AND ends_at IS NOT NULL
  AND ends_at < now()
  AND starts_at IS NOT NULL
  AND abs(extract(epoch FROM (ends_at - starts_at)) - (90 * 86400)) < 300;
