import { useEffect } from 'react'
import { CategoriesMegaMenu } from '../components/CategoriesMegaMenu'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
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
    <CategoriesMegaMenu
      open
      variant="page"
      onClose={() => undefined}
      onNavigate={navigateTo}
    />
  )
}
