import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type TelegramAuthorContext = {
  telegramUserId: number
  telegramChatId: number
  contactName?: string
  contactPhone?: string
}

function telegramEmail(telegramUserId: number): string {
  return `telegram+${telegramUserId}@users.dimarket.app`
}

/** Profile id for in-app messaging; creates auth user + profile on first post. */
export async function ensureTelegramAuthor(
  admin: SupabaseClient,
  ctx: TelegramAuthorContext,
): Promise<string | null> {
  const { telegramUserId, telegramChatId, contactName, contactPhone } = ctx

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle()

  const patch: Record<string, unknown> = {
    telegram_chat_id: telegramChatId,
  }
  if (contactName?.trim()) patch.full_name = contactName.trim()
  if (contactPhone?.trim()) patch.phone = contactPhone.trim()

  if (existing?.id) {
    await admin.from('profiles').update(patch).eq('id', existing.id)
    return existing.id
  }

  const email = telegramEmail(telegramUserId)
  const displayName = contactName?.trim() || 'Клієнт DImarket'

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: displayName,
      user_role: 'client',
      phone: contactPhone?.trim() || '',
      telegram_user_id: telegramUserId,
    },
  })

  let userId = created?.user?.id ?? null

  if (createErr && !userId) {
    const { data: again } = await admin
      .from('profiles')
      .select('id')
      .eq('telegram_user_id', telegramUserId)
      .maybeSingle()
    if (again?.id) {
      await admin.from('profiles').update(patch).eq('id', again.id)
      return again.id
    }
    console.error('ensureTelegramAuthor createUser:', createErr.message)
    return null
  }

  if (!userId) return null

  await admin.from('profiles').update({
    ...patch,
    telegram_user_id: telegramUserId,
  }).eq('id', userId)

  return userId
}
