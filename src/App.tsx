// ============================================================
// App.tsx — Кореневий компонент додатку DImarket
// Відповідає за маршрутизацію між усіма сторінками.
// ============================================================

import { useEffect, useLayoutEffect, useState } from 'react'
import { AppProvider }         from './contexts/AppContext'
import { PaidAdsProvider }     from './contexts/PaidAdsContext'
import { Header }              from './components/Header'
import { Footer }              from './components/Footer'
import { PageWithSideAds } from './components/PageWithSideAds'
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
import { SeoMarketLanding } from './pages/SeoMarketLanding'
import { isSeoLocale } from './lib/seoRoutes'
import { CreateProject } from './pages/CreateProject'
import { ProjectMatches } from './pages/ProjectMatches'
import { ProjectFeed } from './pages/ProjectFeed'
import { QuoteBuilder } from './pages/QuoteBuilder'
import { MyProjects } from './pages/MyProjects'
import { ProDashboard } from './pages/ProDashboard'
import { ProCalendar } from './pages/ProCalendar'
import { BookProfessional } from './pages/BookProfessional'
import { CustomerDashboard } from './pages/CustomerDashboard'
import { CostEstimator } from './pages/CostEstimator'
import { Notifications } from './pages/Notifications'

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
    if (parts[0] === 'book' && parts[1]) return <BookProfessional profileId={parts[1]} />
    if (parts[0] === 'project' && parts[1] === 'new') return <CreateProject />
    if (parts[0] === 'create-project') return <CreateProject />
    if (parts[0] === 'project' && parts[1] && parts[2] === 'matches') {
      return <ProjectMatches listingId={parts[1]} />
    }
    if (parts[0] === 'leads' && parts[1] && parts[2] === 'quote') {
      return <QuoteBuilder applicationId={parts[1]} />
    }

    // SEO: /de/darmstadt/elektriker
    if (
      parts.length === 3 &&
      isSeoLocale(parts[0])
    ) {
      return <SeoMarketLanding parts={parts} />
    }

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
      case '/pro/dashboard':
      case '/pro':           return <ProDashboard />
      case '/pro/calendar':
      case '/calendar':      return <ProCalendar />
      case '/customer/dashboard':
      case '/customer':
      case '/my':            return <CustomerDashboard />
      case '/cost-estimator':
      case '/estimate':      return <CostEstimator />
      case '/settings':      return <Settings />
      case '/notifications': return <Notifications />
      case '/profile':       return <Profile />
      case '/my-listings':   return <MyListings />
      case '/messages':      return <Messages />
      case '/favorites':     return <Favorites />
      case '/create-ad':     return <CreateAd />
      case '/create-project':
      case '/project/new':   return <CreateProject />
      case '/my-projects':   return <MyProjects />
      case '/projects':
      case '/leads':         return <ProjectFeed />
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

  return (
    <AppProvider>
      <PaidAdsProvider>
        <div className="app-shell min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <PageWithSideAds>{getPage()}</PageWithSideAds>
          </main>
          <Footer />
          {path.startsWith('/admin') && <AiChatWidget />}
        </div>
      </PaidAdsProvider>
    </AppProvider>
  )
}

export default App