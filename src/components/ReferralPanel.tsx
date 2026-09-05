import { useEffect, useState } from 'react'
import { Check, Copy, Gift, Users } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  buildReferralLink,
  ensureReferralCode,
  fetchReferralStats,
  referralBoostDays,
} from '../lib/referrals'

interface ReferralPanelProps {
  userId: string
  role: 'professional' | 'company'
}

export function ReferralPanel({ userId, role }: ReferralPanelProps) {
  const { t } = useApp()
  const [code, setCode] = useState<string | null>(null)
  const [inviteCount, setInviteCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadReferral()
  }, [userId, role])

  const loadReferral = async () => {
    setLoading(true)
    try {
      const ensured = await ensureReferralCode(userId)
      const stats = await fetchReferralStats(userId)
      setCode(ensured ?? stats.code)
      setInviteCount(stats.inviteCount)
    } finally {
      setLoading(false)
    }
  }

  const link = code ? buildReferralLink(code, role) : ''

  const copyLink = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (loading) return null

  return (
    <section className="mb-6 rounded-none border border-[rgba(199,138,96,0.28)] bg-[rgba(255,248,241,0.55)] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-[rgba(199,138,96,0.16)] text-[var(--accent-700)]">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-[var(--ink-900)]">
            {t('referral.title')}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--ink-600)]">
            {t('referral.description').replace('{days}', String(referralBoostDays()))}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--ink-700)]">
        <Users className="h-4 w-4 text-[var(--accent-600)]" />
        <span>
          {inviteCount} {t('referral.invites')}
        </span>
      </div>

      {code && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={link}
            className="input-glass min-w-0 flex-1 text-sm"
          />
          <button
            type="button"
            onClick={() => void copyLink()}
            className="btn-secondary inline-flex items-center justify-center gap-2 rounded-full"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? t('referral.copied') : t('referral.copy')}</span>
          </button>
        </div>
      )}
    </section>
  )
}
