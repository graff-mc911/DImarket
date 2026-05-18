// ============================================================
// App.tsx — Кореневий компонент додатку DImarket
// Відповідає за маршрутизацію між усіма сторінками.
// ============================================================

import { useEffect, useState } from 'react'
import { AppProvider }         from './contexts/AppContext'
import { Header }              from './components/Header'
import { Footer }              from './components/Footer'

// --- Публічні сторінки ---
import { Home }               from './pages/Home'
import { Professionals }      from './pages/Professionals'
import { Listings }           from './pages/Listings'
import { ListingDetail }      from './pages/ListingDetail'
import { ProfessionalDetail } from './pages/ProfessionalDetail'
import { Contact }            from './pages/Contact'
import { Advertising }        from './pages/Advertising'

// --- Авторизація ---
import { Login }    from './pages/Login'
import { Register } from './pages/Register'

// --- Приватні сторінки ---
import { Dashboard }    from './pages/Dashboard'
import { Settings }     from './pages/Settings'
import { Profile }      from './pages/Profile'
import { MyListings }   from './pages/MyListings'
import { Messages }     from './pages/Messages'
import { Favorites }    from './pages/Favorites'
import { CreateAd }     from './pages/CreateAd'
import { Checkout }     from './pages/Checkout'
import { BoostProfile } from './pages/BoostProfile'

function App() {
  const [path, setPath] = useState(window.location.pathname)

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
      case '/listings':      return <Listings />
      case '/contact':       return <Contact />
      case '/advertise':
      case '/advertising':   return <Advertising />
      case '/login':         return <Login />
      case '/register':      return <Register />
      case '/dashboard':     return <Dashboard />
      case '/settings':      return <Settings />
      case '/profile':       return <Profile />
      case '/my-listings':   return <MyListings />
      case '/messages':      return <Messages />
      case '/favorites':     return <Favorites />
      case '/create-ad':     return <CreateAd />
      case '/checkout':      return <Checkout />      // 🆕 Після оплати Stripe
      case '/boost':         return <BoostProfile />  // 🆕 Просування профілю
      default:               return <Home />
    }
  }

  const hideHeaderFooter = ['/login', '/register'].includes(path)

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-canvas)' }}>
        {!hideHeaderFooter && <Header />}
        <main className="flex-1">{getPage()}</main>
        {!hideHeaderFooter && <Footer />}
      </div>
    </AppProvider>
  )
}

export default App