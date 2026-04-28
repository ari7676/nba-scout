import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api'
import './Bets.css'

const RESULT_CYCLE = { pending: 'won', won: 'lost', lost: 'pending' }
const RESULT_LABELS = { pending: 'Pendiente', won: 'Ganada', lost: 'Perdida' }
const RESULT_CLASS = { pending: 'badge-amber', won: 'badge-green', lost: 'badge-red' }

const EMPTY_FORM = { game_label: '', pick: '', odds: '', amount: '', notes: '' }

export default function Bets() {
  const location = useLocation()
  const [bets, setBets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Si viene de Dashboard con un partido pre-llenado
    if (location.state?.prefill) {
      setForm((f) => ({ ...f, ...location.state.prefill }))
      setFormOpen(true)
    }
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [betsRes, statsRes] = await Promise.all([
        api.get('/bets/'),
        api.get('/bets/stats'),
      ])
      setBets(betsRes.data)
      setStats(statsRes.data)
    } catch {
      setError('Error al cargar apuestas.')
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
      }
      if (!payload.odds) delete payload.odds
      if (!payload.notes) delete payload.notes
      await api.post('/bets/', payload)
      setForm(EMPTY_FORM)
      setFormOpen(false)
      await fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar la apuesta.')
    }
    setSaving(false)
  }

  async function cycleResult(bet) {
    const next = RESULT_CYCLE[bet.result]
    try {
      await api.patch(`/bets/${bet.id}`, { result: next })
      await fetchAll()
    } catch {}
  }

  async function deleteBet(id) {
    if (!confirm('¿Eliminar esta apuesta?')) return
    try {
      await api.delete(`/bets/${id}`)
      await fetchAll()
    } catch {}
  }

  return (
    <div className="page">
      {/* Stats */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-val">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ganadas</div>
            <div className="stat-val green">{stats.won}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Perdidas</div>
            <div className="stat-val red">{stats.lost}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">% Éxito</div>
            <div className="stat-val">{stats.win_rate}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">P&L</div>
            <div className={`stat-val ${stats.pnl >= 0 ? 'green' : 'red'}`}>
              {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(0)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Invertido</div>
            <div className="stat-val">${stats.invested.toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* New bet button */}
      <div className="bets-header">
        <h2 style={{ fontSize: '16px', fontFamily: 'Syne' }}>
          {bets.length > 0 ? `${bets.length} apuesta${bets.length !== 1 ? 's' : ''}` : 'Mis apuestas'}
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => setFormOpen((o) => !o)}
        >
          {formOpen ? '✕ Cancelar' : '+ Nueva apuesta'}
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <form className="bet-form card" onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}

          <div className="bet-form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Partido</label>
              <input
                className="input"
                value={form.game_label}
                onChange={(e) => setForm({ ...form, game_label: e.target.value })}
                placeholder="ej: LAL vs GSW"
                required
              />
            </div>
            <div className="form-group">
              <label>Pick</label>
              <input
                className="input"
                value={form.pick}
                onChange={(e) => setForm({ ...form, pick: e.target.value })}
                placeholder="ej: LAL -3.5"
                required
              />
            </div>
            <div className="form-group">
              <label>Odds (americanas)</label>
              <input
                className="input"
                value={form.odds}
                onChange={(e) => setForm({ ...form, odds: e.target.value })}
                placeholder="ej: -110 o +150"
              />
            </div>
            <div className="form-group">
              <label>Monto ($)</label>
              <input
                className="input"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="100"
                min="0"
                step="any"
                required
              />
            </div>
            <div className="form-group">
              <label>Notas (opcional)</label>
              <input
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Razonamiento, contexto..."
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? <><span className="spinner" /> Guardando...</> : 'Registrar apuesta'}
          </button>
        </form>
      )}

      {/* Bet list */}
      {loading ? (
        <div className="center-state">
          <span className="spinner" /> Cargando...
        </div>
      ) : bets.length === 0 ? (
        <div className="center-state">
          Registrá tu primera apuesta con el botón de arriba.
        </div>
      ) : (
        <div className="bet-list">
          {bets.map((bet) => (
            <div key={bet.id} className="bet-item">
              <div className="bet-info">
                <div className="bet-game">{bet.game_label}</div>
                <div className="bet-details">
                  <strong>{bet.pick}</strong>
                  {bet.odds && <span> · Odds {bet.odds}</span>}
                  <span> · ${bet.amount}</span>
                  <span className="bet-date">
                    {' '}· {new Date(bet.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
                {bet.notes && <div className="bet-notes">{bet.notes}</div>}
              </div>
              <div className="bet-actions">
                <button
                  className={`badge ${RESULT_CLASS[bet.result]} badge-btn`}
                  onClick={() => cycleResult(bet)}
                  title="Clic para cambiar resultado"
                >
                  {RESULT_LABELS[bet.result]}
                </button>
                <button className="del-btn" onClick={() => deleteBet(bet.id)} title="Eliminar">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
