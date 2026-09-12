import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { Link } from 'react-router-dom'

function BrowseProduce() {
  const [listings, setListings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadListings() {
      try {
        const data = await apiRequest('/listings')
        setListings(data.listings || [])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong'
        )
      } finally {
        setLoading(false)
      }
    }

    loadListings()
  }, [])

  if (loading) {
    return (
      <main className="page-container">
        <p>Loading produce...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>Browse Produce</h1>
        <p>
          Discover produce directly from farmers and make a
          competitive offer.
        </p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!error && listings.length === 0 && (
        <div className="card">
          <p>No active produce listings available.</p>
        </div>
      )}

      <section className="produce-grid">
        {listings.map((listing) => (
          <article
            key={listing.id}
            className="produce-card"
          >
            <div className="produce-card-top">
              <div>
                <h2>{listing.crop_name}</h2>

                <p className="produce-variety">
                  {listing.variety || 'Variety not specified'}
                </p>
              </div>

              <span className="status">
                {listing.listing_status}
              </span>
            </div>

            <div className="produce-details">
              <div>
                <span>Quantity</span>
                <strong>
                  {listing.quantity_kg} kg
                </strong>
              </div>

              <div>
                <span>Expected price</span>
                <strong>
                  {listing.expected_price_per_kg
                    ? `₹${listing.expected_price_per_kg} / kg`
                    : 'Not specified'}
                </strong>
              </div>

              <div>
                <span>Pickup location</span>
                <strong>
                  {listing.pickup_village},{' '}
                  {listing.pickup_district}
                </strong>
              </div>
            </div>

            <Link
              to={`/buyer/produce/${listing.id}/offer`}
              className="primary-link"
            >
              Make Offer
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}

export default BrowseProduce