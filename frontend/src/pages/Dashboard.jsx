import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import GameCard from '../components/GameCard'
import './Dashboard.css'

function offsetDate(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

function toESPN(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function fmtLabel(offset) {
  if (offset === 0) return 'Hoy'
  if (offset === 1) return 'Mañana'
  if (offset === -1) return 'Ayer'
  return offsetDate(offset).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateOffset, setDateOffset] = useState(0)
  const [betPrefill, setBetPrefill] = useState(null)
  const navigate = useNavigate()

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const date = toESPN(offsetDate(dateOffset))
      const res = await api.get(`/games/scoreboard?date=${date}`)
      setGames(res.data.events || [])
    } catch {
      setError('Error al cargar partidos.')
    }
    setLoading(false)
  }, [dateOffset])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  function handleAddBet(prefill) {
    setBetPrefill(prefill)
    navigate('/bets', { state: { prefill } })
  }

  const live = games.filter((g) => g.status.type.state === 'in')
  const upcoming = games.filter((g) => g.status.type.state === 'pre')
  const finished = games.filter((g) => g.status.type.state === 'post')

  return (
    <div className="page">
      {/* Date nav */}
      <div className="date-nav">
        <button className="btn btn-ghost date-btn" onClick={() => setDateOffset((d) => d - 1)}>
          ← Anterior
        </button>
        <span className="date-label">{fmtLabel(dateOffset)}</span>
        <button className="btn btn-ghost date-btn" onClick={() => setDateOffset((d) => d + 1)}>
          Siguiente →
        </button>
        <button className="btn btn-ghost date-refresh" onClick={fetchGames}>
          ↻
        </button>
      </div>

      {loading && (
        <div className="center-state">
          <span className="spinner" /> Cargando partidos...
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {!loading && !error && games.length === 0 && (
        <div className="center-state">No hay partidos programados para este día.</div>
      )}

      {!loading && !error && (
        <>
          {live.length > 0 && (
            <section className="game-section">
              <h2 className="section-title">
                <span className="live-dot" /> En vivo
              </h2>
              {live.map((g) => (
                <GameCard key={g.id} game={g} onAddBet={handleAddBet} />
              ))}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="game-section">
              <h2 className="section-title">Próximos</h2>
              {upcoming.map((g) => (
                <GameCard key={g.id} game={g} onAddBet={handleAddBet} />
              ))}
            </section>
          )}

          {finished.length > 0 && (
            <section className="game-section">
              <h2 className="section-title">Finalizados</h2>
              {finished.map((g) => (
                <GameCard key={g.id} game={g} onAddBet={handleAddBet} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
