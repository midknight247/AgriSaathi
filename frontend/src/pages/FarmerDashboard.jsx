import { Link, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

function FarmerDashboard() {

  function handleLogout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  navigate('/login')
}
  const location = useLocation()
  const navigate = useNavigate()

  let user = {}

  try {
    user = JSON.parse(localStorage.getItem('user')) || {}
  } catch {
    user = {}
  }

  const farmerName = user?.full_name || 'Farmer'

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="farmer-dashboard">

      {/* ================= SIDEBAR ================= */}
      <aside className="farmer-sidebar">

        <div className="brand">
          <div className="brand-mark">🌱</div>

          <div>
            <div className="brand-name">AgriSaathi</div>
            <div className="brand-subtitle">Farmer Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">

          <div className="nav-section-title">
            MAIN MENU
          </div>

          <Link
            to="/farmer"
            className={`sidebar-link ${
              location.pathname === '/farmer' ? 'active' : ''
            }`}
          >
            <span className="sidebar-icon">⌂</span>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/farmer/listings"
            className={`sidebar-link ${
              location.pathname === '/farmer/listings' ? 'active' : ''
            }`}
          >
            <span className="sidebar-icon">🌾</span>
            <span>My Listings</span>
            <span className="nav-count">12</span>
          </Link>

          <Link
            to="/farmer/listings/create"
            className="sidebar-link"
          >
            <span className="sidebar-icon">＋</span>
            <span>Create Listing</span>
          </Link>

          <Link
            to="/farmer/offers"
            className={`sidebar-link ${
              location.pathname === '/farmer/offers' ? 'active' : ''
            }`}
          >
            <span className="sidebar-icon">🤝</span>
            <span>Offers</span>
            <span className="nav-count offer-count">3</span>
          </Link>

          <Link
            to="/farmer/market-prices"
            className={`sidebar-link ${
              location.pathname === '/farmer/market-prices' ? 'active' : ''
            }`}
          >
            <span className="sidebar-icon">📈</span>
            <span>Market Prices</span>
          </Link>

          <Link
            to="/farmer/transactions"
            className={`sidebar-link ${
              location.pathname === '/farmer/transactions' ? 'active' : ''
            }`}
          >
            <span className="sidebar-icon">₹</span>
            <span>Transactions</span>
          </Link>

          <Link
            to="/farmer/logistics"
            className={`sidebar-link ${
              location.pathname === '/farmer/logistics' ? 'active' : ''
            }`}
          >
            <span className="sidebar-icon">🚚</span>
            <span>Pickup & Logistics</span>
            <span className="nav-count">2</span>
          </Link>

          <div className="nav-section-title secondary-title">
            SUPPORT
          </div>

          <button
            type="button"
            className="sidebar-link sidebar-button"
            onClick={() => alert('Help & Support will be available soon.')}
          >
            <span className="sidebar-icon">?</span>
            <span>Help & Support</span>
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="farmer-mini-profile">
            <div className="profile-avatar">
              {farmerName.charAt(0).toUpperCase()}
            </div>

            <div className="profile-details">
              <strong>{farmerName}</strong>
              <span>Farmer Account</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
         >
            Logout
          </button>

        </div>

      </aside>


      {/* ================= MAIN CONTENT ================= */}
      <main className="farmer-main">

        {/* TOP BAR */}
        <header className="dashboard-topbar">

          <div className="mobile-brand">
            <span className="mobile-brand-icon">🌱</span>
            <strong>AgriSaathi</strong>
          </div>

          <div className="topbar-search">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search listings, offers..."
              aria-label="Search"
            />
          </div>

          <div className="topbar-actions">
            <ThemeToggle />

            <button
              type="button"
              className="notification-button"
              aria-label="Notifications"
              onClick={() => alert('No new notifications')}
            >
              🔔
              <span className="notification-dot"></span>
            </button>

            <div className="topbar-profile">

              <div className="topbar-avatar">
                {farmerName.charAt(0).toUpperCase()}
              </div>

              <div className="topbar-user">
                <strong>{farmerName}</strong>
                <span>Farmer</span>
              </div>

              <span className="profile-chevron">⌄</span>

            </div>

          </div>

        </header>


        {/* CONTENT */}
        <div className="dashboard-content">

          {/* GREETING */}
          <section className="welcome-section">

            <div>
              <div className="welcome-eyebrow">
                {today}
              </div>

              <h1>
                Namaskar, {farmerName} <span>👋</span>
              </h1>

              <p>
                Here's what's happening with your farm today.
              </p>
            </div>

            <Link
              to="/farmer/listings/create"
              className="primary-action"
            >
              <span>＋</span>
              Create Listing
            </Link>

          </section>


          {/* ================= STATS ================= */}
          <section className="stats-grid">

            <div className="stat-card">

              <div className="stat-top">
                <div className="stat-icon green">
                  🌾
                </div>

                <span className="stat-trend positive">
                  Active
                </span>
              </div>

              <div className="stat-value">
                12
              </div>

              <div className="stat-label">
                Active Listings
              </div>

              <Link to="/farmer/listings" className="stat-link">
                View listings →
              </Link>

            </div>


            <div className="stat-card">

              <div className="stat-top">
                <div className="stat-icon orange">
                  🤝
                </div>

                <span className="stat-trend warning">
                  Action needed
                </span>
              </div>

              <div className="stat-value">
                3
              </div>

              <div className="stat-label">
                Pending Offers
              </div>

              <Link to="/farmer/offers" className="stat-link">
                Review offers →
              </Link>

            </div>


            <div className="stat-card">

              <div className="stat-top">
                <div className="stat-icon blue">
                  📈
                </div>

                <span className="stat-trend neutral">
                  Mandi
                </span>
              </div>

              <div className="stat-value price-value">
                ₹2,150
              </div>

              <div className="stat-label">
                Wheat / Quintal
              </div>

              <Link
                to="/farmer/market-prices"
                className="stat-link"
              >
                Check prices →
              </Link>

            </div>


            <div className="stat-card">

              <div className="stat-top">
                <div className="stat-icon purple">
                  🚚
                </div>

                <span className="stat-trend warning">
                  Today
                </span>
              </div>

              <div className="stat-value">
                2
              </div>

              <div className="stat-label">
                Pickups Today
              </div>

              <Link
                to="/farmer/logistics"
                className="stat-link"
              >
                Track pickups →
              </Link>

            </div>

          </section>


          {/* ================= ATTENTION ================= */}
          <section className="attention-section">

            <div className="section-heading">

              <div>
                <span className="section-kicker">
                  IMPORTANT
                </span>

                <h2>
                  Needs your attention
                </h2>
              </div>

              <span className="attention-count">
                2 items
              </span>

            </div>


            <div className="attention-list">

              <div className="attention-item">

                <div className="attention-icon offer">
                  🤝
                </div>

                <div className="attention-content">

                  <div className="attention-title-row">
                    <h3>
                      New buyer offer received
                    </h3>

                    <span className="attention-time">
                      Recently
                    </span>
                  </div>

                  <p>
                    Ramesh Traders has made an offer on your
                    produce listing.
                  </p>

                  <div className="attention-meta">
                    <strong>Offer needs review</strong>
                    <span>•</span>
                    <span>Check the offered price before accepting</span>
                  </div>

                </div>

                <Link
                  to="/farmer/offers"
                  className="attention-action"
                >
                  Review →
                </Link>

              </div>


              <div className="attention-item">

                <div className="attention-icon pickup">
                  🚚
                </div>

                <div className="attention-content">

                  <div className="attention-title-row">
                    <h3>
                      Pickup scheduled for today
                    </h3>

                    <span className="attention-time">
                      Today
                    </span>
                  </div>

                  <p>
                    A pickup request is scheduled for one of
                    your confirmed transactions.
                  </p>

                  <div className="attention-meta">
                    <strong>Pickup & logistics</strong>
                    <span>•</span>
                    <span>Check your pickup status</span>
                  </div>

                </div>

                <Link
                  to="/farmer/logistics"
                  className="attention-action"
                >
                  Track →
                </Link>

              </div>

            </div>

          </section>


          {/* ================= LOWER GRID ================= */}
          <section className="lower-grid">


            {/* MANAGE FARM */}
            <div className="manage-card">

              <div className="card-heading">

                <div>
                  <span className="section-kicker">
                    QUICK ACCESS
                  </span>

                  <h2>
                    Manage your farm
                  </h2>
                </div>

                <span className="heading-icon">
                  ✦
                </span>

              </div>


              <div className="quick-actions">

                <Link
                  to="/farmer/listings"
                  className="quick-action"
                >
                  <div className="quick-icon green-bg">
                    🌾
                  </div>

                  <div>
                    <strong>My Listings</strong>
                    <span>Manage your produce</span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>


                <Link
                  to="/farmer/listings/create"
                  className="quick-action"
                >
                  <div className="quick-icon yellow-bg">
                    ＋
                  </div>

                  <div>
                    <strong>Create Listing</strong>
                    <span>Add new produce</span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>


                <Link
                  to="/farmer/offers"
                  className="quick-action"
                >
                  <div className="quick-icon orange-bg">
                    🤝
                  </div>

                  <div>
                    <strong>Offers</strong>
                    <span>Review buyer offers</span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>


                <Link
                  to="/farmer/transactions"
                  className="quick-action"
                >
                  <div className="quick-icon blue-bg">
                    ₹
                  </div>

                  <div>
                    <strong>Transactions</strong>
                    <span>View your deals</span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>


                <Link
                  to="/farmer/logistics"
                  className="quick-action"
                >
                  <div className="quick-icon purple-bg">
                    🚚
                  </div>

                  <div>
                    <strong>Pickup & Logistics</strong>
                    <span>Track your pickups</span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>


                <Link
                  to="/farmer/market-prices"
                  className="quick-action"
                >
                  <div className="quick-icon teal-bg">
                    📈
                  </div>

                  <div>
                    <strong>Market Prices</strong>
                    <span>Check mandi rates</span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>

              </div>

            </div>


            {/* MARKET PRICES */}
            <div className="market-card">

              <div className="card-heading">

                <div>
                  <span className="section-kicker">
                    MARKET
                  </span>

                  <h2>
                    Today's prices
                  </h2>
                </div>

                <Link
                  to="/farmer/market-prices"
                  className="view-all"
                >
                  View all
                </Link>

              </div>


              <div className="market-location">
                <span>📍</span>
                <span>Siliguri Regional Mandi</span>
              </div>


              <div className="market-list">

                <div className="market-row">

                  <div className="crop-info">
                    <div className="crop-icon wheat">
                      🌾
                    </div>

                    <div>
                      <strong>Wheat</strong>
                      <span>per quintal</span>
                    </div>
                  </div>

                  <div className="crop-price">
                    ₹2,150
                    <small>↑ 2.4%</small>
                  </div>

                </div>


                <div className="market-row">

                  <div className="crop-info">
                    <div className="crop-icon onion">
                      🧅
                    </div>

                    <div>
                      <strong>Onion</strong>
                      <span>per quintal</span>
                    </div>
                  </div>

                  <div className="crop-price">
                    ₹1,340
                    <small>↑ 1.2%</small>
                  </div>

                </div>


                <div className="market-row">

                  <div className="crop-info">
                    <div className="crop-icon mustard">
                      🌼
                    </div>

                    <div>
                      <strong>Mustard</strong>
                      <span>per quintal</span>
                    </div>
                  </div>

                  <div className="crop-price">
                    ₹5,420
                    <small>↑ 3.1%</small>
                  </div>

                </div>


                <div className="market-row">

                  <div className="crop-info">
                    <div className="crop-icon potato">
                      🥔
                    </div>

                    <div>
                      <strong>Potato</strong>
                      <span>per quintal</span>
                    </div>
                  </div>

                  <div className="crop-price">
                    ₹980
                    <small>↓ 0.8%</small>
                  </div>

                </div>

              </div>


              <div className="market-footer">
                Prices are indicative and may vary by market.
              </div>

            </div>

          </section>


          {/* FOOTER TIP */}
          <section className="dashboard-tip">

            <div className="tip-icon">
              💡
            </div>

            <div>
              <strong>
                Safer selling starts with the right information
              </strong>

              <p>
                Check current market prices before accepting
                an offer and always review transaction details
                carefully.
              </p>
            </div>

          </section>

        </div>

      </main>


      {/* ================= MOBILE NAV ================= */}
      <nav className="mobile-bottom-nav">

        <Link
          to="/farmer"
          className={
            location.pathname === '/farmer'
              ? 'mobile-nav-item active'
              : 'mobile-nav-item'
          }
        >
          <span>⌂</span>
          <small>Home</small>
        </Link>

        <Link
          to="/farmer/listings"
          className="mobile-nav-item"
        >
          <span>🌾</span>
          <small>Listings</small>
        </Link>

        <Link
          to="/farmer/listings/create"
          className="mobile-add-button"
        >
          <span>＋</span>
        </Link>

        <Link
          to="/farmer/offers"
          className="mobile-nav-item"
        >
          <span>🤝</span>
          <small>Offers</small>
        </Link>

        <Link
          to="/farmer/logistics"
          className="mobile-nav-item"
        >
          <span>🚚</span>
          <small>Logistics</small>
        </Link>

      </nav>

    </div>
  )
}



export default FarmerDashboard