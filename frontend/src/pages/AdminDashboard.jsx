import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        const token = localStorage.getItem('access_token')

        const data = await apiRequest('/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setUsers(data.users || [])
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

    loadUsers()
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
          Monitor registered users and the overall AgriSaathi
          platform.
        </p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!error && (
        <>
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
        </>
      )}
    </main>
  )
}

export default AdminDashboard