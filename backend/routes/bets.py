from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/bets", tags=["bets"])


@router.post("/", response_model=schemas.BetOut, status_code=201)
def create_bet(
    bet: schemas.BetCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    db_bet = models.Bet(**bet.model_dump(), user_id=user.id)
    db.add(db_bet)
    db.commit()
    db.refresh(db_bet)
    return db_bet


@router.get("/", response_model=List[schemas.BetOut])
def list_bets(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Bet)
        .filter(models.Bet.user_id == user.id)
        .order_by(models.Bet.created_at.desc())
        .all()
    )


@router.get("/stats", response_model=schemas.BetStats)
def bet_stats(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    bets = db.query(models.Bet).filter(models.Bet.user_id == user.id).all()
    won = [b for b in bets if b.result == models.BetResult.won]
    lost = [b for b in bets if b.result == models.BetResult.lost]
    pending = [b for b in bets if b.result == models.BetResult.pending]

    pnl = 0.0
    for b in won:
        try:
            o = float(b.odds or "0")
            pnl += b.amount * (o / 100) if o > 0 else b.amount * (100 / abs(o))
        except (ValueError, ZeroDivisionError):
            pass
    for b in lost:
        pnl -= b.amount

    invested = sum(b.amount for b in bets)
    settled = len(won) + len(lost)
    win_rate = (len(won) / settled * 100) if settled else 0.0

    return schemas.BetStats(
        total=len(bets),
        won=len(won),
        lost=len(lost),
        pending=len(pending),
        pnl=round(pnl, 2),
        invested=round(invested, 2),
        win_rate=round(win_rate, 1),
    )


@router.patch("/{bet_id}", response_model=schemas.BetOut)
def update_bet(
    bet_id: int,
    update: schemas.BetUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    bet = (
        db.query(models.Bet)
        .filter(models.Bet.id == bet_id, models.Bet.user_id == user.id)
        .first()
    )
    if not bet:
        raise HTTPException(status_code=404, detail="Apuesta no encontrada")
    for k, v in update.model_dump(exclude_none=True).items():
        setattr(bet, k, v)
    db.commit()
    db.refresh(bet)
    return bet


@router.delete("/{bet_id}", status_code=204)
def delete_bet(
    bet_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    bet = (
        db.query(models.Bet)
        .filter(models.Bet.id == bet_id, models.Bet.user_id == user.id)
        .first()
    )
    if not bet:
        raise HTTPException(status_code=404, detail="Apuesta no encontrada")
    db.delete(bet)
    db.commit()
