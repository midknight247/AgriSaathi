import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

function CreateListing() {
  const navigate = useNavigate()

  const [cropName, setCropName] = useState('')
  const [variety, setVariety] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expectedPrice, setExpectedPrice] = useState('')
  const [harvestDate, setHarvestDate] = useState('')
  const [pickupDistrict, setPickupDistrict] = useState('')
  const [pickupVillage, setPickupVillage] = useState('')

  const [priceIntelligence, setPriceIntelligence] = useState(null)
  const [priceIntelligenceError, setPriceIntelligenceError] = useState('')
  const [loadingPriceIntelligence, setLoadingPriceIntelligence] = useState(false)

  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadPriceIntelligence() {
    if (!cropName.trim()) {
      setPriceIntelligence(null)
      setPriceIntelligenceError('')
      return
    }

    setLoadingPriceIntelligence(true)
    setPriceIntelligenceError('')

    try {
      const params = new URLSearchParams({
        crop_name: cropName.trim(),
      })

      if (pickupDistrict.trim()) {
        params.set('district', pickupDistrict.trim())
      }

      if (expectedPrice) {
        params.set(
          'expected_price_per_kg',
          expectedPrice
        )
      }

      const data = await apiRequest(
        `/price-intelligence?${params.toString()}`
      )

      setPriceIntelligence(data)
    } catch (err) {
      setPriceIntelligence(null)
      setPriceIntelligenceError(
        err instanceof Error
          ? err.message
          : 'Unable to load current market prices'
      )
    } finally {
      setLoadingPriceIntelligence(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSuccess('')
    setError('')
    setSubmitting(true)

    try {
      const token = localStorage.getItem('access_token')

      const data = await apiRequest('/listings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          crop_name: cropName,
          variety: variety || null,
          description: description || null,
          quantity_kg: Number(quantity),
          expected_price_per_kg: expectedPrice
            ? Number(expectedPrice)
            : null,
          harvest_date: harvestDate,
          pickup_district: pickupDistrict,
          pickup_village: pickupVillage,
        }),
      })

      setSuccess(
        data.message || 'Produce listing created successfully.'
      )

      setCropName('')
      setVariety('')
      setDescription('')
      setQuantity('')
      setExpectedPrice('')
      setHarvestDate('')
      setPickupDistrict('')
      setPickupVillage('')
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
        <h1>Create Produce Listing</h1>
        <p>
          List your produce so buyers can discover it and make
          competitive offers.
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

      <div className="form-card listing-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Produce details</h2>

            <div className="form-group">
              <label htmlFor="cropName">
                Crop name
              </label>

              <input
                id="cropName"
                type="text"
                value={cropName}
                onChange={(event) =>
                  setCropName(event.target.value)
                }
                placeholder="e.g. Onion"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="variety">
                Variety <span>(optional)</span>
              </label>

              <input
                id="variety"
                type="text"
                value={variety}
                onChange={(event) =>
                  setVariety(event.target.value)
                }
                placeholder="e.g. Nashik Red"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span>(optional)</span>
              </label>

              <textarea
                id="description"
                rows="4"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe the quality or condition of your produce..."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Quantity and pricing</h2>

            <div className="form-row">
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
                  placeholder="e.g. 1000"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expectedPrice">
                  Expected price (₹ / kg)
                  <span> (optional)</span>
                </label>

                <input
                  id="expectedPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expectedPrice}
                  onChange={(event) =>
                    setExpectedPrice(event.target.value)
                  }
                  placeholder="e.g. 25"
                />

                <button
                  type="button"
                  onClick={loadPriceIntelligence}
                  disabled={
                    !cropName.trim() ||
                    loadingPriceIntelligence
                  }
                >
                  {loadingPriceIntelligence
                    ? 'Checking market prices...'
                    : 'Check current market price'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="harvestDate">
                Harvest date
              </label>

              <input
                id="harvestDate"
                type="date"
                value={harvestDate}
                onChange={(event) =>
                  setHarvestDate(event.target.value)
                }
                required
              />
            </div>
          </div>

          {priceIntelligenceError && (
            <div className="error">
              {priceIntelligenceError}
            </div>
          )}

          {priceIntelligence && (
            <div className="market-price-card">
              <h2>Market Intelligence</h2>

              <p>
                Based on {priceIntelligence.market_count} market
                {priceIntelligence.market_count === 1 ? '' : 's'} on{' '}
                {priceIntelligence.latest_date}.
              </p>

              <div className="listing-details">
                <div>
                  <span>Average modal price</span>
                  <strong>
                    ₹
                    {priceIntelligence.average_modal_price_per_kg.toFixed(2)}
                    {' / kg'}
                  </strong>
                </div>

                <div>
                  <span>Modal price range</span>
                  <strong>
                    ₹
                    {priceIntelligence.lowest_modal_price_per_kg.toFixed(2)}
                    {' – '}
                    ₹
                    {priceIntelligence.highest_modal_price_per_kg.toFixed(2)}
                    {' / kg'}
                  </strong>
                </div>

                {priceIntelligence.expected_price_per_kg !== null && (
                  <div>
                    <span>Your expected price</span>
                    <strong>
                      ₹
                      {priceIntelligence.expected_price_per_kg.toFixed(2)}
                      {' / kg'}
                    </strong>
                  </div>
                )}

                {priceIntelligence.expected_price_difference_per_kg !==
                  null && (
                  <div>
                    <span>Difference from market average</span>
                    <strong>
                      ₹
                      {priceIntelligence.expected_price_difference_per_kg.toFixed(
                        2
                      )}
                      {' / kg '}
                      (
                      {priceIntelligence.expected_price_difference_percent.toFixed(
                        1
                      )}
                      %)
                    </strong>
                  </div>
                )}
                {priceIntelligence.price_position && (
  <div>
    <span>Price position</span>
    <strong>
      {priceIntelligence.price_position === 'above_market'
        ? 'Above current market average'
        : priceIntelligence.price_position === 'below_market'
        ? 'Below current market average'
        : 'Near current market average'}
    </strong>
  </div>
)}
              </div>
              {priceIntelligence.top_markets?.length > 0 && (
  <div className="top-markets">
    <h3>Top current markets</h3>

    <div className="top-markets-list">
      {priceIntelligence.top_markets.map((market, index) => (
        <div
          className="top-market-row"
          key={`${market.market_name}-${market.district}`}
        >
          <span>
            {index + 1}. {market.market_name}
            <small>{market.district}</small>
          </span>

          <strong>
            ₹{market.modal_price_per_kg.toFixed(2)} / kg
          </strong>
        </div>
      ))}
    </div>
  </div>
)}

              <p>
                This is a current mandi reference, not a guaranteed selling
                price.
              </p>
            </div>
          )}

          <div className="form-section">
            <h2>Pickup location</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupDistrict">
                  District
                </label>

                <input
                  id="pickupDistrict"
                  type="text"
                  value={pickupDistrict}
                  onChange={(event) =>
                    setPickupDistrict(event.target.value)
                  }
                  placeholder="e.g. Nashik"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pickupVillage">
                  Village / town
                </label>

                <input
                  id="pickupVillage"
                  type="text"
                  value={pickupVillage}
                  onChange={(event) =>
                    setPickupVillage(event.target.value)
                  }
                  placeholder="e.g. Lasalgaon"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Creating listing...'
              : 'Create Listing'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default CreateListing

