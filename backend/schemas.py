from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models import BetResult


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class BetCreate(BaseModel):
    game_id: Optional[str] = None
    game_label: str
    pick: str
    odds: Optional[str] = None
    amount: float
    notes: Optional[str] = None


class BetUpdate(BaseModel):
    result: Optional[BetResult] = None
    notes: Optional[str] = None


class BetOut(BaseModel):
    id: int
    game_id: Optional[str] = None
    game_label: str
    pick: str
    odds: Optional[str] = None
    amount: float
    result: BetResult
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BetStats(BaseModel):
    total: int
    won: int
    lost: int
    pending: int
    pnl: float
    invested: float
    win_rate: float
