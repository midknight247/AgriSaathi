import { Link } from 'react-router-dom'

function FarmerDashboard() {
  const user = JSON.parse(localStorage.getItem('user'))

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>Farmer Dashboard</h1>
        <p>
          Welcome back, {user?.full_name}. Manage your produce,
          offers, transactions and logistics from one place.
        </p>
      </div>

      <section className="dashboard-grid">
        <Link to="/farmer/listings" className="dashboard-card">
          <div className="dashboard-icon">🌾</div>
          <h2>My Listings</h2>
          <p>
            View and manage the produce you have listed for buyers.
          </p>
        </Link>

        <Link
          to="/farmer/listings/create"
          className="dashboard-card"
        >
          <div className="dashboard-icon">＋</div>
          <h2>Create Listing</h2>
          <p>
            Add new produce with quantity, price and pickup details.
          </p>
        </Link>

        <Link to="/farmer/offers" className="dashboard-card">
          <div className="dashboard-icon">🤝</div>
          <h2>Offers</h2>
          <p>
            Review buyer offers and accept the best available deal.
          </p>
        </Link>

        <Link
          to="/farmer/market-prices"
          className="dashboard-card"
        >
          <div className="dashboard-icon">📈</div>
          <h2>Market Prices</h2>
          <p>
            Check current mandi prices before negotiating with buyers.
          </p>
        </Link>

        <Link
          to="/farmer/transactions"
          className="dashboard-card"
        >
          <div className="dashboard-icon">₹</div>
          <h2>Transactions</h2>
          <p>
            View completed deals, quantities and final transaction
            amounts.
          </p>
        </Link>

        <Link
          to="/farmer/logistics"
          className="dashboard-card"
        >
          <div className="dashboard-icon">🚚</div>
          <h2>Pickup & Logistics</h2>
          <p>
            Track pickup requests and coordinate produce delivery.
          </p>
        </Link>
      </section>
    </main>
  )
}

export default FarmerDashboard

