import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

function Register() {
  const navigate = useNavigate()

  const [role, setRole] = useState('farmer')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('')
  const [organizationName, setOrganizationName] = useState('')

  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleRegister(event) {
    event.preventDefault()

    setSuccess('')
    setError('')
    setSubmitting(true)

    try {
      const data = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({
          role,
          full_name: fullName,
          phone_number: phoneNumber,
          password,
          email: email || null,
          village: village || null,
          district: district || null,
          state: state || null,
          organization_name: organizationName || null,
        }),
      })

      setSuccess(
        data.message ||
          'Registration successful. You can now log in.'
      )

      setFullName('')
      setPhoneNumber('')
      setPassword('')
      setEmail('')
      setVillage('')
      setDistrict('')
      setState('')
      setOrganizationName('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="register-page">
      <section className="register-intro">
        <div>
          <div className="register-logo">🌾</div>

          <span className="register-eyebrow">
            Join AgriSaathi
          </span>

          <h1>Build stronger agricultural connections.</h1>

          <p>
            Create an account to connect with farmers,
            buyers and logistics partners through a
            transparent digital marketplace.
          </p>
        </div>
      </section>

      <section className="register-form-panel">
        <div className="register-card">
          <div className="register-header">
            <h2>Create your account</h2>
            <p>
              Enter your details to get started.
            </p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="form-section">
              <h3>Account type</h3>

              <div className="role-selector">
                <button
                  type="button"
                  className={
                    role === 'farmer'
                      ? 'role-option active'
                      : 'role-option'
                  }
                  onClick={() => setRole('farmer')}
                >
                  <strong>Farmer</strong>
                  <span>Sell your produce</span>
                </button>

                <button
                  type="button"
                  className={
                    role === 'buyer'
                      ? 'role-option active'
                      : 'role-option'
                  }
                  onClick={() => setRole('buyer')}
                >
                  <strong>Buyer</strong>
                  <span>Source fresh produce</span>
                </button>
              </div>
            </div>

            <div className="form-section">
              <h3>Personal details</h3>

              <div className="form-group">
                <label htmlFor="fullName">
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">
                    Phone Number
                  </label>

                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(event.target.value)
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="form-group">
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
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email <span>(optional)</span>
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Location</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="village">
                    Village <span>(optional)</span>
                  </label>

                  <input
                    id="village"
                    type="text"
                    value={village}
                    onChange={(event) =>
                      setVillage(event.target.value)
                    }
                    placeholder="Village"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="district">
                    District <span>(optional)</span>
                  </label>

                  <input
                    id="district"
                    type="text"
                    value={district}
                    onChange={(event) =>
                      setDistrict(event.target.value)
                    }
                    placeholder="District"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="state">
                  State <span>(optional)</span>
                </label>

                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(event) =>
                    setState(event.target.value)
                  }
                  placeholder="State"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Organization</h3>

              <div className="form-group">
                <label htmlFor="organizationName">
                  Organization Name <span>(optional)</span>
                </label>

                <input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(event) =>
                    setOrganizationName(event.target.value)
                  }
                  placeholder="Farm, business or organization"
                />
              </div>
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

            <button
              type="submit"
              className="register-button"
              disabled={submitting}
            >
              {submitting
                ? 'Creating account...'
                : 'Create account'}
            </button>
          </form>

          <button
            type="button"
            className="register-login-button"
            onClick={() => navigate('/login')}
          >
            Already have an account? Sign in
          </button>
        </div>
      </section>
    </main>
  )
}

export default Register