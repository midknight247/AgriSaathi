import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

function Offers() {
  const [listings, setListings] = useState([])
  const [offers, setOffers] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState('')
  const [rejecting, setRejecting] = useState('')
  const [success, setSuccess] = useState('')
  const [arrangingPickup, setArrangingPickup] = useState(null)
const [providers, setProviders] = useState([])
const [loadingProviders, setLoadingProviders] = useState(false)
const [pickupForm, setPickupForm] = useState({
  logistics_provider_id: '',
  pickup_location: '',
  delivery_location: '',
  pickup_date: '',
  notes: '',
})
const [schedulingPickup, setSchedulingPickup] = useState(false)
  

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

async function loadLogisticsProviders() {
  setLoadingProviders(true)
  setError('')

  try {
    const token = localStorage.getItem('access_token')

    const data = await apiRequest('/logistics-providers', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setProviders(data.logistics_providers || [])
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Could not load logistics providers'
    )
  } finally {
    setLoadingProviders(false)
  }
}

async function handleSchedulePickup(transactionId) {
  if (!pickupForm.logistics_provider_id) {
    setError('Please select a logistics provider.')
    return
  }

  setSchedulingPickup(true)
  setError('')
  setSuccess('')

  try {
    const token = localStorage.getItem('access_token')

    const data = await apiRequest('/pickup-requests', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        transaction_id: transactionId,
        logistics_provider_id:
          pickupForm.logistics_provider_id,
        pickup_location:
          pickupForm.pickup_location || null,
        delivery_location:
          pickupForm.delivery_location || null,
        pickup_date:
          pickupForm.pickup_date || null,
        notes:
          pickupForm.notes || null,
      }),
    })

    setSuccess(
      data.message || 'Pickup scheduled successfully.'
    )

    setArrangingPickup(null)

    setPickupForm({
      logistics_provider_id: '',
      pickup_location: '',
      delivery_location: '',
      pickup_date: '',
      notes: '',
    })
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Could not schedule pickup'
    )
  } finally {
    setSchedulingPickup(false)
  }
}

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

    console.log('ACCEPT OFFER RESPONSE:', data)

    if (!data.transaction_id || !data.listing_id) {
      throw new Error(
        'Offer was accepted, but transaction details were not returned.'
      )
    }

    // Store the confirmed transaction first.
    setArrangingPickup({
      transactionId: data.transaction_id,
      listingId: data.listing_id,
    })

    setSuccess(
      'Transaction confirmed. You can now arrange pickup.'
    )

    // Load providers for the pickup form.
    await loadLogisticsProviders()

    // Refresh offers/listings.
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

async function handleReject(offerId) {
  const confirmed = window.confirm(
    'Are you sure you want to reject this offer?'
  )

  if (!confirmed) return

  setRejecting(offerId)
  setError('')
  setSuccess('')

  try {
    const token = localStorage.getItem('access_token')

    const data = await apiRequest(
      `/offers/${offerId}/reject`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    setSuccess(
      data.message || 'Offer rejected successfully.'
    )

    await loadOffers()
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Something went wrong'
    )
  } finally {
    setRejecting('')
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
                          ₹{offer.offered_price_per_kg} / kg
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
                      <div className="offer-actions">
                        <button
                          type="button"
                          onClick={() => handleAccept(offer.id)}
                          disabled={
                            accepting === offer.id ||
                            rejecting === offer.id
                          }
                        >
                          {accepting === offer.id
                            ? 'Accepting...'
                            : 'Accept Offer'}
                        </button>

                        <button
                          type="button"
                          className="reject-offer-button"
                          onClick={() => handleReject(offer.id)}
                          disabled={
                            accepting === offer.id ||
                            rejecting === offer.id
                          }
                        >
                          {rejecting === offer.id
                            ? 'Rejecting...'
                            : 'Reject Offer'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ARRANGE PICKUP */}
            {arrangingPickup?.transactionId &&
              arrangingPickup.listingId === listing.id && (
                <div className="pickup-arrangement">
                  <div className="pickup-header">
                    <div>
                      <span className="offer-label">
                        Transaction confirmed
                      </span>
                      <h3>Arrange Pickup</h3>
                    </div>

                    <span className="status">
                      Ready
                    </span>
                  </div>

                  <p>
                    The buyer's offer has been accepted.
                    Select a logistics provider to arrange
                    the pickup.
                  </p>

                  <div className="pickup-form">
                    <label>
                      Logistics Provider
                      <select
                        value={
                          pickupForm.logistics_provider_id
                        }
                        onChange={(e) =>
                          setPickupForm({
                            ...pickupForm,
                            logistics_provider_id:
                              e.target.value,
                          })
                        }
                      >
                        <option value="">
                          Select a provider
                        </option>

                        {providers.map((provider) => (
                          <option
                            key={provider.id}
                            value={provider.id}
                          >
                            {provider.provider_name}
                            {' — '}
                            {provider.vehicle_type}
                            {provider.estimated_cost != null
                              ? ` — ₹${provider.estimated_cost}`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Pickup Location
                      <input
                        type="text"
                        placeholder="Enter pickup location"
                        value={pickupForm.pickup_location}
                        onChange={(e) =>
                          setPickupForm({
                            ...pickupForm,
                            pickup_location:
                              e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Delivery Location
                      <input
                        type="text"
                        placeholder="Enter delivery location"
                        value={pickupForm.delivery_location}
                        onChange={(e) =>
                          setPickupForm({
                            ...pickupForm,
                            delivery_location:
                              e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Pickup Date
                      <input
                        type="date"
                        value={pickupForm.pickup_date}
                        onChange={(e) =>
                          setPickupForm({
                            ...pickupForm,
                            pickup_date:
                              e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Notes
                      <textarea
                        placeholder="Any additional instructions"
                        value={pickupForm.notes}
                        onChange={(e) =>
                          setPickupForm({
                            ...pickupForm,
                            notes: e.target.value,
                          })
                        }
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        handleSchedulePickup(
                          arrangingPickup.transactionId
                        )
                      }
                      disabled={
                        schedulingPickup ||
                        !pickupForm.logistics_provider_id
                      }
                    >
                      {schedulingPickup
                        ? 'Scheduling...'
                        : 'Schedule Pickup'}
                    </button>
                  </div>
                </div>
              )}
          </article>
        ))}
      </section>
    </main>
  )
}

export default Offers