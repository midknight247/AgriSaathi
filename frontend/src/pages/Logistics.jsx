import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

function Logistics() {
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState('')
  const [success, setSuccess] = useState('')

  async function loadRequests() {
    try {
      const token = localStorage.getItem('access_token')

      const data = await apiRequest('/pickup-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setRequests(data.pickup_requests || [])
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
    loadRequests()
  }, [])

  async function handleStatusUpdate(requestId, status) {
    setUpdating(requestId)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('access_token')

      const data = await apiRequest(
        `/pickup-requests/${requestId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            request_status: status,
         }),
        }
      )

      setSuccess(
        data.message ||
          `Pickup request marked as ${status}.`
      )

      await loadRequests()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong'
      )
    } finally {
      setUpdating('')
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <p>Loading pickup requests...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>Pickup & Logistics</h1>
        <p>
          Track produce pickup requests and coordinate delivery
          after a transaction is confirmed.
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

      {!error && requests.length === 0 && (
        <div className="card">
          <p>No pickup requests found.</p>
        </div>
      )}

      <section className="logistics-grid">
        {requests.map((request) => (
          <article
            key={request.id}
            className="logistics-card"
          >
            <div className="logistics-header">
              <div>
                <span className="logistics-label">
                  Pickup request
                </span>

                <h2>
                  {request.pickup_location ||
                    'Pickup location'}
                </h2>
              </div>

              <span className="status">
                {request.request_status}
              </span>
            </div>

            <div className="logistics-details">
              <div>
                <span>Pickup</span>
                <strong>
                  {request.pickup_location}
                </strong>
              </div>

              <div>
                <span>Delivery</span>
                <strong>
                  {request.delivery_location}
                </strong>
              </div>

              <div>
                <span>Pickup date</span>
                <strong>
                  {request.pickup_date}
                </strong>
              </div>

              <div>
                <span>Provider</span>
                <strong>
                  {request.logistics_provider_name ||
                    request.logistics_provider_id ||
                    'Not assigned'}
                </strong>
              </div>
            </div>

            {request.notes && (
              <div className="logistics-notes">
                <span>Notes</span>
                <p>{request.notes}</p>
              </div>
            )}

            <div className="logistics-actions">
              {request.request_status === 'requested' && (
                <>
                  <button
                    onClick={() =>
                      handleStatusUpdate(
                        request.id,
                        'confirmed'
                      )
                    }
                    disabled={updating === request.id}
                  >
                    {updating === request.id
                      ? 'Updating...'
                      : 'Confirm Pickup'}
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      handleStatusUpdate(
                        request.id,
                        'cancelled'
                      )
                    }
                    disabled={updating === request.id}
                  >
                    Cancel
                  </button>
                </>
              )}

              {request.request_status === 'confirmed' && (
                <button
                  onClick={() =>
                    handleStatusUpdate(
                      request.id,
                      'completed'
                    )
                  }
                  disabled={updating === request.id}
                >
                  {updating === request.id
                    ? 'Updating...'
                    : 'Mark Completed'}
                </button>
              )}

              {(request.request_status === 'completed' ||
                request.request_status === 'cancelled') && (
                <div className="logistics-complete">
                  This pickup request is closed.
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Logistics