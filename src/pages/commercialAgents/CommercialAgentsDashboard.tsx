import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { applyPageSeo } from '../../lib/pageSeo'
import { normalizeSpokenLanguageList } from '../../lib/languageDisplay'
import {
  createOpportunity,
  createManufacturerProduct,
  deleteManufacturerProduct,
  fetchApplicationsForManufacturer,
  fetchInvitationsForAgent,
  fetchInvitationsForManufacturer,
  fetchManufacturerProducts,
  fetchMyAgent,
  fetchMyApplicationsAsAgent,
  fetchMyManufacturer,
  fetchOpportunitiesForManufacturer,
  getRecommendedAgents,
  getRecommendedOpportunities,
  fetchAgents,
  fetchOpportunities,
  updateApplicationStatus,
  updateInvitationStatus,
  updateManufacturerProduct,
  upsertAgentProfile,
  upsertManufacturerProfile,
  EMPTY_COMMERCIAL_FILTERS,
  type AgentProfile,
  type ManufacturerProduct,
  type ManufacturerProfile,
} from '../../lib/commercialAgents'
import { COMMERCIAL_FOCUS_COUNTRIES, dimarketParentCategoryOptions } from '../../lib/commercialAgents/categories'
import { AgentCard } from '../../components/commercialAgents/AgentCard'
import { OpportunityCard } from '../../components/commercialAgents/OpportunityCard'

type Tab =
  | 'overview'
  | 'profile'
  | 'products'
  | 'advertising'
  | 'opportunities'
  | 'applications'
  | 'invitations'
  | 'recommended'

const input =
  'w-full rounded-none border border-[rgba(148,163,184,0.35)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2f2a24]'

export function CommercialAgentsDashboard() {
  const { t, user, profile, authReady, language } = useApp()
  const roleHint = useMemo(() => new URLSearchParams(window.location.search).get('role'), [])
  const tabHint = useMemo(() => new URLSearchParams(window.location.search).get('tab') as Tab | null, [])
  const [tab, setTab] = useState<Tab>(
    tabHint &&
      [
        'overview',
        'profile',
        'products',
        'advertising',
        'opportunities',
        'applications',
        'invitations',
        'recommended',
      ].includes(tabHint)
      ? tabHint
      : 'overview',
  )
  const parentCategories = useMemo(() => dimarketParentCategoryOptions(language.code), [language.code])
  const [mode, setMode] = useState<'manufacturer' | 'agent'>(() => {
    if (roleHint === 'agent') return 'agent'
    if (roleHint === 'manufacturer') return 'manufacturer'
    if (profile?.user_role === 'commercial_agent') return 'agent'
    if (profile?.user_role === 'manufacturer') return 'manufacturer'
    return 'manufacturer'
  })
  const [mfr, setMfr] = useState<ManufacturerProfile | null>(null)
  const [agent, setAgent] = useState<AgentProfile | null>(null)
  const [apps, setApps] = useState<unknown[]>([])
  const [invites, setInvites] = useState<unknown[]>([])
  const [opps, setOpps] = useState<Awaited<ReturnType<typeof fetchOpportunitiesForManufacturer>>>([])
  const [products, setProducts] = useState<ManufacturerProduct[]>([])
  const [recommended, setRecommended] = useState<ReactNode>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Profile forms
  const [mfrForm, setMfrForm] = useState({
    company_name: '',
    description: '',
    country: 'Spain',
    website: '',
    categories: '' as string,
    products: '' as string,
    languages: 'EN, ES',
    logo_url: '',
    catalog_url: '',
    public_email: '',
    public_phone: '',
    agent_required: true,
  })
  const [agentForm, setAgentForm] = useState({
    full_name: '',
    company_name: '',
    description: '',
    country: 'Spain',
    city: '',
    years_experience: '',
    categories: '',
    languages: 'EN, ES',
    brands: '',
    website: '',
    public_email: '',
    public_phone: '',
    available_for_new_brands: true,
  })
  const [oppForm, setOppForm] = useState({
    title: '',
    description: '',
    category: 'hvac',
    target_country: 'Spain',
    commission_range: '8–12%',
    exclusive: false,
  })
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: 'construction',
    description: '',
    image_url: '',
  })

  useEffect(() => {
    return applyPageSeo({
      title: `${t('commercialAgents.dashboard')} | DImarket`,
      description: t('commercialAgents.seoDescription'),
      canonicalPath: '/commercial-agents/dashboard',
    })
  }, [t])

  const reload = async () => {
    if (!user) return
    const [m, a] = await Promise.all([fetchMyManufacturer(user.id), fetchMyAgent(user.id)])
    setMfr(m)
    setAgent(a)
    if (m) {
      setMfrForm({
        company_name: m.company_name,
        description: m.description,
        country: m.country || 'Spain',
        website: m.website || '',
        categories: (m.categories || []).join(', '),
        products: (m.products || []).join(', '),
        languages: (m.languages || []).join(', '),
        logo_url: m.logo_url || '',
        catalog_url: m.catalog_url || '',
        public_email: m.public_email || '',
        public_phone: m.public_phone || '',
        agent_required: m.agent_required,
      })
      setOpps(await fetchOpportunitiesForManufacturer(m.id))
      setApps(await fetchApplicationsForManufacturer(m.id))
      setInvites(await fetchInvitationsForManufacturer(m.id))
      setProducts(await fetchManufacturerProducts(m.id))
      const pool = await fetchAgents({ ...EMPTY_COMMERCIAL_FILTERS, availableOnly: true }, 40)
      const rec = getRecommendedAgents(m, pool, 6)
      setRecommended(
        <div className="grid gap-4 md:grid-cols-2">
          {rec.map(({ agent: ag, match }) => (
            <AgentCard key={ag.id} item={ag} t={t} matchScore={match.score} />
          ))}
        </div>,
      )
    } else {
      setProducts([])
    }
    if (a) {
      setAgentForm({
        full_name: a.full_name,
        company_name: a.company_name || '',
        description: a.description,
        country: a.country || 'Spain',
        city: a.city || '',
        years_experience: a.years_experience != null ? String(a.years_experience) : '',
        categories: (a.categories || []).join(', '),
        languages: (a.languages || []).join(', '),
        brands: (a.current_manufacturers || []).join(', '),
        website: a.website || '',
        public_email: a.public_email || '',
        public_phone: a.public_phone || '',
        available_for_new_brands: a.available_for_new_brands,
      })
      setApps(await fetchMyApplicationsAsAgent(a.id))
      setInvites(await fetchInvitationsForAgent(a.id))
      const pool = await fetchOpportunities(EMPTY_COMMERCIAL_FILTERS, 40)
      const rec = getRecommendedOpportunities(a, pool, 6)
      setRecommended(
        <div className="grid gap-4 md:grid-cols-2">
          {rec.map(({ opportunity, match }) => (
            <OpportunityCard key={opportunity.id} item={opportunity} t={t} matchScore={match.score} />
          ))}
        </div>,
      )
    }
  }

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      navigateTo('/login?redirect=/commercial-agents/dashboard')
      return
    }
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id, mode])

  if (!authReady) {
    return <p className="layout-page-gutter py-12 text-sm">{t('commercialAgents.loading')}</p>
  }

  const saveManufacturer = async () => {
    if (!user) return
    setBusy(true)
    const { error } = await upsertManufacturerProfile(user.id, {
      company_name: mfrForm.company_name.trim() || profile?.full_name || 'Manufacturer',
      description: mfrForm.description,
      country: mfrForm.country,
      website: mfrForm.website || null,
      categories: splitCsv(mfrForm.categories),
      products: splitCsv(mfrForm.products),
      languages: normalizeSpokenLanguageList(splitCsv(mfrForm.languages)),
      logo_url: mfrForm.logo_url || null,
      catalog_url: mfrForm.catalog_url || null,
      public_email: mfrForm.public_email || null,
      public_phone: mfrForm.public_phone || null,
      show_public_contacts: Boolean(mfrForm.public_email || mfrForm.public_phone),
      agent_required: mfrForm.agent_required,
      is_published: true,
    })
    setBusy(false)
    setFeedback(error || t('commercialAgents.savedProfile'))
    await reload()
  }

  const saveAgent = async () => {
    if (!user) return
    setBusy(true)
    const { error } = await upsertAgentProfile(user.id, {
      full_name: agentForm.full_name.trim() || profile?.full_name || 'Agent',
      company_name: agentForm.company_name || null,
      description: agentForm.description,
      country: agentForm.country,
      city: agentForm.city || null,
      years_experience: agentForm.years_experience ? Number(agentForm.years_experience) : null,
      categories: splitCsv(agentForm.categories),
      languages: normalizeSpokenLanguageList(splitCsv(agentForm.languages)),
      current_manufacturers: splitCsv(agentForm.brands),
      website: agentForm.website || null,
      public_email: agentForm.public_email || null,
      public_phone: agentForm.public_phone || null,
      show_public_contacts: Boolean(agentForm.public_email || agentForm.public_phone),
      available_for_new_brands: agentForm.available_for_new_brands,
      is_published: true,
    })
    setBusy(false)
    setFeedback(error || t('commercialAgents.savedProfile'))
    await reload()
  }

  const addProduct = async () => {
    if (!mfr) {
      setFeedback(t('commercialAgents.needManufacturerProfile'))
      return
    }
    if (!productForm.name.trim()) {
      setFeedback(t('commercialAgents.productName'))
      return
    }
    setBusy(true)
    const { error } = await createManufacturerProduct(mfr.id, {
      name: productForm.name,
      brand: productForm.brand || mfr.company_name,
      category: productForm.category,
      description: productForm.description,
      image_urls: productForm.image_url ? [productForm.image_url] : [],
      countries_available: mfr.countries_available?.length ? mfr.countries_available : [mfr.country || 'Spain'].filter(Boolean),
      is_published: true,
    })
    setBusy(false)
    setFeedback(error || t('commercialAgents.productSaved'))
    setProductForm({ name: '', brand: '', category: 'construction', description: '', image_url: '' })
    await reload()
  }

  const toggleProductPublish = async (p: ManufacturerProduct) => {
    setBusy(true)
    const { error } = await updateManufacturerProduct(p.id, { is_published: !p.is_published })
    setBusy(false)
    setFeedback(error || t('commercialAgents.productSaved'))
    await reload()
  }

  const removeProduct = async (id: string) => {
    setBusy(true)
    const { error } = await deleteManufacturerProduct(id)
    setBusy(false)
    setFeedback(error || t('commercialAgents.productDeleted'))
    await reload()
  }

  const publishOpp = async () => {
    if (!mfr) {
      setFeedback(t('commercialAgents.needManufacturerProfile'))
      return
    }
    setBusy(true)
    const { error } = await createOpportunity(mfr.id, {
      title: oppForm.title,
      description: oppForm.description,
      category: oppForm.category,
      target_country: oppForm.target_country,
      commission_range: oppForm.commission_range,
      exclusive: oppForm.exclusive,
      status: 'published',
    })
    setBusy(false)
    setFeedback(error || t('commercialAgents.opportunityCreated'))
    setOppForm({ ...oppForm, title: '', description: '' })
    await reload()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('commercialAgents.overview') },
    { id: 'profile', label: t('commercialAgents.myProfile') },
    ...(mode === 'manufacturer'
      ? [
          { id: 'products' as Tab, label: t('commercialAgents.tabProducts') },
          { id: 'opportunities' as Tab, label: t('commercialAgents.myOpportunities') },
          { id: 'applications' as Tab, label: t('commercialAgents.applications') },
        ]
      : [{ id: 'applications' as Tab, label: t('commercialAgents.myApplications') }]),
    { id: 'advertising' as Tab, label: t('commercialAgents.tabAdvertising') },
    { id: 'invitations', label: t('commercialAgents.invitations') },
    { id: 'recommended', label: t('commercialAgents.recommended') },
  ]

  return (
    <div className="page-bg pb-24 lg:pb-12">
      <div className="layout-page-gutter py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--ink-900)] md:text-3xl">
              {t('commercialAgents.dashboard')}
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-600)]">{t('commercialAgents.dashboardSubtitle')}</p>
          </div>
          <div className="inline-flex rounded-full border border-[var(--line-200)] bg-white p-1">
            <button
              type="button"
              onClick={() => setMode('manufacturer')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                mode === 'manufacturer' ? 'bg-[#232f3e] text-white' : 'text-[var(--ink-700)]'
              }`}
            >
              {t('commercialAgents.manufacturer')}
            </button>
            <button
              type="button"
              onClick={() => setMode('agent')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                mode === 'agent' ? 'bg-[#232f3e] text-white' : 'text-[var(--ink-700)]'
              }`}
            >
              {t('commercialAgents.agent')}
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setTab(tabItem.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                tab === tabItem.id
                  ? 'bg-[#ff9900] text-[#2f2a24]'
                  : 'border border-[var(--line-200)] bg-white text-[var(--ink-700)]'
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {feedback ? <p className="mt-4 text-sm text-[var(--ink-700)]">{feedback}</p> : null}

        <div className="mt-6">
          {tab === 'overview' && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat
                label={mode === 'manufacturer' ? t('commercialAgents.myOpportunities') : t('commercialAgents.myApplications')}
                value={mode === 'manufacturer' ? String(opps.length) : String(apps.length)}
              />
              <Stat label={t('commercialAgents.invitations')} value={String(invites.length)} />
              <Stat
                label={t('commercialAgents.profileStatus')}
                value={
                  mode === 'manufacturer'
                    ? mfr
                      ? t('commercialAgents.active')
                      : t('commercialAgents.missing')
                    : agent
                      ? t('commercialAgents.active')
                      : t('commercialAgents.missing')
                }
              />
              <button
                type="button"
                className="btn-primary rounded-full px-5 py-2.5 text-sm sm:col-span-3 sm:w-fit"
                onClick={() => setTab('profile')}
              >
                {t('commercialAgents.editProfile')}
              </button>
            </div>
          )}

          {tab === 'profile' && mode === 'manufacturer' && (
            <div className="max-w-xl space-y-3 rounded-none border border-[var(--line-200)] bg-white/95 p-5">
              <Field label={t('commercialAgents.companyName')} value={mfrForm.company_name} onChange={(v) => setMfrForm({ ...mfrForm, company_name: v })} />
              <Field label={t('commercialAgents.description')} value={mfrForm.description} onChange={(v) => setMfrForm({ ...mfrForm, description: v })} area />
              <label className="block text-xs font-semibold uppercase text-[var(--ink-500)]">
                {t('commercialAgents.country')}
                <select className={`${input} mt-1`} value={mfrForm.country} onChange={(e) => setMfrForm({ ...mfrForm, country: e.target.value })}>
                  {COMMERCIAL_FOCUS_COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <Field label={t('commercialAgents.website')} value={mfrForm.website} onChange={(v) => setMfrForm({ ...mfrForm, website: v })} />
              <Field label="Logo URL" value={mfrForm.logo_url} onChange={(v) => setMfrForm({ ...mfrForm, logo_url: v })} />
              <Field label="Catalog URL" value={mfrForm.catalog_url} onChange={(v) => setMfrForm({ ...mfrForm, catalog_url: v })} />
              <Field label="Email" value={mfrForm.public_email} onChange={(v) => setMfrForm({ ...mfrForm, public_email: v })} />
              <Field label="Phone" value={mfrForm.public_phone} onChange={(v) => setMfrForm({ ...mfrForm, public_phone: v })} />
              <Field label={t('commercialAgents.categoriesHint')} value={mfrForm.categories} onChange={(v) => setMfrForm({ ...mfrForm, categories: v })} />
              <Field label="Product tags (comma)" value={mfrForm.products} onChange={(v) => setMfrForm({ ...mfrForm, products: v })} />
              <Field label={t('commercialAgents.languages')} value={mfrForm.languages} onChange={(v) => setMfrForm({ ...mfrForm, languages: v })} />
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={mfrForm.agent_required} onChange={(e) => setMfrForm({ ...mfrForm, agent_required: e.target.checked })} />
                {t('commercialAgents.seekingAgents')}
              </label>
              <button type="button" disabled={busy} onClick={saveManufacturer} className="btn-primary rounded-full px-5 py-2.5 text-sm">
                {t('commercialAgents.save')}
              </button>
              {mfr ? (
                <button type="button" className="ml-2 text-sm font-semibold text-[#c45500]" onClick={() => navigateTo(`/commercial-agents/manufacturers/${mfr.slug}`)}>
                  {t('commercialAgents.viewPublic')}
                </button>
              ) : null}
            </div>
          )}

          {tab === 'profile' && mode === 'agent' && (
            <div className="max-w-xl space-y-3 rounded-none border border-[var(--line-200)] bg-white/95 p-5">
              <Field label={t('commercialAgents.fullName')} value={agentForm.full_name} onChange={(v) => setAgentForm({ ...agentForm, full_name: v })} />
              <Field label={t('commercialAgents.companyName')} value={agentForm.company_name} onChange={(v) => setAgentForm({ ...agentForm, company_name: v })} />
              <Field label={t('commercialAgents.description')} value={agentForm.description} onChange={(v) => setAgentForm({ ...agentForm, description: v })} area />
              <Field label={t('commercialAgents.city')} value={agentForm.city} onChange={(v) => setAgentForm({ ...agentForm, city: v })} />
              <label className="block text-xs font-semibold uppercase text-[var(--ink-500)]">
                {t('commercialAgents.country')}
                <select className={`${input} mt-1`} value={agentForm.country} onChange={(e) => setAgentForm({ ...agentForm, country: e.target.value })}>
                  {COMMERCIAL_FOCUS_COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <Field label={t('commercialAgents.experience')} value={agentForm.years_experience} onChange={(v) => setAgentForm({ ...agentForm, years_experience: v })} />
              <Field label={t('commercialAgents.categoriesHint')} value={agentForm.categories} onChange={(v) => setAgentForm({ ...agentForm, categories: v })} />
              <Field label={t('commercialAgents.brandsRepresented')} value={agentForm.brands} onChange={(v) => setAgentForm({ ...agentForm, brands: v })} />
              <p className="text-xs text-[var(--ink-500)]">{t('commercialAgents.brandsHint')}</p>
              <Field label={t('commercialAgents.languages')} value={agentForm.languages} onChange={(v) => setAgentForm({ ...agentForm, languages: v })} />
              <Field label={t('commercialAgents.website')} value={agentForm.website} onChange={(v) => setAgentForm({ ...agentForm, website: v })} />
              <Field label="Email" value={agentForm.public_email} onChange={(v) => setAgentForm({ ...agentForm, public_email: v })} />
              <Field label="Phone" value={agentForm.public_phone} onChange={(v) => setAgentForm({ ...agentForm, public_phone: v })} />
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={agentForm.available_for_new_brands} onChange={(e) => setAgentForm({ ...agentForm, available_for_new_brands: e.target.checked })} />
                {t('commercialAgents.availableForBrands')}
              </label>
              <button type="button" disabled={busy} onClick={saveAgent} className="btn-primary rounded-full px-5 py-2.5 text-sm">
                {t('commercialAgents.save')}
              </button>
              {agent ? (
                <button type="button" className="ml-2 text-sm font-semibold text-[#c45500]" onClick={() => navigateTo(`/commercial-agents/representatives/${agent.slug}`)}>
                  {t('commercialAgents.viewPublic')}
                </button>
              ) : null}
            </div>
          )}

          {tab === 'products' && mode === 'manufacturer' && (
            <div className="space-y-6">
              <div className="max-w-xl space-y-3 rounded-none border border-[var(--line-200)] bg-white/95 p-5">
                <h2 className="text-lg font-bold">{t('commercialAgents.addProduct')}</h2>
                <p className="text-sm text-[var(--ink-600)]">{t('commercialAgents.productsHint')}</p>
                <Field label={t('commercialAgents.productName')} value={productForm.name} onChange={(v) => setProductForm({ ...productForm, name: v })} />
                <Field label={t('commercialAgents.productBrand')} value={productForm.brand} onChange={(v) => setProductForm({ ...productForm, brand: v })} />
                <label className="block text-xs font-semibold uppercase text-[var(--ink-500)]">
                  {t('commercialAgents.productCategory')}
                  <select className={`${input} mt-1`} value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                    {parentCategories.map((opt) => (
                      <option key={opt.slug} value={opt.slug}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <Field label={t('commercialAgents.description')} value={productForm.description} onChange={(v) => setProductForm({ ...productForm, description: v })} area />
                <Field label="Image URL" value={productForm.image_url} onChange={(v) => setProductForm({ ...productForm, image_url: v })} />
                <button type="button" disabled={busy} onClick={addProduct} className="btn-primary rounded-full px-5 py-2.5 text-sm">
                  {t('commercialAgents.addProduct')}
                </button>
              </div>
              <div className="space-y-3">
                {products.length === 0 ? (
                  <p className="text-sm text-[var(--ink-600)]">{t('commercialAgents.productsHint')}</p>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-[var(--line-200)] bg-white/95 p-4">
                      <div>
                        <p className="font-bold text-[var(--ink-900)]">{p.name}</p>
                        <p className="text-xs text-[var(--ink-600)]">
                          {[p.brand, p.category, p.is_published ? 'published' : 'draft'].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary rounded-full px-3 py-1.5 text-xs" disabled={busy} onClick={() => void toggleProductPublish(p)}>
                          {p.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button type="button" className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700" disabled={busy} onClick={() => void removeProduct(p.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'advertising' && (
            <div className="max-w-xl space-y-3 rounded-none border border-[var(--line-200)] bg-white/95 p-5">
              <h2 className="text-lg font-bold">{t('commercialAgents.tabAdvertising')}</h2>
              <p className="text-sm text-[var(--ink-600)]">{t('commercialAgents.adsLinkedHint')}</p>
              <button
                type="button"
                className="btn-primary rounded-full px-5 py-2.5 text-sm"
                onClick={() => {
                  const cats =
                    mode === 'manufacturer'
                      ? (mfr?.categories || []).join(',')
                      : (agent?.categories || []).join(',')
                  const brand =
                    mode === 'manufacturer'
                      ? mfr?.company_name || ''
                      : (agent?.current_manufacturers || [])[0] || agent?.full_name || ''
                  const q = new URLSearchParams()
                  if (cats) q.set('categories', cats)
                  if (brand) q.set('brand', brand)
                  q.set('from', mode === 'manufacturer' ? 'manufacturer' : 'agent')
                  navigateTo(`/advertising?${q.toString()}`)
                }}
              >
                {t('commercialAgents.openAdvertising')}
              </button>
            </div>
          )}

          {tab === 'opportunities' && mode === 'manufacturer' && (
            <div className="space-y-6">
              <div className="max-w-xl space-y-3 rounded-none border border-[var(--line-200)] bg-white/95 p-5">
                <h2 className="text-lg font-bold">{t('commercialAgents.createOpportunity')}</h2>
                <Field label={t('commercialAgents.oppTitle')} value={oppForm.title} onChange={(v) => setOppForm({ ...oppForm, title: v })} />
                <Field label={t('commercialAgents.description')} value={oppForm.description} onChange={(v) => setOppForm({ ...oppForm, description: v })} area />
                <label className="block text-xs font-semibold uppercase text-[var(--ink-500)]">
                  {t('commercialAgents.category')}
                  <select className={`${input} mt-1`} value={oppForm.category} onChange={(e) => setOppForm({ ...oppForm, category: e.target.value })}>
                    {parentCategories.map((opt) => (
                      <option key={opt.slug} value={opt.slug}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase text-[var(--ink-500)]">
                  {t('commercialAgents.country')}
                  <select className={`${input} mt-1`} value={oppForm.target_country} onChange={(e) => setOppForm({ ...oppForm, target_country: e.target.value })}>
                    {COMMERCIAL_FOCUS_COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <Field label={t('commercialAgents.commission')} value={oppForm.commission_range} onChange={(v) => setOppForm({ ...oppForm, commission_range: v })} />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={oppForm.exclusive} onChange={(e) => setOppForm({ ...oppForm, exclusive: e.target.checked })} />
                  {t('commercialAgents.exclusive')}
                </label>
                <button type="button" disabled={busy} onClick={publishOpp} className="btn-primary rounded-full px-5 py-2.5 text-sm">
                  {t('commercialAgents.publish')}
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {opps.map((o) => (
                  <OpportunityCard key={o.id} item={o} t={t} />
                ))}
              </div>
            </div>
          )}

          {tab === 'applications' && (
            <div className="space-y-3">
              {apps.length === 0 ? (
                <p className="text-sm text-[var(--ink-600)]">{t('commercialAgents.emptyApplications')}</p>
              ) : (
                apps.map((raw) => {
                  const app = raw as {
                    id: string
                    status: string
                    message: string
                    agent?: { full_name?: string; slug?: string }
                    opportunity?: { title?: string; id?: string }
                  }
                  return (
                    <div key={app.id} className="rounded-none border border-[var(--line-200)] bg-white p-4">
                      <p className="font-semibold text-[var(--ink-900)]">
                        {mode === 'manufacturer'
                          ? app.agent?.full_name || 'Agent'
                          : app.opportunity?.title || 'Opportunity'}
                      </p>
                      <p className="mt-1 text-sm text-[var(--ink-600)]">{app.message}</p>
                      <p className="mt-2 text-xs font-semibold uppercase text-[var(--ink-500)]">{app.status}</p>
                      {mode === 'manufacturer' ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" className="rounded-full bg-[#248a3d] px-3 py-1 text-xs font-bold text-white" onClick={() => void updateApplicationStatus(app.id, 'accepted').then(reload)}>
                            {t('commercialAgents.accept')}
                          </button>
                          <button type="button" className="rounded-full bg-[#e7e9ec] px-3 py-1 text-xs font-bold" onClick={() => void updateApplicationStatus(app.id, 'rejected').then(reload)}>
                            {t('commercialAgents.reject')}
                          </button>
                          <button type="button" className="rounded-full border px-3 py-1 text-xs font-bold" onClick={() => void updateApplicationStatus(app.id, 'shortlisted').then(reload)}>
                            {t('commercialAgents.shortlist')}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {tab === 'invitations' && (
            <div className="space-y-3">
              {invites.length === 0 ? (
                <p className="text-sm text-[var(--ink-600)]">{t('commercialAgents.emptyInvitations')}</p>
              ) : (
                invites.map((raw) => {
                  const inv = raw as {
                    id: string
                    status: string
                    message: string
                    manufacturer?: { company_name?: string; profile_id?: string }
                    agent?: { full_name?: string }
                  }
                  return (
                    <div key={inv.id} className="rounded-none border border-[var(--line-200)] bg-white p-4">
                      <p className="font-semibold">
                        {mode === 'agent' ? inv.manufacturer?.company_name : inv.agent?.full_name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--ink-600)]">{inv.message}</p>
                      <p className="mt-2 text-xs font-semibold uppercase text-[var(--ink-500)]">{inv.status}</p>
                      {mode === 'agent' && inv.status === 'pending' ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            className="rounded-full bg-[#248a3d] px-3 py-1 text-xs font-bold text-white"
                            onClick={() =>
                              void updateInvitationStatus(inv.id, 'accepted', inv.manufacturer?.profile_id).then(reload)
                            }
                          >
                            {t('commercialAgents.accept')}
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-[#e7e9ec] px-3 py-1 text-xs font-bold"
                            onClick={() =>
                              void updateInvitationStatus(inv.id, 'declined', inv.manufacturer?.profile_id).then(reload)
                            }
                          >
                            {t('commercialAgents.reject')}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {tab === 'recommended' && (
            <div>
              <p className="mb-4 text-sm text-[var(--ink-600)]">{t('commercialAgents.recommendedHint')}</p>
              {recommended || <p className="text-sm text-[var(--ink-600)]">{t('commercialAgents.emptyResults')}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function splitCsv(s: string) {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function Field({
  label,
  value,
  onChange,
  area,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  area?: boolean
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
      {label}
      {area ? (
        <textarea className={`${input} mt-1`} rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={`${input} mt-1`} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-none border border-[var(--line-200)] bg-white/95 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-[var(--ink-900)]">{value}</p>
    </div>
  )
}
