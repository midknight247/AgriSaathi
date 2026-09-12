import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle' // Adjust path if ThemeToggle is in another folder

function Navbar() {
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user'))

  if (!user) {
    return null
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">AgriSaathi</Link>
      </div>

      <div className="navbar-user">
        <ThemeToggle />

        <span>
          {user.full_name}
        </span>

        <span className="navbar-role">
          {user.role}
        </span>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar