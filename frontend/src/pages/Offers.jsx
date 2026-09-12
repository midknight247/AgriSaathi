import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

function Offers() {
  const [listings, setListings] = useState([])
  const [offers, setOffers] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState('')
  const [success, setSuccess] = useState('')

  async function loadOffers() {
    try {
      const token = localStorage.getItem('access_token')

      const data = await apiRequest('/my-listings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const farmerListings = data.listings || []
      setListings(farmerListings)

      const offerData = {}

      for (const listing of farmerListings) {
        try {
          const result = await apiRequest(
            `/listings/${listing.id}/offers`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          offerData[listing.id] = result.offers || []
        } catch {
          offerData[listing.id] = []
        }
      }

      setOffers(offerData)
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

  useEffect(() => {
    loadOffers()
  }, [])

  async function handleAccept(offerId) {
    setAccepting(offerId)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('access_token')

      const data = await apiRequest(
        `/offers/${offerId}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setSuccess(
        data.message || 'Offer accepted successfully.'
      )

      await loadOffers()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong'
      )
    } finally {
      setAccepting('')
    }
  }

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
        <h1>Buyer Offers</h1>
        <p>
          Review buyer offers for your produce and accept the
          deal that works best for you.
        </p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {success && (
        <div className="success">
          {success}
        </div>
      )}

      {!error && listings.length === 0 && (
        <div className="card">
          <p>You have no active listings.</p>
        </div>
      )}

      <section className="farmer-offers">
        {listings.map((listing) => (
          <article
            key={listing.id}
            className="farmer-offer-section"
          >
            <div className="farmer-offer-listing">
              <div>
                <h2>{listing.crop_name}</h2>

                <p>
                  {listing.variety ||
                    'Variety not specified'}
                </p>
              </div>

              <span className="status">
                {listing.listing_status}
              </span>
            </div>

            <div className="listing-summary">
              <span>
                <strong>{listing.quantity_kg} kg</strong>
                {' '}available
              </span>

              <span>
                Expected:{' '}
                <strong>
                  {listing.expected_price_per_kg
                    ? `₹${listing.expected_price_per_kg}/kg`
                    : 'Not specified'}
                </strong>
              </span>

              <span>
                Pickup:{' '}
                <strong>
                  {listing.pickup_village},{' '}
                  {listing.pickup_district}
                </strong>
              </span>
            </div>

            {offers[listing.id]?.length === 0 ? (
              <div className="no-offers">
                No offers yet.
              </div>
            ) : (
              <div className="offer-list">
                {offers[listing.id].map((offer) => (
                  <div
                    key={offer.id}
                    className="buyer-offer-card"
                  >
                    <div className="buyer-offer-header">
                      <div>
                        <span className="offer-label">
                          Buyer offer
                        </span>

                        <h3>
                          ₹{offer.offered_price_per_kg}
                          {' '} / kg
                        </h3>
                      </div>

                      <span className="status">
                        {offer.offer_status}
                      </span>
                    </div>

                    <div className="buyer-offer-details">
                      <div>
                        <span>Quantity</span>
                        <strong>
                          {offer.offered_quantity_kg} kg
                        </strong>
                      </div>

                      <div>
                        <span>Message</span>
                        <strong>
                          {offer.message || 'No message'}
                        </strong>
                      </div>
                    </div>

                    {offer.offer_status === 'pending' && (
                      <button
                        onClick={() =>
                          handleAccept(offer.id)
                        }
                        disabled={
                          accepting === offer.id
                        }
                      >
                        {accepting === offer.id
                          ? 'Accepting...'
                          : 'Accept Offer'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}

export default Offers