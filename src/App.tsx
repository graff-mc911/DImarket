// ============================================================
// App.tsx — Кореневий компонент додатку DImarket
// Відповідає за маршрутизацію між усіма сторінками.
// ============================================================

import { useEffect, useLayoutEffect, useState } from 'react'
import { AppProvider }         from './contexts/AppContext'
import { PaidAdsProvider }     from './contexts/PaidAdsContext'
import { Header }              from './components/Header'
import { Footer }              from './components/Footer'
import { PageWithSideAds, pathUsesSideAdRails } from './components/PageWithSideAds'
import { SideAdRailsLayout } from './components/SideAdRails'
import { bindPathListener }    from './lib/navigation'

// --- Публічні сторінки ---
import { Home }               from './pages/Home'
import { Professionals }      from './pages/Professionals'
import { Companies }          from './pages/Companies'
import { Listings }           from './pages/Listings'
import { ListingDetail }      from './pages/ListingDetail'
import { ProfessionalDetail } from './pages/ProfessionalDetail'
import { Contact }            from './pages/Contact'
import { Advertising }        from './pages/Advertising'

// --- Авторизація ---
import { Login }    from './pages/Login'
import { Register } from './pages/Register'
import { AuthCallback } from './pages/AuthCallback'

// --- Приватні сторінки ---
import { Dashboard }    from './pages/Dashboard'
import { Settings }     from './pages/Settings'
import { Profile }      from './pages/Profile'
import { MyListings }   from './pages/MyListings'
import { Messages }     from './pages/Messages'
import { Favorites }    from './pages/Favorites'
import { CreateAd }       from './pages/CreateAd'
import { JobRequestChat } from './pages/JobRequestChat'
import { AiAdmin } from './pages/AiAdmin'
import { MarketingAgentAdmin } from './pages/MarketingAgentAdmin'
import { AiChatWidget } from './components/ai/AiChatWidget'
import { Checkout }     from './pages/Checkout'
import { BoostProfile } from './pages/BoostProfile'
import { Verification } from './pages/Verification'
import { ForProfessionals } from './pages/ForProfessionals'
import { ForCompanies }     from './pages/ForCompanies'
import { ForAdvertisers }   from './pages/ForAdvertisers'

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useLayoutEffect(() => {
    const syncPath = () => setPath(window.location.pathname)
    bindPathListener(syncPath)
    return () => bindPathListener(null)
  }, [])

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const getPage = () => {
    const parts = path.split('/').filter(Boolean)

    // Динамічні маршрути
    if (parts[0] === 'listing'      && parts[1]) return <ListingDetail listingId={parts[1]} />
    if (parts[0] === 'professional' && parts[1]) return <ProfessionalDetail profileId={parts[1]} />

    switch (path) {
      case '/':              return <Home />
      case '/professionals': return <Professionals />
      case '/companies':     return <Companies />
      case '/listings':      return <Listings />
      case '/vacancies':     return <Listings fixedCategorySlug="vacancies" />
      case '/sell-rent':     return <Listings fixedCategorySlug="sell-rent" />
      case '/contact':       return <Contact />
      case '/advertise':
      case '/advertising':   return <Advertising />
      case '/login':         return <Login />
      case '/register':      return <Register />
      case '/auth/callback': return <AuthCallback />
      case '/dashboard':     return <Dashboard />
      case '/settings':      return <Settings />
      case '/profile':       return <Profile />
      case '/my-listings':   return <MyListings />
      case '/messages':      return <Messages />
      case '/favorites':     return <Favorites />
      case '/create-ad':     return <CreateAd />
      case '/assistant/job': return <JobRequestChat />
      case '/admin/ai':        return <AiAdmin />
      case '/admin/marketing-agent': return <MarketingAgentAdmin />
      case '/checkout':      return <Checkout />      // 🆕 Після оплати Stripe
      case '/boost':         return <BoostProfile />  // 🆕 Просування профілю
      case '/for-professionals': return <ForProfessionals />
      case '/for-companies':     return <ForCompanies />
      case '/for-advertisers':   return <ForAdvertisers />
      case '/verification':  return <Verification />
      default:               return <Home />
    }
  }

  const showSideAds = pathUsesSideAdRails(path)

  return (
    <AppProvider>
      <PaidAdsProvider>
        <div className="app-shell min-h-screen flex flex-col">
          <Header />
          {showSideAds ? (
            <SideAdRailsLayout>
              <main className="min-w-0 flex-1">
                <PageWithSideAds inSideAdsGrid>{getPage()}</PageWithSideAds>
              </main>
              <Footer />
            </SideAdRailsLayout>
          ) : (
            <>
              <main className="flex-1">
                <PageWithSideAds>{getPage()}</PageWithSideAds>
              </main>
              <Footer />
            </>
          )}
          <AiChatWidget />
        </div>
      </PaidAdsProvider>
    </AppProvider>
  )
}

export default App