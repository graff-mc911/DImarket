import {
  BadgeCheck,
  Building2,
  Crown,
  ExternalLink,
  Globe2,
  MapPin,
  Phone,
  Star,
  Users,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { companyCategoryLabel } from '../../lib/companies/categories'
import { companyCountryFlag } from '../../lib/companies/companies'
import { formatOpeningHoursSummary, isCompanyOpenNow } from '../../lib/companies/hours'
import type { Company } from '../../lib/companies/types'
import { navigateTo } from '../../lib/navigation'

type Props = {
  company: Company
}

export function CompanyCard({ company }: Props) {
  const { t } = useApp()
  const flag = companyCountryFlag(company.country_code)
  const open = isCompanyOpenNow(company.opening_hours)
  const href = `/companies/${company.slug}`

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-[#e8e8ed] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => navigateTo(href)}
        className="relative block h-28 w-full overflow-hidden bg-[#f5f5f7] text-left"
        aria-label={`${company.name} — ${t('companiesDir.viewCompany')}`}
      >
        {company.cover_url ? (
          <img
            src={company.cover_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#d2d2d7]">
            <Building2 className="h-10 w-10" aria-hidden />
          </div>
        )}
        {open ? (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {t('companiesDir.openNow')}
          </span>
        ) : null}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex gap-3">
          <div className="-mt-10 h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-[#f5f5f7] shadow-sm">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-sm font-bold text-[#1d1d1f]">
                {company.name.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-[15px] font-bold text-[#1d1d1f]">{company.name}</h3>
              {company.is_verified ? (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
                  title={t('companiesDir.verified')}
                >
                  <BadgeCheck className="h-3 w-3" aria-hidden />
                  {t('companiesDir.verified')}
                </span>
              ) : null}
              {company.is_premium ? (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-[#fff4e5] px-1.5 py-0.5 text-[10px] font-semibold text-[#b86a00]"
                  title={t('companiesDir.premium')}
                >
                  <Crown className="h-3 w-3" aria-hidden />
                  {t('companiesDir.premium')}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[12px] text-[#6e6e73]">
              {companyCategoryLabel(company.category_slug, t)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6e6e73]">
          <span className="inline-flex items-center gap-1 font-semibold text-[#1d1d1f]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {company.rating.toFixed(1)}
            <span className="font-normal text-[#86868b]">
              ({company.reviews_count} {t('companiesDir.reviews')})
            </span>
          </span>
          <span>
            {company.completed_projects} {t('companiesDir.projects')}
          </span>
          {company.employees_count != null ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden />
              {company.employees_count}
            </span>
          ) : null}
          {company.founded_year ? (
            <span>
              {t('companiesDir.founded')} {company.founded_year}
            </span>
          ) : null}
        </div>

        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#3a3a3c]">
          {company.short_description || t('companiesDir.noDescription')}
        </p>

        <div className="mt-2 space-y-1 text-[12px] text-[#6e6e73]">
          <p className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {flag ? <span aria-hidden>{flag}</span> : null}
            {[company.city, company.country_name].filter(Boolean).join(', ') || '—'}
          </p>
          {company.languages.length ? (
            <p className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {company.languages.map((l) => l.toUpperCase()).join(', ')}
            </p>
          ) : null}
          {company.phone ? (
            <p className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <a href={`tel:${company.phone}`} className="amazon-link hover:underline">
                {company.phone}
              </a>
            </p>
          ) : null}
          {company.website ? (
            <p className="inline-flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="amazon-link truncate hover:underline"
              >
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            </p>
          ) : null}
          <p className="text-[11px] text-[#86868b]">
            {formatOpeningHoursSummary(company.opening_hours, t)}
          </p>
        </div>

        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={() => navigateTo(href)}
            className="btn-primary w-full text-sm"
          >
            {t('companiesDir.viewCompany')}
          </button>
        </div>
      </div>
    </article>
  )
}
