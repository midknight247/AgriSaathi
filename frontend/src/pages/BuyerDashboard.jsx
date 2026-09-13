import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ThemeToggle from '../components/ThemeToggle'
import { apiRequest } from '../services/api'

function BuyerDashboard() {

  const [offers, setOffers] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(true)

  const [pickups, setPickups] = useState([])
  const [loadingPickups, setLoadingPickups] = useState(true)

  const [listings, setListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)

  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  const location = useLocation()
  const navigate = useNavigate()

  let user = {}

  try {
    user = JSON.parse(localStorage.getItem('user')) || {}
  } catch {
    user = {}
  }

  const buyerName = user?.full_name || 'Buyer'

  /* ================= LOAD PICKUPS ================= */

  useEffect(() => {
    async function loadPickups() {
      try {
        const data = await apiRequest('/pickup-requests')
        setPickups(data.pickup_requests || [])
      } catch (err) {
        console.error('Failed to load pickups:', err)
      } finally {
        setLoadingPickups(false)
      }
    }

    loadPickups()
  }, [])


  /* ================= LOAD OFFERS ================= */

  useEffect(() => {
    async function loadOffers() {
      try {
        const data = await apiRequest('/my-offers')
        setOffers(data.offers || [])
      } catch (err) {
        console.error('Failed to load offers:', err)
      } finally {
        setLoadingOffers(false)
      }
    }

    loadOffers()
  }, [])

  /* ================= LOAD LISTINGS ================= */

useEffect(() => {
  async function loadListings() {
    try {
      const data = await apiRequest('/listings')
      setListings(data.listings || [])
    } catch (err) {
      console.error('Failed to load listings:', err)
    } finally {
      setLoadingListings(false)
    }
  }

  loadListings()
}, [])


/* ================= LOAD TRANSACTIONS ================= */

useEffect(() => {
  async function loadTransactions() {
    try {
      const data = await apiRequest('/transactions')
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setLoadingTransactions(false)
    }
  }

  loadTransactions()
}, [])


  /* ================= DATE / PICKUP DATA ================= */

  function getTodayString() {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const todayString = getTodayString()

  const confirmedPickups = pickups.filter(
    (pickup) => pickup.request_status === 'confirmed'
  )

  const upcomingPickups = confirmedPickups.filter(
    (pickup) =>
      pickup.pickup_date &&
      pickup.pickup_date >= todayString
  )


  /* ================= OFFER DATA ================= */

  const pendingOffers = offers.filter(
    (offer) => offer.offer_status === 'pending'
  )


  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })


  /* ================= LOGOUT ================= */

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="buyer-dashboard">

{/* ================= SIDEBAR ================= */}
<aside className="buyer-sidebar">

  <div className="brand">
    <div className="brand-mark">🌱</div>

    <div>
      <div className="brand-name">AgriSaathi</div>
      <div className="brand-subtitle">Buyer Portal</div>
    </div>
  </div>

  <nav className="sidebar-nav">

    <div className="nav-section-title">
      MAIN MENU
    </div>

    <Link
      to="/buyer"
      className={`sidebar-link ${
        location.pathname === '/buyer' ? 'active' : ''
      }`}
    >
      <span className="sidebar-icon">⌂</span>
      <span>Dashboard</span>
    </Link>

    <Link
      to="/buyer/produce"
      className={`sidebar-link ${
        location.pathname === '/buyer/produce' ? 'active' : ''
      }`}
    >
      <span className="sidebar-icon">🌾</span>
      <span>Browse Produce</span>
    </Link>

    <Link
      to="/buyer/offers"
      className={`sidebar-link ${
        location.pathname === '/buyer/offers' ? 'active' : ''
      }`}
    >
      <span className="sidebar-icon">🤝</span>
      <span>My Offers</span>

      <span className="nav-count offer-count">
        {loadingOffers ? '—' : pendingOffers.length}
      </span>

    </Link>

    <Link
      to="/buyer/transactions"
      className={`sidebar-link ${
        location.pathname === '/buyer/transactions'
          ? 'active'
          : ''
      }`}
    >
      <span className="sidebar-icon">₹</span>
      <span>Transactions</span>
    </Link>

    <Link
      to="/buyer/logistics"
      className={`sidebar-link ${
        location.pathname === '/buyer/logistics'
          ? 'active'
          : ''
      }`}
    >
      <span className="sidebar-icon">🚚</span>
      <span>Pickup & Logistics</span>

      <span className="nav-count">
        {loadingPickups ? '—' : upcomingPickups.length}
      </span>

    </Link>

    <div className="nav-section-title secondary-title">
      SUPPORT
    </div>

    <button
      type="button"
      className="sidebar-link sidebar-button"
      onClick={() =>
        alert('Help & Support will be available soon.')
      }
    >
      <span className="sidebar-icon">?</span>
      <span>Help & Support</span>
    </button>

  </nav>

  <div className="sidebar-bottom">

    <div className="farmer-mini-profile">

      <div className="profile-avatar">
        {buyerName.charAt(0).toUpperCase()}
      </div>

      <div className="profile-details">
        <strong>{buyerName}</strong>
        <span>Buyer Account</span>
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
<main className="buyer-main">

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
        placeholder="Search produce, offers..."
        aria-label="Search"
      />

    </div>

    <div className="topbar-actions">

      <ThemeToggle />

      <button
        type="button"
        className="notification-button"
        aria-label="Notifications"
        onClick={() =>
          alert('No new notifications')
        }
      >
        🔔
        <span className="notification-dot"></span>
      </button>

      <div className="topbar-profile">

        <div className="topbar-avatar">
          {buyerName.charAt(0).toUpperCase()}
        </div>

        <div className="topbar-user">
          <strong>{buyerName}</strong>
          <span>Buyer</span>
        </div>

        <span className="profile-chevron">⌄</span>

      </div>

    </div>

  </header>


  {/* ================= CONTENT ================= */}
  <div className="dashboard-content">

    {/* GREETING */}
    <section className="welcome-section">

      <div>

        <div className="welcome-eyebrow">
          {today}
        </div>

        <h1>
          Namaskar, {buyerName} <span>👋</span>
        </h1>

        <p>
          Find fresh produce, connect directly with farmers
          and manage your purchases with confidence.
        </p>

      </div>

      <Link
        to="/buyer/produce"
        className="primary-action"
      >
        <span>🌾</span>
        Browse Produce
      </Link>

    </section>


    {/* ================= STATS ================= */}
    <section className="stats-grid">

      {/* PRODUCE LISTINGS */}
      <div className="stat-card">

        <div className="stat-top">

          <div className="stat-icon green">
            🌾
          </div>

          <span className="stat-trend positive">
            Available
          </span>

        </div>

        <div className="stat-value">
          {loadingListings ? '—' : listings.length}
        </div>

        <div className="stat-label">
          Produce Listings
        </div>

        <Link
          to="/buyer/produce"
          className="stat-link"
        >
          Browse produce →
        </Link>

      </div>


      {/* MY OFFERS */}
      <div className="stat-card">

        <div className="stat-top">

          <div className="stat-icon orange">
            🤝
          </div>

          <span className="stat-trend warning">
            Active
          </span>

        </div>

        <div className="stat-value">
          {loadingOffers ? '—' : pendingOffers.length}
        </div>

        <div className="stat-label">
          My Offers
        </div>

        <Link
          to="/buyer/offers"
          className="stat-link"
        >
          Review offers →
        </Link>

      </div>


      {/* PURCHASES */}
      <div className="stat-card">

        <div className="stat-top">

          <div className="stat-icon blue">
            ₹
          </div>

          <span className="stat-trend neutral">
            Completed
          </span>

        </div>

        <div className="stat-value">
          {loadingListings ? '—' : listings.length}
        </div>

        <div className="stat-label">
          Purchases
        </div>

        <Link
          to="/buyer/transactions"
          className="stat-link"
        >
          View transactions →
        </Link>

      </div>


      {/* UPCOMING PICKUPS */}
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
          {loadingPickups ? '—' : upcomingPickups.length}
        </div>

        <div className="stat-label">
          Upcoming Pickups
        </div>

        <Link
          to="/buyer/logistics"
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
          {[
            pendingOffers.length > 0,
            confirmedPickups.some(
              (pickup) => pickup.pickup_date === todayString
            ),
          ].filter(Boolean).length}{' '}
          items
        </span>

      </div>


      <div className="attention-list">


        {/* ================= PENDING OFFER ================= */}
        {pendingOffers.length > 0 && (

          <div className="attention-item">

            <div className="attention-icon offer">
              🤝
            </div>

            <div className="attention-content">

              <div className="attention-title-row">

                <h3>
                  Offer awaiting farmer response
                </h3>

                <span className="attention-time">
                  Recently
                </span>

              </div>

              <p>
                One of your purchase offers is still waiting
                for the farmer's response.
              </p>

              <div className="attention-meta">

                <strong>
                  {pendingOffers.length} pending offer
                  {pendingOffers.length !== 1 ? 's' : ''}
                </strong>

                <span>•</span>

                <span>
                  Check your submitted offers
                </span>

              </div>

            </div>

            <Link
              to="/buyer/offers"
              className="attention-action"
            >
              Review →
            </Link>

          </div>

        )}


        {/* ================= PICKUP TODAY ================= */}
        {confirmedPickups.some(
          (pickup) => pickup.pickup_date === todayString
        ) && (

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
                A pickup is scheduled for one of your
                confirmed produce purchases.
              </p>

              <div className="attention-meta">

                <strong>
                  Pickup & logistics
                </strong>

                <span>•</span>

                <span>
                  Check your pickup status
                </span>

              </div>

            </div>

            <Link
              to="/buyer/logistics"
              className="attention-action"
            >
              Track →
            </Link>

          </div>

        )}


    {/* ================= NOTHING TO DO ================= */}
    {pendingOffers.length === 0 &&
      !confirmedPickups.some(
        (pickup) => pickup.pickup_date === todayString
      ) && (

        <div className="attention-item">

          <div className="attention-icon">
            ✓
          </div>

          <div className="attention-content">

            <div className="attention-title-row">

              <h3>
                You're all caught up
              </h3>

              <span className="attention-time">
                Now
              </span>

            </div>

            <p>
              You have no pending offers or pickups
              scheduled for today.
            </p>

            <div className="attention-meta">

              <strong>
                No action required
              </strong>

              <span>•</span>

              <span>
                Everything looks good
              </span>

            </div>

          </div>

        </div>

      )}

  </div>

</section>

          {/* ================= LOWER GRID ================= */}
          <section className="lower-grid">


            {/* QUICK ACCESS */}
            <div className="manage-card">

              <div className="card-heading">

                <div>
                  <span className="section-kicker">
                    QUICK ACCESS
                  </span>

                  <h2>
                    Manage your purchases
                  </h2>
                </div>

                <span className="heading-icon">
                  ✦
                </span>

              </div>


              <div className="quick-actions">

                <Link
                  to="/buyer/produce"
                  className="quick-action"
                >
                  <div className="quick-icon green-bg">
                    🌾
                  </div>

                  <div>
                    <strong>Browse Produce</strong>
                    <span>
                      Find fresh produce
                    </span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>


                <Link
                  to="/buyer/offers"
                  className="quick-action"
                >
                  <div className="quick-icon orange-bg">
                    🤝
                  </div>

                  <div>
                    <strong>My Offers</strong>
                    <span>
                      Track your offers
                    </span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>


                <Link
                  to="/buyer/transactions"
                  className="quick-action"
                >
                  <div className="quick-icon blue-bg">
                    ₹
                  </div>

                  <div>
                    <strong>Transactions</strong>
                    <span>
                      View your purchases
                    </span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>


                <Link
                  to="/buyer/logistics"
                  className="quick-action"
                >
                  <div className="quick-icon purple-bg">
                    🚚
                  </div>

                  <div>
                    <strong>Pickup & Logistics</strong>
                    <span>
                      Track your pickups
                    </span>
                  </div>

                  <span className="quick-arrow">→</span>
                </Link>

              </div>

            </div>


            {/* MARKET / PRODUCE */}
            <div className="market-card">

              <div className="card-heading">

                <div>
                  <span className="section-kicker">
                    MARKET
                  </span>

                  <h2>
                    Current market prices
                  </h2>
                </div>

                <Link
                  to="/buyer/produce"
                  className="view-all"
                >
                  Browse all
                </Link>

              </div>


              <div className="market-location">
                <span>📍</span>
                <span>
                  Siliguri Regional Mandi
                </span>
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
                Market prices are indicative and may vary
                by location and market.
              </div>

            </div>

          </section>


          {/* ================= FOOTER TIP ================= */}
          <section className="dashboard-tip">

            <div className="tip-icon">
              💡
            </div>

            <div>
              <strong>
                Smart buying starts with the right information
              </strong>

              <p>
                Compare current market prices, review farmer
                listings carefully and check offer details before
                confirming a purchase.
              </p>
            </div>

          </section>

        </div>

      </main>


      {/* ================= MOBILE NAV ================= */}
      <nav className="mobile-bottom-nav">

        <Link
          to="/buyer"
          className={
            location.pathname === '/buyer'
              ? 'mobile-nav-item active'
              : 'mobile-nav-item'
          }
        >
          <span>⌂</span>
          <small>Home</small>
        </Link>

        <Link
          to="/buyer/produce"
          className="mobile-nav-item"
        >
          <span>🌾</span>
          <small>Produce</small>
        </Link>

        <Link
          to="/buyer/offers"
          className="mobile-add-button"
        >
          <span>🤝</span>
        </Link>

        <Link
          to="/buyer/transactions"
          className="mobile-nav-item"
        >
          <span>₹</span>
          <small>Orders</small>
        </Link>

        <Link
          to="/buyer/logistics"
          className="mobile-nav-item"
        >
          <span>🚚</span>
          <small>Logistics</small>
        </Link>

      </nav>

    </div>
  )
}

export default BuyerDashboard