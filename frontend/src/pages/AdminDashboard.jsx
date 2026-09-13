import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [providers, setProviders] = useState([])

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProvider, setSavingProvider] = useState(false)

  const [providerForm, setProviderForm] = useState({
    provider_name: '',
    phone_number: '',
    district: '',
    service_area: '',
    vehicle_type: 'mini_truck',
    capacity_kg: '',
    estimated_cost: '',
  })

  async function loadData() {
    try {
      const token = localStorage.getItem('access_token')

      const [userData, providerData] = await Promise.all([
        apiRequest('/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        apiRequest('/logistics-providers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      setUsers(userData.users || [])
      setProviders(providerData.logistics_providers || [])
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
    loadData()
  }, [])

  const farmerCount = users.filter(
    (user) => user.role === 'farmer'
  ).length

  const buyerCount = users.filter(
    (user) => user.role === 'buyer'
  ).length

  const adminCount = users.filter(
    (user) => user.role === 'admin'
  ).length

  const activeCount = users.filter(
    (user) => user.is_active
  ).length

  function handleProviderChange(event) {
    const { name, value } = event.target

    setProviderForm({
      ...providerForm,
      [name]: value,
    })
  }

  async function handleCreateProvider(event) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setSavingProvider(true)

    try {
      const token = localStorage.getItem('access_token')

      const data = await apiRequest('/logistics-providers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider_name: providerForm.provider_name,
          phone_number: providerForm.phone_number,
          district: providerForm.district,
          service_area: providerForm.service_area,
          vehicle_type: providerForm.vehicle_type,
          capacity_kg: Number(providerForm.capacity_kg),
          estimated_cost: Number(providerForm.estimated_cost),
        }),
      })

      setSuccess(
        data.message || 'Logistics provider added successfully.'
      )

      setProviderForm({
        provider_name: '',
        phone_number: '',
        district: '',
        service_area: '',
        vehicle_type: 'mini_truck',
        capacity_kg: '',
        estimated_cost: '',
      })

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not create logistics provider'
      )
    } finally {
      setSavingProvider(false)
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <p>Loading platform data...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>
          Monitor AgriSaathi users and manage the logistics
          provider network.
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

      <section className="admin-stats">
        <div className="admin-stat-card">
          <span>Total Users</span>
          <strong>{users.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Farmers</span>
          <strong>{farmerCount}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Buyers</span>
          <strong>{buyerCount}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Active Accounts</span>
          <strong>{activeCount}</strong>
        </div>
      </section>

      {/* LOGISTICS PROVIDERS */}

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>🚚 Logistics Providers</h2>
            <p>
              Add transport providers that farmers can select
              when arranging produce pickup.
            </p>
          </div>

          <span className="status">
            {providers.length} providers
          </span>
        </div>

        <form
          className="admin-provider-form"
          onSubmit={handleCreateProvider}
        >
          <div className="admin-form-grid">
            <label>
              Provider Name
              <input
                type="text"
                name="provider_name"
                value={providerForm.provider_name}
                onChange={handleProviderChange}
                placeholder="Sahyadri Agro Logistics"
                required
              />
            </label>

            <label>
              Phone Number
              <input
                type="tel"
                name="phone_number"
                value={providerForm.phone_number}
                onChange={handleProviderChange}
                placeholder="9876543210"
                required
              />
            </label>

            <label>
              District
              <select
                name="district"
                value={providerForm.district}
                onChange={handleProviderChange}
                required
              >
                <option value="">Select district</option>
                <option value="Nashik">Nashik</option>
                <option value="Pune">Pune</option>
                <option value="Ahmednagar">
                  Ahmednagar
                </option>
                <option value="Sangli">Sangli</option>
                <option value="Kolhapur">Kolhapur</option>
                <option value="Satara">Satara</option>
                <option value="Solapur">Solapur</option>
                <option value="Dhule">Dhule</option>
                <option value="Jalgaon">Jalgaon</option>
                <option value="Aurangabad">
                  Aurangabad
                </option>
              </select>
            </label>

            <label>
              Service Area
              <input
                type="text"
                name="service_area"
                value={providerForm.service_area}
                onChange={handleProviderChange}
                placeholder="Nashik – Pune"
                required
              />
            </label>

            <label>
              Vehicle Type
              <select
                name="vehicle_type"
                value={providerForm.vehicle_type}
                onChange={handleProviderChange}
                required
              >
                <option value="mini_truck">
                  Mini Truck
                </option>
                <option value="tempo">
                  Tempo
                </option>
                <option value="truck">
                  Truck
                </option>
                <option value="tractor_trolley">
                  Tractor Trolley
                </option>
              </select>
            </label>

            <label>
              Capacity (kg)
              <input
                type="number"
                name="capacity_kg"
                value={providerForm.capacity_kg}
                onChange={handleProviderChange}
                placeholder="1000"
                min="1"
                required
              />
            </label>

            <label>
              Estimated Cost (₹)
              <input
                type="number"
                name="estimated_cost"
                value={providerForm.estimated_cost}
                onChange={handleProviderChange}
                placeholder="2500"
                min="0"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={savingProvider}
          >
            {savingProvider
              ? 'Adding Provider...'
              : 'Add Logistics Provider'}
          </button>
        </form>

        {/* EXISTING PROVIDERS */}

        {providers.length === 0 ? (
          <div className="card">
            <p>
              No logistics providers have been added yet.
            </p>
          </div>
        ) : (
          <div className="admin-users">
            {providers.map((provider) => (
              <article
                key={provider.id}
                className="admin-user-card"
              >
                <div className="admin-user-header">
                  <div>
                    <span className="admin-user-label">
                      Logistics Provider
                    </span>

                    <h3>
                      {provider.provider_name}
                    </h3>
                  </div>

                  <span className="status">
                    {provider.is_active
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </div>

                <div className="admin-user-details">
                  <div>
                    <span>Phone</span>
                    <strong>
                      {provider.phone_number || 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span>District</span>
                    <strong>
                      {provider.district || 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span>Service Area</span>
                    <strong>
                      {provider.service_area || 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span>Vehicle</span>
                    <strong>
                      {provider.vehicle_type || 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span>Capacity</span>
                    <strong>
                      {provider.capacity_kg
                        ? `${provider.capacity_kg} kg`
                        : 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span>Estimated Cost</span>
                    <strong>
                      {provider.estimated_cost
                        ? `₹${provider.estimated_cost}`
                        : 'N/A'}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* REGISTERED USERS */}

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>Registered Users</h2>
            <p>
              Users currently registered on the platform.
            </p>
          </div>

          <span className="status">
            {users.length} users
          </span>
        </div>

        {users.length === 0 ? (
          <div className="card">
            <p>No users found.</p>
          </div>
        ) : (
          <div className="admin-users">
            {users.map((user) => (
              <article
                key={user.id}
                className="admin-user-card"
              >
                <div className="admin-user-header">
                  <div>
                    <span className="admin-user-label">
                      {user.role}
                    </span>

                    <h3>{user.full_name}</h3>
                  </div>

                  <span
                    className={
                      user.is_active
                        ? 'status'
                        : 'admin-inactive'
                    }
                  >
                    {user.is_active
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </div>

                <div className="admin-user-details">
                  <div>
                    <span>Phone</span>
                    <strong>
                      {user.phone_number}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>
                      {user.email || 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span>Location</span>
                    <strong>
                      {[
                        user.village,
                        user.district,
                        user.state,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span>Organization</span>
                    <strong>
                      {user.organization_name || 'N/A'}
                    </strong>
                  </div>
                </div>

                <div className="admin-user-footer">
                  <span>
                    {user.is_demo_account
                      ? 'Demo account'
                      : 'Registered account'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-overview">
        <div>
          <span>Platform roles</span>
          <strong>
            {farmerCount} farmers · {buyerCount} buyers ·{' '}
            {adminCount} admins
          </strong>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard