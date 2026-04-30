import { useState, useEffect } from 'react'
import api from '../api'
import './Standings.css'

const ROUND_NAMES = {
  1: 'PRIMERA RONDA',
  2: 'SEMIFINALES DE CONF.',
  3: 'FINALES DE CONF.',
  4: 'FINALES NBA',
}

// Datos reales NBA Playoffs 2025-26 (primera ronda en curso)
const STATIC_BRACKET = {
  east: [
    { s1: 'DET', seed1: 1, wins1: 0, s2: 'ORL', seed2: 8, wins2: 1, status: 'ORL lidera 1-0' },
    { s1: 'CLE', seed1: 2, wins1: 2, s2: 'MIA', seed2: 7, wins2: 0, status: 'CLE lidera 2-0' },
    { s1: 'NYK', seed1: 3, wins1: 0, s2: 'ATL', seed2: 6, wins2: 0, status: 'Por comenzar' },
    { s1: 'IND', seed1: 4, wins1: 0, s2: 'TOR', seed2: 5, wins2: 0, status: 'Por comenzar' },
  ],
  west: [
    { s1: 'OKC', seed1: 1, wins1: 1, s2: 'PHX', seed2: 8, wins2: 0, status: 'OKC lidera 1-0' },
    { s1: 'SA',  seed1: 2, wins1: 1, s2: 'POR', seed2: 7, wins2: 1, status: 'Serie 1-1' },
    { s1: 'DEN', seed1: 3, wins1: 1, s2: 'MIN', seed2: 6, wins2: 1, status: 'Serie 1-1' },
    { s1: 'LAL', seed1: 4, wins1: 2, s2: 'HOU', seed2: 5, wins2: 0, status: 'LAL lidera 2-0' },
  ],
}

export default function Standings() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [useStatic, setUseStatic] = useState(false)

  useEffect(() => {
  async function load() {
    try {
      const res = await api.get('/games/playoffs')
      const events = res.data?.events || []
      if (events.length > 0) {
        const updates = {}
        for (const ev of events) {
          const comp = ev.competitions?.[0]
          const key = ev.shortName
          if (!updates[key]) {
            const home = comp.competitors.find(c => c.homeAway === 'home')
            const away = comp.competitors.find(c => c.homeAway === 'away')
            const summary = comp.series?.summary || ''
            const match = summary.match(/(\d+)-(\d+)/)
            const wins = match ? [parseInt(match[1]), parseInt(match[2])] : [0, 0]
            const leaderAbbr = summary.split(' ')[0]
            const homeLeads = home?.team?.abbreviation === leaderAbbr
            updates[`${away?.team?.abbreviation} @ ${home?.team?.abbreviation}`] = {
              homeWins: homeLeads ? wins[0] : wins[1],
              awayWins: homeLeads ? wins[1] : wins[0],
              status: summary,
            }
          }
        }
        // Actualizar static bracket con datos reales
        const merge = (matchups) => matchups.map(m => {
          const key = `${m.s2} @ ${m.s1}`
          const upd = updates[key]
          if (!upd) return m
          const w1 = upd.homeWins, w2 = upd.awayWins
          const leader = w1 > w2 ? m.s1 : w2 > w1 ? m.s2 : null
          return { ...m, wins1: w1, wins2: w2,
            status: leader ? `${leader} lidera ${Math.max(w1,w2)}-${Math.min(w1,w2)}` : `Serie ${w1}-${w2}` }
        })
        STATIC_BRACKET.east = merge(STATIC_BRACKET.east)
        STATIC_BRACKET.west = merge(STATIC_BRACKET.west)
      }
    } catch {}
    setUseStatic(true)
    setLoading(false)
  }
  load()
}, [])

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, color:'var(--muted)', minHeight:'60vh' }}>
      <span className="spinner" /> Cargando Playoffs...
    </div>
  )

  return (
    <div className="page">
      <div className="playoffs-header">
        <h1 className="playoffs-title">🏆 NBA PLAYOFFS 2025-26</h1>
        <a href="https://www.nba.com/playoffs" target="_blank" rel="noreferrer" className="playoffs-link">
          Ver en NBA.com →
        </a>
      </div>

      {useStatic || series.length === 0 ? (
        // Bracket estático con datos reales actualizados
        <>
          {[['CONFERENCIA ESTE', STATIC_BRACKET.east], ['CONFERENCIA OESTE', STATIC_BRACKET.west]].map(([title, matchups]) => (
            <div key={title} className="conf-bracket">
              <div className="conf-bracket-title">{title}</div>
              <div className="bracket-round">
                <div className="round-label">PRIMERA RONDA — EN CURSO</div>
                <div className="matchups-row">
                  {matchups.map((m, i) => (
                    <div key={i} className={`series-card ${m.wins1 === 4 || m.wins2 === 4 ? 'series-over' : ''}`}>
                      <div className={`series-team ${m.wins1 > m.wins2 ? 'series-team--winner' : ''}`}>
                        <span className="series-seed mono">#{m.seed1}</span>
                        <span className="series-abbr">{m.s1}</span>
                        <span className="series-wins mono">{m.wins1}</span>
                      </div>
                      <div className="series-vs mono">VS</div>
                      <div className={`series-team ${m.wins2 > m.wins1 ? 'series-team--winner' : ''}`}>
                        <span className="series-seed mono">#{m.seed2}</span>
                        <span className="series-abbr">{m.s2}</span>
                        <span className="series-wins mono">{m.wins2}</span>
                      </div>
                      <div className="series-score mono">{m.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 16 }}>
            * Datos actualizados al 28/04/2026. Actualizaciones en tiempo real próximamente.
          </p>
        </>
      ) : (
        // Datos dinámicos de ESPN
        <DynamicBracket series={series} />
      )}
    </div>
  )
}

function DynamicBracket({ series }) {
  const east = {}, west = {}, finals = {}

  for (const s of series) {
    const round = s.bracketRound || 1
    const col = s.bracketColumnIndex || 0
    let bucket = round >= 4 ? finals : col <= 3 ? east : west
    if (!bucket[round]) bucket[round] = []
    bucket[round].push(s)
  }

  return (
    <>
      {[['CONFERENCIA ESTE', east], ['CONFERENCIA OESTE', west]].map(([title, rounds]) => (
        Object.keys(rounds).length > 0 && (
          <div key={title} className="conf-bracket">
            <div className="conf-bracket-title">{title}</div>
            {Object.entries(rounds).sort(([a],[b]) => a-b).map(([round, matchups]) => (
              <div key={round} className="bracket-round">
                <div className="round-label">{ROUND_NAMES[round] || `RONDA ${round}`}</div>
                <div className="matchups-row">
                  {matchups.map((s, i) => <SeriesCard key={i} s={s} />)}
                </div>
              </div>
            ))}
          </div>
        )
      ))}
      {Object.keys(finals).length > 0 && (
        <div className="conf-bracket">
          <div className="conf-bracket-title">🏆 FINALES NBA</div>
          <div className="matchups-row" style={{ justifyContent:'center' }}>
            {Object.values(finals).flat().map((s, i) => <SeriesCard key={i} s={s} big />)}
          </div>
        </div>
      )}
    </>
  )
}

function SeriesCard({ s, big }) {
  const c = s.competitors || []
  const t1 = c[0], t2 = c[1]
  if (!t1 || !t2) return null
  const w1 = t1.wins || 0, w2 = t2.wins || 0
  const done = w1 === 4 || w2 === 4
  const winner = w1 === 4 ? t1 : w2 === 4 ? t2 : null

  return (
    <div className={`series-card ${done ? 'series-over' : ''} ${big ? 'series-card--big' : ''}`}>
      <div className={`series-team ${winner === t1 ? 'series-team--winner' : ''}`}>
        {t1?.team?.logos?.[0]?.href && <img src={t1.team.logos[0].href} alt="" className="series-logo" onError={e => e.target.style.display='none'} />}
        <span className="series-seed mono">#{t1?.seed}</span>
        <span className="series-abbr">{t1?.team?.abbreviation}</span>
        <span className={`series-wins mono ${winner === t1 ? 'series-wins--winner' : ''}`}>{w1}</span>
      </div>
      <div className="series-vs mono">VS</div>
      <div className={`series-team ${winner === t2 ? 'series-team--winner' : ''}`}>
        {t2?.team?.logos?.[0]?.href && <img src={t2.team.logos[0].href} alt="" className="series-logo" onError={e => e.target.style.display='none'} />}
        <span className="series-seed mono">#{t2?.seed}</span>
        <span className="series-abbr">{t2?.team?.abbreviation}</span>
        <span className={`series-wins mono ${winner === t2 ? 'series-wins--winner' : ''}`}>{w2}</span>
      </div>
      {done && winner && <div className="series-result mono">✓ {winner.team?.abbreviation} AVANZA</div>}
      {!done && (w1 > 0 || w2 > 0) && <div className="series-score mono">{w1} – {w2}</div>}
    </div>
  )
}
