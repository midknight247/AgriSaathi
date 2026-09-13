import { Link } from 'react-router-dom'

function BuyerDashboard() {
  const user = (() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
})();

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>Buyer Dashboard</h1>
        <p>
          Welcome back, {user?.full_name}. Find fresh produce,
          negotiate directly with farmers and manage your purchases.
        </p>
      </div>

      <section className="dashboard-grid">
        <Link to="/buyer/produce" className="dashboard-card">
          <div className="dashboard-icon">🌾</div>
          <h2>Browse Produce</h2>
          <p>
            Explore active produce listings from farmers and find
            what you need.
          </p>
        </Link>

        <Link to="/buyer/offers" className="dashboard-card">
          <div className="dashboard-icon">🤝</div>
          <h2>My Offers</h2>
          <p>
            Track the offers you have submitted and their current
            status.
          </p>
        </Link>

        <Link
          to="/buyer/transactions"
          className="dashboard-card"
        >
          <div className="dashboard-icon">₹</div>
          <h2>Transactions</h2>
          <p>
            Review your confirmed purchases, quantities and final
            amounts.
          </p>
        </Link>

        <Link 
         to="/buyer/logistics" 
         className="dashboard-card"
        >
         <div className="dashboard-icon">🚚</div>
         <h2>Pickup & Logistics</h2>
         <p>
           Track pickup requests and delivery details for your
           confirmed purchases.
         </p>
        </Link>
      </section>
    </main>
  )
}

export default BuyerDashboard