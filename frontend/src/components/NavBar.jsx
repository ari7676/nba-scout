import { Link, useLocation, useNavigate } from 'react-router-dom'
import './NavBar.css'

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const links = [
  { to: '/', label: 'Partidos' },
  { to: '/bets', label: 'Apuestas' },
  { to: '/standings', label: '🏆 Playoffs' },
]
  
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏀</span>
          <span>NBA Scout</span>
        </Link>

        <div className="navbar-links">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          <span className="user-name">{user.username}</span>
          <button className="logout-btn" onClick={logout}>
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
