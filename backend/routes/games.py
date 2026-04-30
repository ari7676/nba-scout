from fastapi import APIRouter, Query, Depends
from typing import Optional
import httpx
import os
from .. import models, auth

router = APIRouter(prefix="/games", tags=["games"])

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
ODDS_API_KEY = os.getenv("ODDS_API_KEY", "")  # https://the-odds-api.com — free tier


@router.get("/scoreboard")
async def scoreboard(
    date: Optional[str] = Query(default=None),
    seasontype: Optional[str] = Query(default=None),
    _: models.User = Depends(auth.get_current_user),
):
    url = f"{ESPN_BASE}/scoreboard"
    params = {}
    if date: params["dates"] = date
    if seasontype: params["seasontype"] = seasontype
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()

@router.get("/standings")
async def standings(_: models.User = Depends(auth.get_current_user)):
    """Tabla de posiciones NBA."""
    url = f"{ESPN_BASE}/standings"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()


@router.get("/teams/{team_id}")
async def team_detail(team_id: str, _: models.User = Depends(auth.get_current_user)):
    """Detalle + estadísticas de un equipo."""
    url = f"{ESPN_BASE}/teams/{team_id}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()


@router.get("/odds")
async def live_odds(_: models.User = Depends(auth.get_current_user)):
    """Odds en vivo desde The Odds API (requiere ODDS_API_KEY en .env)."""
    if not ODDS_API_KEY:
        return {"error": "Configurá ODDS_API_KEY en las variables de entorno"}
    url = "https://api.the-odds-api.com/v4/sports/basketball_nba/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": "h2h,spreads,totals",
        "oddsFormat": "american",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()


@router.get("/news")
async def news(_: models.User = Depends(auth.get_current_user)):
    """Noticias NBA desde ESPN."""
    url = f"{ESPN_BASE}/news"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()


@router.get("/playoffs")
async def playoffs(_: models.User = Depends(auth.get_current_user)):
    from datetime import datetime, timedelta
    all_events = []
    seen = set()
    async with httpx.AsyncClient(timeout=10) as client:
        for i in range(7):
            d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y%m%d")
            r = await client.get(f"{ESPN_BASE}/scoreboard", params={"seasontype": "3", "dates": d, "limit": "50"})
            if r.status_code == 200:
                for ev in r.json().get("events", []):
                    if ev["shortName"] not in seen:
                        seen.add(ev["shortName"])
                        all_events.append(ev)
    return {"events": all_events}
        
