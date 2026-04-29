
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routes import auth_router, games, bets, predictions
import os

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"DB init error: {e}")
    yield

app = FastAPI(
    lifespan=lifespan,
    title="NBA Scout API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — en producción reemplazar "*" por tu dominio de frontend
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(games.router)
app.include_router(bets.router)
app.include_router(predictions.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "nba-scout-api"}
