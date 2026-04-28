# 🏀 NBA Scout

Plataforma de análisis de partidos NBA con predicciones IA y seguimiento de apuestas.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + Python |
| Base de datos | PostgreSQL |
| Auth | JWT (python-jose) |
| IA | Claude claude-sonnet-4-20250514 (Anthropic) |
| Datos NBA | ESPN API (gratis, sin clave) |
| Odds | The Odds API (free tier: 500 req/mes) |
| Frontend | React + Vite |
| Deploy | Railway |

---

## Desarrollo local

### 1. Requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL corriendo localmente (o Docker)

### 2. Backend

```bash
# Desde la raíz del proyecto
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp ../.env.example ../.env
# Editá el .env con tus valores

# Crear la base de datos
createdb nba_scout   # o con psql

# Iniciar el servidor
uvicorn backend.main:app --reload --port 8000
```

La API estará en http://localhost:8000  
Documentación interactiva: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variable de entorno (opcional, el proxy de Vite lo maneja)
# Si desplegás frontend y backend por separado, creá un .env.local:
# VITE_API_URL=http://localhost:8000

# Iniciar en modo desarrollo
npm run dev
```

El frontend estará en http://localhost:5173

---

## Variables de entorno

Copiá `.env.example` a `.env` y completá:

```env
DATABASE_URL=postgresql://user:password@localhost/nba_scout
SECRET_KEY=tu-clave-secreta-aleatoria   # openssl rand -hex 32
ANTHROPIC_API_KEY=sk-ant-...
ODDS_API_KEY=                            # Opcional
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Deploy en Railway

### Opción A — Monorepo (recomendado)

1. **Crear proyecto en [railway.app](https://railway.app)**

2. **Agregar un PostgreSQL plugin**  
   En el dashboard del proyecto → New → Database → PostgreSQL  
   Railway agrega automáticamente `DATABASE_URL` como variable de entorno.

3. **Conectar el repositorio**  
   New Service → GitHub Repo → seleccioná este repo

4. **Configurar el servicio de backend**  
   - Root Directory: `/` (raíz)  
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`  
   - Variables de entorno:
     ```
     SECRET_KEY=<generá con openssl rand -hex 32>
     ANTHROPIC_API_KEY=sk-ant-...
     ODDS_API_KEY=<opcional>
     ALLOWED_ORIGINS=https://tu-frontend.up.railway.app
     ```

5. **Configurar el servicio de frontend**  
   New Service → GitHub Repo → mismo repo  
   - Root Directory: `frontend`  
   - Build Command: `npm install && npm run build`  
   - Start Command: `npx serve dist -l $PORT`  
   - Variables de entorno:
     ```
     VITE_API_URL=https://tu-backend.up.railway.app
     ```
   - O configurá el `vite.config.js` con la URL del backend

### Opción B — Deploy separado

Backend → Railway  
Frontend → Vercel / Netlify (más simple para el frontend)

En Vercel:
1. Importar el repo
2. Set Root Directory: `frontend`
3. Agregar env var: `VITE_API_URL=https://tu-backend.up.railway.app`

---

## Estructura del proyecto

```
nba-scout/
├── backend/
│   ├── main.py              # FastAPI app + CORS
│   ├── database.py          # SQLAlchemy engine
│   ├── models.py            # User, Bet (tablas)
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # JWT utilities
│   └── routes/
│       ├── auth_router.py   # /auth/register, /auth/login, /auth/me
│       ├── games.py         # /games/scoreboard, /games/standings, /games/odds
│       ├── bets.py          # /bets/ CRUD + /bets/stats
│       └── predictions.py   # /predictions/analyze (Claude IA)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx    # Scoreboard + análisis IA
│       │   ├── Bets.jsx         # Tracker de apuestas
│       │   └── Standings.jsx    # Tabla de posiciones
│       └── components/
│           ├── NavBar.jsx
│           └── GameCard.jsx     # Card con score + odds + IA
├── Procfile
├── .env.example
└── README.md
```

---

## APIs usadas

| API | URL | Auth | Límite |
|-----|-----|------|--------|
| ESPN NBA Scoreboard | `site.api.espn.com` | Sin clave | Sin límite conocido |
| ESPN Standings | `site.api.espn.com` | Sin clave | Sin límite conocido |
| The Odds API | `api.the-odds-api.com` | API key | 500 req/mes (gratis) |
| Anthropic Claude | `api.anthropic.com` | API key | Según plan |

---

## Próximas mejoras sugeridas

- [ ] Notificaciones push cuando empieza un partido
- [ ] Gráficos de P&L con Chart.js
- [ ] Soporte multi-usuario con roles (admin / usuario)
- [ ] Alertas de líneas cuando el spread cambia mucho
- [ ] Integración con BallDontLie para stats históricas por jugador
- [ ] Modo comparación head-to-head de dos equipos
