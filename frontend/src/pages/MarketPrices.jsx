import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/api'

const RESULTS_PER_PAGE = 12

function MarketPrices() {
  const [prices, setPrices] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [cropFilter, setCropFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [marketSearch, setMarketSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [recommendation, setRecommendation] = useState(null)
  const [recommendationLoading, setRecommendationLoading] =
    useState(false)
  const [recommendationError, setRecommendationError] =
    useState('')

  useEffect(() => {
    async function loadPrices() {
      try {
        const data = await apiRequest('/market-prices')
        setPrices(Array.isArray(data) ? data : [])
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

    loadPrices()
  }, [])

  useEffect(() => {
    async function loadRecommendation() {
      if (!cropFilter) {
        setRecommendation(null)
        setRecommendationError('')
        return
      }

      setRecommendationLoading(true)
      setRecommendationError('')

      try {
        const params = new URLSearchParams()
        params.set('crop_name', cropFilter)

        if (districtFilter) {
          params.set('district', districtFilter)
        }

        const data = await apiRequest(
          `/sell-recommendation?${params.toString()}`
        )

        setRecommendation(data)
      } catch (err) {
        setRecommendation(null)
        setRecommendationError(
          err instanceof Error
            ? err.message
            : 'Could not load selling recommendation'
        )
      } finally {
        setRecommendationLoading(false)
      }
    }

    loadRecommendation()
  }, [cropFilter, districtFilter])

  const crops = useMemo(() => {
    return [...new Set(
      prices
        .map((price) => price.crop_name)
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b))
  }, [prices])

  const districts = useMemo(() => {
    return [...new Set(
      prices
        .map((price) => price.district)
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b))
  }, [prices])

  const filteredPrices = useMemo(() => {
    const search = marketSearch.trim().toLowerCase()

    return prices.filter((price) => {
      const matchesCrop =
        !cropFilter ||
        price.crop_name === cropFilter

      const matchesDistrict =
        !districtFilter ||
        price.district === districtFilter

      const matchesMarket =
        !search ||
        (price.market_name || '').toLowerCase().includes(search)

      return (
        matchesCrop &&
        matchesDistrict &&
        matchesMarket
      )
    })
  }, [
    prices,
    cropFilter,
    districtFilter,
    marketSearch
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPrices.length / RESULTS_PER_PAGE)
  )

  const safePage = Math.min(currentPage, totalPages)

  const visiblePrices = filteredPrices.slice(
    (safePage - 1) * RESULTS_PER_PAGE,
    safePage * RESULTS_PER_PAGE
  )

  function handleCropChange(event) {
    setCropFilter(event.target.value)
    setCurrentPage(1)
  }

  function handleDistrictChange(event) {
    setDistrictFilter(event.target.value)
    setCurrentPage(1)
  }

  function handleMarketSearch(event) {
    setMarketSearch(event.target.value)
    setCurrentPage(1)
  }

  function resetFilters() {
    setCropFilter('')
    setDistrictFilter('')
    setMarketSearch('')
    setCurrentPage(1)
    setRecommendation(null)
    setRecommendationError('')
  }

  function getRecommendationClass() {
    if (!recommendation) {
      return ''
    }

    if (recommendation.recommendation === 'SELL NOW') {
      return 'sell-now'
    }

    if (recommendation.recommendation === 'WAIT') {
      return 'wait'
    }

    return 'monitor'
  }

  if (loading) {
    return (
      <main className="page-container">
        <p>Loading market prices...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>Market Prices</h1>
        <p>
          Compare recent mandi prices to make better pricing
          decisions for your produce.
        </p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!error && (
        <>
          {/* PRICE INTELLIGENCE */}
          {cropFilter && (
            <section
              className={`card price-intelligence-card ${getRecommendationClass()}`}
            >
              <div className="price-intelligence-header">
                <div>
                  <span className="market-price-label">
                    PRICE INTELLIGENCE
                  </span>

                  <h2>
                    {cropFilter}
                    {districtFilter
                      ? ` — ${districtFilter}`
                      : ''}
                  </h2>

                  <p>
                    Explainable recommendation based on
                    recent mandi prices.
                  </p>
                </div>

                {recommendation && (
                  <div className="recommendation-badge">
                    {recommendation.recommendation}
                  </div>
                )}
              </div>

              {recommendationLoading && (
                <p>
                  Analysing recent market prices...
                </p>
              )}

              {recommendationError && (
                <div className="error">
                  {recommendationError}
                </div>
              )}

              {!recommendationLoading &&
                recommendation &&
                !recommendationError && (
                  <>
                    <div className="price-intelligence-grid">
                      <div>
                        <span>Current modal price</span>
                        <strong>
                          ₹
                          {
                            recommendation.current_modal_price_per_kg
                          }
                          /kg
                        </strong>
                      </div>

                      <div>
                        <span>7-day average</span>
                        <strong>
                          ₹
                          {
                            recommendation.average_7_day_price_per_kg
                          }
                          /kg
                        </strong>
                      </div>

                      <div>
                        <span>Difference</span>
                        <strong>
                          ₹
                          {
                            recommendation.difference_per_kg
                          }
                          /kg
                        </strong>
                      </div>

                      <div>
                        <span>Market position</span>
                        <strong>
                          {recommendation.difference_percent > 0
                            ? '+'
                            : ''}
                          {
                            recommendation.difference_percent
                          }
                          %
                        </strong>
                      </div>
                    </div>

                    <div className="price-intelligence-reason">
                      <strong>
                        {recommendation.reason}
                      </strong>

                      <p>
                        This is a short-term market signal,
                        not a guaranteed future-price
                        prediction.
                      </p>
                    </div>

                    <div className="price-intelligence-footer">
                      <span>
                        Latest data:{' '}
                        {recommendation.latest_date}
                      </span>

                      <span>
                        Based on{' '}
                        {recommendation.data_points}{' '}
                        recent market data point
                        {recommendation.data_points === 1
                          ? ''
                          : 's'}
                      </span>
                    </div>
                  </>
                )}
            </section>
          )}

          <section className="card market-price-filters">
            <div>
              <label htmlFor="crop-filter">
                Crop
              </label>

              <select
                id="crop-filter"
                value={cropFilter}
                onChange={handleCropChange}
              >
                <option value="">
                  All crops
                </option>

                {crops.map((crop) => (
                  <option
                    key={crop}
                    value={crop}
                  >
                    {crop}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="district-filter">
                District
              </label>

              <select
                id="district-filter"
                value={districtFilter}
                onChange={handleDistrictChange}
              >
                <option value="">
                  All districts
                </option>

                {districts.map((district) => (
                  <option
                    key={district}
                    value={district}
                  >
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="market-search">
                Market
              </label>

              <input
                id="market-search"
                type="text"
                placeholder="Search market..."
                value={marketSearch}
                onChange={handleMarketSearch}
              />
            </div>

            <div className="market-price-filter-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </section>

          <div className="market-price-summary">
            <p>
              Showing{' '}
              <strong>
                {filteredPrices.length === 0
                  ? 0
                  : (safePage - 1) * RESULTS_PER_PAGE + 1}
                -
                {Math.min(
                  safePage * RESULTS_PER_PAGE,
                  filteredPrices.length
                )}
              </strong>{' '}
              of{' '}
              <strong>{filteredPrices.length}</strong>{' '}
              market records
            </p>
          </div>

          {filteredPrices.length === 0 ? (
            <div className="card">
              <p>
                No market prices match your selected filters.
              </p>

              <button
                type="button"
                className="secondary-button"
                onClick={resetFilters}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <section className="market-prices-grid">
                {visiblePrices.map((price) => (
                  <article
                    key={price.id}
                    className="market-price-card"
                  >
                    <div className="market-price-header">
                      <div>
                        <span className="market-price-label">
                          {price.district}
                        </span>

                        <h2>{price.crop_name}</h2>

                        <p>
                          {price.variety ||
                            'Variety not specified'}
                        </p>
                      </div>

                      <span className="status">
                        {price.source || 'Market data'}
                      </span>
                    </div>

                    <div className="market-details">
                      <div>
                        <span>Market</span>
                        <strong>
                          {price.market_name?.trim() ||
                            'Market not specified'}
                        </strong>
                      </div>

                      <div>
                        <span>Date</span>
                        <strong>
                          {price.price_date}
                        </strong>
                      </div>

                      <div>
                        <span>Minimum</span>
                        <strong>
                          ₹{price.min_price_per_quintal}
                        </strong>
                      </div>

                      <div className="modal-price">
                        <span>Modal price</span>
                        <strong>
                          ₹{price.modal_price_per_quintal}
                        </strong>
                      </div>

                      <div>
                        <span>Maximum</span>
                        <strong>
                          ₹{price.max_price_per_quintal}
                        </strong>
                      </div>

                      <div>
                        <span>Arrivals</span>
                        <strong>
                          {price.arrival_quantity_quintal ??
                            'N/A'}{' '}
                          quintal
                        </strong>
                      </div>
                    </div>

                    <div className="market-price-note">
                      Prices are shown per quintal.
                    </div>
                  </article>
                ))}
              </section>

              {totalPages > 1 && (
                <div className="market-price-pagination">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safePage === 1}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {safePage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safePage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  )
}

export default MarketPrices