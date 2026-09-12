import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../services/api'

function MakeOffer() {
  const { listingId } = useParams()
  const navigate = useNavigate()

  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setSuccess('')
    setError('')
    setSubmitting(true)

    try {
      const token = localStorage.getItem('access_token')

      const data = await apiRequest('/offers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          offered_price_per_kg: Number(price),
          offered_quantity_kg: Number(quantity),
          message: message || null,
        }),
      })

      setSuccess(
        data.message || 'Offer submitted successfully.'
      )

      setPrice('')
      setQuantity('')
      setMessage('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>Make an Offer</h1>
        <p>
          Submit your price and quantity directly to the farmer.
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

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="price">
              Your offer price (₹ / kg)
            </label>

            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
              placeholder="e.g. 27"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity">
              Quantity (kg)
            </label>

            <input
              id="quantity"
              type="number"
              min="1"
              step="0.01"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              placeholder="e.g. 100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">
              Message <span>(optional)</span>
            </label>

            <textarea
              id="message"
              rows="4"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Add a message for the farmer..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Submitting...'
              : 'Submit Offer'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default MakeOffer