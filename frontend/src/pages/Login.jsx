import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

function Login() {
  const navigate = useNavigate()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()

    setMessage('')
    setError('')
    setSubmitting(true)

    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: phoneNumber,
          password: password,
        }),
      })

      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      if (data.user.role === 'farmer') {
        navigate('/farmer')
      } else if (data.user.role === 'buyer') {
        navigate('/buyer')
      } else if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        setMessage(`Welcome, ${data.user.full_name}`)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to log in. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-logo">🌾</div>

          <h1>AgriSaathi</h1>

          <p>
            Connecting farmers, buyers and logistics
            providers for a stronger agricultural marketplace.
          </p>

          <div className="login-features">
            <div>
              <strong>Direct market access</strong>
              <span>Connect farmers directly with buyers.</span>
            </div>

            <div>
              <strong>Better price discovery</strong>
              <span>Use mandi prices to make informed decisions.</span>
            </div>

            <div>
              <strong>End-to-end coordination</strong>
              <span>Manage transactions and produce pickup in one place.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <span className="login-eyebrow">
              AgriSaathi platform
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="login-form-group">
              <label htmlFor="phoneNumber">
                Phone Number
              </label>

              <input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(event) =>
                  setPhoneNumber(event.target.value)
                }
                placeholder="Enter your phone number"
                autoComplete="tel"
                required
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="error login-message">
                {error}
              </div>
            )}

            {message && (
              <div className="success login-message">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="login-footer">
            <span>Secure role-based access</span>
            <span>•</span>
            <span>Farmer · Buyer · Admin</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Login