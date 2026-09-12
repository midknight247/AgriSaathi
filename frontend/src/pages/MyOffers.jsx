import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

function MyOffers() {
  const [offers, setOffers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOffers() {
      try {
        const token = localStorage.getItem('access_token')

        const data = await apiRequest('/my-offers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setOffers(data.offers || [])
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

    loadOffers()
  }, [])

  if (loading) {
    return (
      <main className="page-container">
        <p>Loading offers...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>My Offers</h1>
        <p>
          Track the offers you have submitted to farmers.
        </p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!error && offers.length === 0 && (
        <div className="card">
          <p>You have not submitted any offers yet.</p>
        </div>
      )}

      <section className="offers-grid">
        {offers.map((offer) => (
          <article
            key={offer.id}
            className="offer-card"
          >
            <div className="offer-card-header">
              <div>
                <h2>{offer.crop_name}</h2>

                <p>
                  {offer.variety || 'Variety not specified'}
                </p>
              </div>

              <span className="status">
                {offer.offer_status}
              </span>
            </div>

            <div className="offer-details">
              <div>
                <span>Offer price</span>
                <strong>
                  ₹{offer.offered_price_per_kg} / kg
                </strong>
              </div>

              <div>
                <span>Quantity</span>
                <strong>
                  {offer.offered_quantity_kg} kg
                </strong>
              </div>

              <div>
                <span>Pickup location</span>
                <strong>
                  {offer.pickup_village},{' '}
                  {offer.pickup_district}
                </strong>
              </div>

              <div>
                <span>Message</span>
                <strong>
                  {offer.message || 'No message'}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

export default MyOffers