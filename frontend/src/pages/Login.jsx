import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import './Auth.css'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // OAuth2PasswordRequestForm usa form-data
      const params = new URLSearchParams()
      params.append('username', form.username)
      params.append('password', form.password)

      const res = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      localStorage.setItem('token', res.data.access_token)

      // Cargar datos del usuario
      const me = await api.get('/auth/me')
      localStorage.setItem('user', JSON.stringify(me.data))

      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>🏀</span>
          <h1>NBA Scout</h1>
        </div>
        <p className="auth-subtitle">Análisis y seguimiento de apuestas NBA</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label>Usuario</label>
            <input
              className="input"
              type="text"
              placeholder="tu_usuario"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? <><span className="spinner" /> Entrando...</> : 'Entrar'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tenés cuenta?{' '}
          <Link to="/register">Registrarse</Link>
        </p>
      </div>
    </div>
  )
}
