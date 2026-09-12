import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

function MyListings() {
  const [listings, setListings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadListings() {
      try {
        const token = localStorage.getItem('access_token')

        const data = await apiRequest('/my-listings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

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
        <p>Loading listings...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>My Listings</h1>
        <p>
          Manage the produce you have listed for buyers.
        </p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!error && listings.length === 0 && (
        <div className="card">
          <p>You have no active listings.</p>
        </div>
      )}

      <section className="listings-grid">
        {listings.map((listing) => (
          <article
            key={listing.id}
            className="listing-card"
          >
            <div className="listing-card-header">
              <div>
                <h2>{listing.crop_name}</h2>

                <p>
                  {listing.variety || 'Variety not specified'}
                </p>
              </div>

              <span className="status">
                {listing.listing_status}
              </span>
            </div>

            <div className="listing-details">
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

              <div>
                <span>Harvest date</span>
                <strong>
                  {listing.harvest_date || 'Not specified'}
                </strong>
              </div>
            </div>

            {listing.description && (
              <div className="listing-description">
                <span>Description</span>
                <p>{listing.description}</p>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}

export default MyListings