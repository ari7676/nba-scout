import { useEffect, useState } from 'react'
import './Playoffs.css'

const API = 'https://nba-scout.onrender.com'

const ROUND_LABELS = {
  RD16: 'Primera Ronda',
  RD8: 'Semifinales',
  RD4: 'Finales de Conferencia',
  RD2: 'Finales NBA',
}

export default function Playoffs() {
  const [rounds, setRounds] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API}/games/playoffs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const grouped = {}
        for (const event of data.events || []) {
          const comp = event.competitions?.[0]
          const round = comp?.type?.abbreviation || 'OTHER'
          if (!grouped[round]) grouped[round] = []
          const home = comp.competitors.find(c => c.homeAway === 'home')
          const away = comp.competitors.find(c => c.homeAway === 'away')
          grouped[round].push({ id: event.id, date: event.date, home, away, status: comp.status })
        }
        setRounds(grouped)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="playoffs-loading">Cargando bracket...</div>

  const roundOrder = ['RD16', 'RD8', 'RD4', 'RD2']
  const activeRounds = roundOrder.filter(r => rounds[r])

  return (
    <div className="playoffs-wrapper">
      <h1 className="playoffs-title">🏆 NBA Playoffs 2026</h1>
      <div className="playoffs-bracket">
        {activeRounds.map(round => (
          <div key={round} className="playoffs-round">
            <h2 className="round-label">{ROUND_LABELS[round] || round}</h2>
            <div className="round-games">
              {rounds[round].map(game => (
                <div key={game.id} className="matchup-card">
                  <TeamRow team={game.away} />
                  <div className="vs">vs</div>
                  <TeamRow team={game.home} isHome />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamRow({ team, isHome }) {
  if (!team) return null
  const score = parseInt(team.score)
  return (
    <div className="team-row">
      <img src={team.team.logo} alt={team.team.abbreviation} className="team-logo" />
      <span className="team-name">{team.team.shortDisplayName}</span>
      {score > 0 && <span className="team-score">{score}</span>}
      {isHome && <span className="home-tag">L</span>}
    </div>
  )
}
