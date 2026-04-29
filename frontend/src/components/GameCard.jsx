import { useState } from 'react'
import api from '../api'
import './GameCard.css'

export default function GameCard({ game, onAddBet }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const comp = game.competitions[0]
  const home = comp.competitors.find((c) => c.homeAway === 'home')
  const away = comp.competitors.find((c) => c.homeAway === 'away')
  const odds = comp.odds?.[0]
  const state = game.status.type.state
  const isLive = state === 'in'
  const isPost = state === 'post'
  const isPre = state === 'pre'

  const gameTime = isPre
    ? new Date(game.date).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
      }) + ' hs'
    : null

  async function analyze() {
    setLoading(true)
    try {
      const res = await api.post('/predictions/analyze', {
  game_id: game.id,   // ← agregar esta línea
  home_team: home.team.displayName,
  ...
        home_team: home.team.displayName,
        away_team: away.team.displayName,
        home_record: home.records?.[0]?.summary,
        away_record: away.records?.[0]?.summary,
        status: game.status.type.description,
        home_score: home.score,
        away_score: away.score,
        spread: odds?.details,
        over_under: odds?.overUnder,
        home_ml: odds?.homeTeamOdds?.moneyLine,
        away_ml: odds?.awayTeamOdds?.moneyLine,
        series: comp.series?.summary || null,
        season_type: game.season?.type || null,
        notes: game.notes?.[0]?.headline || null,
      })
      setAnalysis(res.data.analysis)
    } catch {
      setAnalysis('Error al obtener análisis.')
    }
    setLoading(false)
  }

  function fmtML(ml) {
    if (!ml) return null
    return ml > 0 ? `+${ml}` : `${ml}`
  }

  return (
    <div className={`game-card ${isLive ? 'game-card--live' : ''}`}>
      <div className="gc-header">
        <span className="gc-status">
          {isLive && <span className="live-dot" />}
          {game.status.type.shortDetail}
        </span>
        {isPre && <span className="gc-time">{gameTime}</span>}
      </div>

      <div className="gc-teams">
        <div className="gc-team">
          <img
            className="gc-logo"
            src={away.team.logo}
            alt={away.team.abbreviation}
            onError={(e) => (e.target.style.display = 'none')}
          />
          <div className="gc-team-name">{away.team.abbreviation}</div>
          <div className="gc-record">{away.records?.[0]?.summary}</div>
        </div>

        <div className="gc-score-block">
          {!isPre ? (
            <div className="gc-score">
              {away.score} – {home.score}
            </div>
          ) : (
            <div className="gc-vs">VS</div>
          )}
        </div>

        <div className="gc-team">
          <img
            className="gc-logo"
            src={home.team.logo}
            alt={home.team.abbreviation}
            onError={(e) => (e.target.style.display = 'none')}
          />
          <div className="gc-team-name">{home.team.abbreviation}</div>
          <div className="gc-record">{home.records?.[0]?.summary}</div>
        </div>
      </div>

      {odds && (
        <div className="gc-odds">
          {odds.details && <span className="gc-pill">Spread: {odds.details}</span>}
          {odds.overUnder && <span className="gc-pill">O/U {odds.overUnder}</span>}
          {odds.homeTeamOdds?.moneyLine && (
            <span className="gc-pill">
              {home.team.abbreviation} ML: {fmtML(odds.homeTeamOdds.moneyLine)}
            </span>
          )}
          {odds.awayTeamOdds?.moneyLine && (
            <span className="gc-pill">
              {away.team.abbreviation} ML: {fmtML(odds.awayTeamOdds.moneyLine)}
            </span>
          )}
        </div>
      )}

      <div className="gc-actions">
        <button className="btn btn-ghost gc-btn" onClick={analyze} disabled={loading}>
          {loading ? <><span className="spinner" /> Analizando...</> : analysis ? '↻ Reanálizar con IA' : '✦ Analizar con IA'}
        </button>
        {onAddBet && (
          <button
            className="btn btn-ghost gc-btn"
            onClick={() =>
              onAddBet({
                game_id: game.id,
                game_label: `${away.team.abbreviation} vs ${home.team.abbreviation}`,
              })
            }
          >
            + Registrar apuesta
          </button>
        )}
      </div>

      {analysis && (
        <div className="gc-analysis">
          <div className="gc-analysis-label">Análisis IA</div>
          <p className="gc-analysis-text">{analysis}</p>
        </div>
      )}
    </div>
  )
}
