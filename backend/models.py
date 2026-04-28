from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class BetResult(str, enum.Enum):
    pending = "pending"
    won = "won"
    lost = "lost"
    void = "void"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    bets = relationship("Bet", back_populates="user", cascade="all, delete-orphan")


class Bet(Base):
    __tablename__ = "bets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_id = Column(String(100))
    game_label = Column(String(200), nullable=False)   # "LAL vs GSW"
    pick = Column(String(200), nullable=False)          # "LAL -3.5"
    odds = Column(String(20))                           # "-110" o "+150"
    amount = Column(Float, nullable=False)
    result = Column(SAEnum(BetResult), default=BetResult.pending)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bets")
