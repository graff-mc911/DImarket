# 🏗️ Buildster

A modern, scalable marketplace web app for construction, home services, and buy/sell listings.

## ✨ Key Features

### For Clients
- 📝 **Post ads WITHOUT registration** - Quick and easy ad creation
- 💰 **Flexible pricing** - 7 days, 1 month, or 1 year listings
- 🔍 **Browse and search** - Find services, materials, and professionals
- 💬 **Direct messaging** - Contact sellers and professionals instantly
- ⭐ **Reviews and ratings** - Make informed decisions

### For Professionals
- 👤 **Professional profiles** - Showcase your work and skills
- 📸 **Portfolio management** - Upload photos of your projects
- 💼 **Subscription plans** - Monthly or yearly membership
- 📊 **Dashboard** - Manage listings and messages
- 🎖️ **Verified badges** - Build trust with clients

### Platform Features
- 🌍 **Multi-language support** - 23 languages including English, Ukrainian, Polish, Spanish, and more
- 💱 **Multi-currency** - USD, EUR, GBP, PLN, UAH, and more
- 📱 **Mobile-responsive** - Works on all devices
- 🔒 **Secure authentication** - Supabase Auth integration
- ⚡ **Real-time updates** - Instant notifications and messages
- 🎨 **Modern UI** - Clean, professional design

## 🌐 Language Support

Buildster supports 23 languages out of the box! Users can switch languages instantly using the language dropdown in the header.

**Currently fully translated:**
- 🇬🇧 English
- 🇺🇦 Ukrainian (Українська)
- 🇵🇱 Polish (Polski)

**Partial translations:**
- 🇪🇸 Spanish (Español)

**Coming soon:** German, French, Italian, Portuguese, and 15+ more languages

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd buildster
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Internationalization**: Custom i18n system

## 📁 Project Structure

```
buildster/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── ListingCard.tsx
│   │   └── ProfessionalCard.tsx
│   ├── pages/            # Page components
│   │   ├── Home.tsx
│   │   ├── CreateAd.tsx
│   │   ├── Listings.tsx
│   │   ├── Professionals.tsx
│   │   ├── Pricing.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── contexts/         # React contexts
│   │   └── AppContext.tsx
│   ├── lib/             # Utilities and types
│   │   ├── supabase.ts
│   │   ├── types.ts
│   │   └── i18n.ts      # Translation system
│   └── App.tsx
├── supabase/
│   └── migrations/       # Database migrations
└── public/
```

## 🗄️ Database Schema

### Tables
- **categories** - Service and item categories
- **profiles** - User profiles and professional accounts
- **listings** - Ads posted by users
- **listing_images** - Images for listings
- **portfolio_items** - Professional portfolio photos
- **reviews** - Client reviews for professionals
- **messages** - Chat messages between users
- **professional_categories** - Many-to-many relationship

### Security
- Row Level Security (RLS) enabled on all tables
- Restrictive policies for data access
- Authentication required for sensitive operations

## 💰 Monetization

### For Clients (Pay-per-ad)
- **7 days**: $5 per ad
- **1 month**: $15 per ad (Most Popular)
- **1 year**: $50 per ad (Premium with featured placement)

### For Professionals (Subscriptions)
- **Monthly**: $20/month
- **Yearly**: $150/year (Save $90!)

## 🎨 Design System

**Colors:**
- Primary: Blue (#1E3A8A) - Trust and professionalism
- Accent: Orange (#F97316) - Action and energy
- Background: Gray (#F3F4F6) - Clean and modern

**Typography:**
- System fonts for optimal performance
- Clear hierarchy and readability
- Responsive sizing

## 🔐 Security Features

- Email/password authentication
- Row Level Security (RLS)
- Secure API endpoints
- Input validation and sanitization
- No sensitive data in client code
- CORS protection

## 🌟 Key Differentiators

Unlike traditional classified platforms (like OLX):

1. **Verified Professionals** - Professionals must register and subscribe
2. **Portfolio Showcase** - Instagram-style work galleries
3. **Smart Matching** - Location-based professional recommendations
4. **Built-in Chat** - No need for external communication
5. **Rating System** - Build trust through reviews
6. **Category Focus** - Specialized for construction and home services
7. **No Registration for Clients** - Lower barrier to entry
8. **Premium Listings** - Featured ads for better visibility

## 📱 Progressive Web App (PWA)

Buildster is optimized as a PWA and can be:
- Installed on mobile devices
- Used offline (coming soon)
- Added to home screen
- Fast loading and responsive

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Areas for Contribution
- Complete translations for remaining languages
- Add messaging system functionality
- Implement payment integration
- Add advanced search filters
- Create mobile apps (React Native)

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for scalability and performance
- Inspired by successful marketplace platforms
- Created with focus on user experience

## 📞 Support

For questions or support, please contact us through the platform.

---

**Made with ❤️ for the construction and home services community**
