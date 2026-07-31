# Phrase Feed

TikTok-style web app for learning **your own** English phrases with FSRS spaced repetition.

## Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite + FSRS
- **Frontend:** Next.js 15 + Framer Motion + Web Speech API (TTS)

## Quick start (local)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> If port 8000 is busy, run backend on `--port 8001` and set `NEXT_PUBLIC_API_URL=http://localhost:8001` in `frontend/.env.local`.

## LLM Overview (бесплатно)

При добавлении карточки нейросеть **в фоне** пишет короткий обзор: сленг, контекст, примеры.

### Вариант 1: Ollama (рекомендуется, 100% бесплатно)

```bash
# Установи Ollama: https://ollama.com
ollama pull llama3.2
ollama serve   # обычно уже запущен
```

В `backend/.env`:
```
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

### Вариант 2: Groq (бесплатный tier, нужен ключ)

1. Ключ на [console.groq.com](https://console.groq.com)
2. В `backend/.env`:
```
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

### Отключить

```
LLM_PROVIDER=none
```

На карточке появится кнопка **Обзор** — tap открывает bottom sheet с объяснением.

## Docker (local)

```bash
docker compose up --build
```

## Deploy (Railway)

See **[DEPLOY.md](./DEPLOY.md)** — GitHub → Railway, два сервиса (backend + frontend).

> **Ollama не работает в облаке.** На Railway используй Groq или `LLM_PROVIDER=none`.

## How it works

1. **Add cards** — English phrase, translation, optional context & cluster
2. **Swipe feed** — tap to flip (translation → English), then rate: Не знаю / Знаю / Выучил
3. **Session builder** — mixes due (30%), weak (25%), new (20%), cluster (15%), refresh (10%)
4. **FSRS** — adaptive scheduling based on your answers + flip/answer latency

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness (+ `X-Request-ID`) |
| GET | `/health/db` | DB readiness / diagnostics |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/session` | Build swipe session queue |
| POST | `/api/cards` | Create card |
| POST | `/api/cards/{id}/review` | Submit review |
| GET | `/api/stats` | Progress stats |

Every response includes `X-Request-ID` for client/server correlation.
