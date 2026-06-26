# Deploy на Railway

## Короткий ответ про нейросеть

**Ollama на Railway не заработает** — это локальный сервер на твоём Mac, в облаке его нет.

Варианты для production:

| Вариант | Что делать |
|---------|------------|
| **Groq** (рекомендуется) | Бесплатный tier, ключ на [console.groq.com](https://console.groq.com) |
| **Без обзора** | `LLM_PROVIDER=none` — всё остальное работает |

Свайпы, карточки, FSRS, статистика, реклама — **всё это деплоится нормально**.

---

## Шаг 1 — GitHub

```bash
cd phrase-feed
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/phrase-feed.git
git push -u origin main
```

---

## Шаг 2 — Railway: два сервиса

В [railway.app](https://railway.app) создай проект → **Deploy from GitHub repo**.

### Сервис 1: Backend

| Настройка | Значение |
|-----------|----------|
| Root Directory | `backend` |
| Builder | Dockerfile |

**Variables:**

```
DATABASE_URL=sqlite+aiosqlite:///./data/phrase_feed.db
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
JWT_SECRET=your-random-secret-at-least-32-chars
```

**Volume (обязательно для SQLite + auth):**

- Mount path: `/app/data`
- Size: 1 GB
- **Replicas: 1** (Settings → Scaling) — SQLite не работает с несколькими инстансами

Без volume или с 2+ репликами: регистрация «успешна», но карточки падают с **User not found**, логин — **Invalid email or password**.

**Лучше для production:** добавь **PostgreSQL** в Railway (New → Database → PostgreSQL), подключи к backend — `DATABASE_URL` подставится автоматически. Тогда volume для SQLite не нужен.

После деплоя проверь:
```bash
curl https://YOUR-BACKEND.up.railway.app/health/db
# → {"status":"ok","backend":"sqlite","users":0}
```

После деплоя скопируй публичный URL бэкенда, например:
`https://phrase-feed-backend.up.railway.app`

---

### Сервис 2: Frontend

| Настройка | Значение |
|-----------|----------|
| Root Directory | `frontend` |
| Builder | Dockerfile |

**Variables (важно: нужны на этапе build):**

```
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.up.railway.app
```

Railway → Settings → **Generate Domain** для обоих сервисов.

---

## Шаг 3 — Связать CORS

После получения URL фронтенда обнови variable на бэкенде:

```
FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
```

Redeploy backend.

---

## Проверка

```bash
curl https://YOUR-BACKEND.up.railway.app/health
# → {"status":"ok"}
```

Открой URL фронтенда в браузере.

---

## Локальная разработка (как раньше)

```bash
# Backend
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8001

# Frontend
cd frontend && npm run dev:clean
```

Ollama локально:
```
LLM_PROVIDER=ollama
```

---

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| CORS error | Проверь `FRONTEND_URL` на backend |
| API не отвечает | Проверь `NEXT_PUBLIC_API_URL` на frontend, redeploy frontend |
| Обзор не генерится | Groq ключ или `LLM_PROVIDER=none` |
| Данные пропали | Подключи Volume на `/app/data` или PostgreSQL |
| User not found после регистрации | Volume + **1 replica**, или перейди на PostgreSQL |
| Invalid email or password после регистрации | База сбросилась — зарегистрируйся заново, почини persistence |
| Build frontend падает | `NEXT_PUBLIC_API_URL` должен быть задан до build |
