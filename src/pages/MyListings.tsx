import { useEffect, useState } from 'react'
import { PlusCircle, FileText, Globe, Eye, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'

interface MyListing {
  id: string
  title: string
  description: string
  status: 'active' | 'expired' | 'sold' | 'deleted'
  listing_type: string
  price: number | null
  currency: string
  location: string
  visibility_radius: string
  views_count: number
  expires_at: string
  created_at: string
  is_premium: boolean
}

const btnPrimary = 'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 transition-all duration-300'
const btnPrimaryFull = 'inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 transition-all'

export function MyListings() {
  const { user, currency, t } = useApp()
  const [listings, setListings] = useState<MyListing[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'expired' | 'sold' | 'deleted'>('')

  useEffect(() => {
    if (user) {
      loadMyListings()
    } else {
      window.location.href = '/login'
    }
  }, [user, statusFilter])

  const loadMyListings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('listings')
        .select('id, title, description, status, listing_type, price, currency, location, visibility_radius, views_count, expires_at, created_at, is_premium')
        .eq('author_id', user!.id)
        .order('created_at', { ascending: false })
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      const { data, error } = await query
      if (error) throw error
      if (data) setListings(data as MyListing[])
    } catch (err) {
      console.error('Помилка:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsSold = async (id: string) => {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', id)
    loadMyListings()
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Видалити оголошення?')) return
    await supabase.from('listings').update({ status: 'deleted' }).eq('id', id)
    loadMyListings()
  }

  const formatPrice = (price: number | null) => {
    if (!price) return t('listing.contactForPrice')
    return currency.symbol + price.toLocaleString()
  }

  const getVisibilityLabel = (radius: string) => {
    const labels: Record<string, string> = {
      city: t('visibility.city'),
      district: t('visibility.district'),
      region: t('visibility.region'),
      country: t('visibility.country'),
      state: t('visibility.state'),
      land: t('visibility.land'),
      global: t('visibility.global'),
    }
    return labels[radius] || radius
  }

  type Badge = { icon: React.ReactNode; label: string; cls: string }

  const getStatusBadge = (status: string): Badge => {
    if (status === 'active') return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: t('myListings.status.active'), cls: 'bg-green-100 text-green-700' }
    if (status === 'expired') return { icon: <Clock className="w-3.5 h-3.5" />, label: t('myListings.status.expired'), cls: 'bg-yellow-100 text-yellow-700' }
    if (status === 'sold') return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: t('myListings.status.sold'), cls: 'bg-blue-100 text-blue-700' }
    if (status === 'deleted') return { icon: <XCircle className="w-3.5 h-3.5" />, label: t('myListings.status.deleted'), cls: 'bg-red-100 text-red-700' }
    return { icon: null, label: status, cls: 'bg-gray-100 text-gray-600' }
  }

  const getDaysLeft = (expiresAt: string) => {
    return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }

  const statusFilters: Array<{ value: '' | 'active' | 'expired' | 'sold' | 'deleted'; label: string }> = [
    { value: '', label: 'Всі' },
    { value: 'active', label: t('myListings.status.active') },
    { value: 'expired', label: t('myListings.status.expired') },
    { value: 'sold', label: t('myListings.status.sold') },
  ]

  return (
    <div className="py-8 pb-24 lg:pb-8">
          <div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('myListings.title')}</h1>
                <p className="text-gray-500 text-sm mt-0.5">{t('myListings.subtitle')}</p>
              </div>
              <a href="/create-ad" className={btnPrimary}>
                <PlusCircle className="w-4 h-4" />
                {t('myListings.createNew')}
              </a>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={statusFilter === f.value
                    ? 'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-blue-900 text-white shadow-sm'
                    : 'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading && (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-gray-400 text-sm">{t('myListings.loading')}</p>
              </div>
            )}

            {!loading && listings.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                <FileText className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">{t('myListings.noListings')}</p>
                <a href="/create-ad" className={btnPrimaryFull}>
                  <PlusCircle className="w-4 h-4" />
                  {t('myListings.createNew')}
                </a>
              </div>
            )}

            {!loading && listings.length > 0 && (
              <div className="space-y-3">
                {listings.map((listing) => {
                  const badge = getStatusBadge(listing.status)
                  const daysLeft = getDaysLeft(listing.expires_at)
                  const cardClass = listing.is_premium
                    ? 'bg-white rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'
                    : 'bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'

                  return (
                    <div key={listing.id} className={cardClass}>
                      {listing.is_premium && (
                        <div className="h-1 bg-orange-400" />
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                              <span className={'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ' + badge.cls}>
                                {badge.icon}
                                {badge.label}
                              </span>
                              {listing.is_premium && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                                  Premium
                                </span>
                              )}
                            </div>

                            <p className="text-gray-500 text-sm line-clamp-1 mb-2">{listing.description}</p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                              <span className="font-medium text-gray-700">{formatPrice(listing.price)}</span>
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {getVisibilityLabel(listing.visibility_radius)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {listing.views_count}
                              </span>
                              {listing.status === 'active' && (
                                <span className={daysLeft < 3 ? 'flex items-center gap-1 text-red-500' : 'flex items-center gap-1'}>
                                  <Clock className="w-3 h-3" />
                                  {daysLeft} {t('listing.daysLeft')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <a
                              href={'/listing/' + listing.id}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 text-xs font-medium transition text-center"
                            >
                              Переглянути
                            </a>
                            {listing.status === 'active' && (
                              <button
                                onClick={() => markAsSold(listing.id)}
                                className="px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 text-xs font-medium transition"
                              >
                                Продано
                              </button>
                            )}
                            {(listing.status === 'active' || listing.status === 'expired') && (
                              <button
                                onClick={() => deleteListing(listing.id)}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium transition flex items-center gap-1 justify-center"
                              >
                                <Trash2 className="w-3 h-3" />
                                Видалити
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
    </div>
  )
}
