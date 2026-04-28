from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
from .. import models, auth

router = APIRouter(prefix="/predictions", tags=["predictions"])


class PredictionRequest(BaseModel):
    home_team: str
    away_team: str
    home_record: Optional[str] = None
    away_record: Optional[str] = None
    status: Optional[str] = None
    home_score: Optional[str] = None
    away_score: Optional[str] = None
    spread: Optional[str] = None
    over_under: Optional[float] = None
    home_ml: Optional[int] = None
    away_ml: Optional[int] = None


@router.post("/analyze")
def analyze_game(
    req: PredictionRequest,
    _: models.User = Depends(auth.get_current_user),
):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY no configurada")

    client = anthropic.Anthropic(api_key=api_key)

    score_line = f"Score actual: {req.away_score} – {req.home_score}" if req.home_score else ""
    spread_line = f"Spread: {req.spread}" if req.spread else ""
    ou_line = f"Over/Under: {req.over_under}" if req.over_under else ""

    def fmt_ml(ml):
        if ml is None:
            return "N/D"
        return f"+{ml}" if ml > 0 else str(ml)

    ml_line = (
        f"Moneyline: {req.away_team} {fmt_ml(req.away_ml)} | {req.home_team} {fmt_ml(req.home_ml)}"
        if (req.home_ml or req.away_ml)
        else ""
    )

    prompt = f"""Analizá este partido de NBA para apostar:

{req.away_team} (visitante) vs {req.home_team} (local)
Estado: {req.status or "Programado"}
{score_line}
Records: {req.away_team} {req.away_record or "N/D"} | {req.home_team} {req.home_record or "N/D"}
{spread_line}
{ou_line}
{ml_line}

Dá un análisis conciso con:
1. **Favorito** y razón principal (forma reciente, ventaja local, matchups)
2. **Pick recomendado** (spread / moneyline / over-under) con justificación clara
3. **Confianza**: Alta / Media / Baja

Máximo 150 palabras. En español. Sin rodeos ni frases de relleno."""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"analysis": message.content[0].text}
