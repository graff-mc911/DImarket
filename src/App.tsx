// ============================================================
// App.tsx — Кореневий компонент додатку DImarket
// Відповідає за маршрутизацію між усіма сторінками.
//
// ВАЖЛИВО: App слухає подію popstate — саме так navigateTo()
// повідомляє про зміну маршруту без перезавантаження сторінки.
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
import { Dashboard }  from './pages/Dashboard'
import { Settings }   from './pages/Settings'
import { Profile }    from './pages/Profile'
import { MyListings } from './pages/MyListings'
import { Messages }   from './pages/Messages'
import { Favorites }  from './pages/Favorites'
import { CreateAd }   from './pages/CreateAd'

function App() {
  // Зберігаємо поточний шлях у стані — щоб при popstate App перерендерився
  const [path, setPath] = useState(window.location.pathname)

  // Слухаємо навігаційні події (назад/вперед у браузері та navigateTo())
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Витягуємо ID з динамічних маршрутів типу /listing/abc-123
  const getSegments = () => {
    const parts = path.split('/').filter(Boolean)
    // parts[0] = 'listing', parts[1] = 'abc-123'
    return parts
  }

  // Визначаємо яку сторінку показати
  const getPage = () => {
    const parts = getSegments()

    // --- Динамічні маршрути з ID ---

    // /listing/:id — деталі оголошення
    // Передаємо listingId як prop — без цього сторінка не знає який запис завантажити
    if (parts[0] === 'listing' && parts[1]) {
      return <ListingDetail listingId={parts[1]} />
    }

    // /professional/:id — профіль конкретного майстра
    if (parts[0] === 'professional' && parts[1]) {
      return <ProfessionalDetail profileId={parts[1]} />
    }

    // --- Статичні маршрути ---
    switch (path) {
      // Публічні
      case '/':              return <Home />
      case '/professionals': return <Professionals />
      case '/listings':      return <Listings />
      case '/contact':       return <Contact />
      case '/advertise':
      case '/advertising':   return <Advertising />

      // Авторизація
      case '/login':    return <Login />
      case '/register': return <Register />

      // Приватні (перевірка авторизації всередині кожної сторінки)
      case '/dashboard':   return <Dashboard />
      case '/settings':    return <Settings />
      case '/profile':     return <Profile />
      case '/my-listings': return <MyListings />
      case '/messages':    return <Messages />
      case '/favorites':   return <Favorites />
      case '/create-ad':   return <CreateAd />

      // Невідомий маршрут — повертаємо на головну
      default: return <Home />
    }
  }

  // На цих сторінках шапка і підвал приховані
  const hideHeaderFooter = ['/login', '/register'].includes(path)

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-canvas)' }}>

        {/* Навігаційна шапка */}
        {!hideHeaderFooter && <Header />}

        {/* Основний контент сторінки */}
        <main className="flex-1">
          {getPage()}
        </main>

        {/* Підвал */}
        {!hideHeaderFooter && <Footer />}

      </div>
    </AppProvider>
  )
}

export default App