import { useEffect } from 'react'
import { CabinetCategoryBrowser } from '../components/CabinetCategoryBrowser'
import { PageContentAds } from '../components/CenterPageAd'
import { useApp } from '../contexts/AppContext'
import { applyPageSeo } from '../lib/pageSeo'

export function Categories() {
  const { t } = useApp()

  useEffect(() => {
    return applyPageSeo({
      title: `${t('header.categories')} | DImarket`,
      description: t('catPage.seoDescription').replace('{category}', t('header.categories')),
      canonicalPath: '/categories',
    })
  }, [t])

  return (
    <>
      <div className="layout-page-gutter">
        <PageContentAds page="categories" outerClassName="mt-3 mb-1" />
      </div>
      <CabinetCategoryBrowser mode="categories" />
    </>
  )
}
