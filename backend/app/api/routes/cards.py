from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.api.schemas import (
    CardResponse,
    CreateCardRequest,
    DailyStatsResponse,
    RequestOverviewBody,
    StatsResponse,
    SubmitReviewRequest,
    UpdateCardRequest,
)
from app.api.deps import get_card_repo, get_current_user
from app.application.use_cases.generate_overview import generate_overview_for_card
from app.domain.entities.card import ReviewRating
from app.infrastructure.config.settings import settings
from app.infrastructure.db.models import CardModel, UserModel
from app.infrastructure.db.repositories import CardRepository
from app.infrastructure.llm.factory import get_overview_generator

router = APIRouter(prefix="/api", tags=["cards"])


def _repo(repo: CardRepository = Depends(get_card_repo)) -> CardRepository:
    return repo


def _to_response(
    card: CardModel,
    *,
    state: str | None = None,
    due: str | None = None,
    bucket: str | None = None,
) -> CardResponse:
    schedule = card.schedule
    return CardResponse(
        id=card.id,
        english=card.english,
        translation=card.translation,
        context=card.context,
        cluster=card.cluster,
        overview=card.overview,
        overview_status=card.overview_status or "skipped",
        state=state or (schedule.state if schedule else "new"),
        due=due or (schedule.due.isoformat() if schedule else ""),
        bucket=bucket,
    )


def _candidate_to_response(candidate) -> CardResponse:
    return CardResponse(
        id=candidate.card_id,
        english=candidate.english,
        translation=candidate.translation,
        context=candidate.context,
        cluster=candidate.cluster,
        overview=candidate.overview,
        overview_status=candidate.overview_status,
        state=candidate.state.value,
        due=candidate.due.isoformat(),
        bucket=candidate.bucket,
    )


def _enqueue_overview(background_tasks: BackgroundTasks, card_id: int, user_id: int) -> None:
    if get_overview_generator():
        background_tasks.add_task(generate_overview_for_card, card_id, user_id)


def _needs_llm_generation(status: str, content: str | None, *, force: bool) -> bool:
    if force:
        return True
    if status == "generating":
        return False
    if status == "ready" and content:
        return False
    return status in ("idle", "failed", "pending")


def _needs_overview_generation(status: str, overview: str | None, *, force: bool) -> bool:
    return _needs_llm_generation(status, overview, force=force)


@router.post("/cards", response_model=CardResponse)
async def create_card(
    body: CreateCardRequest,
    repo: CardRepository = Depends(_repo),
) -> CardResponse:
    card = await repo.create(
        english=body.english,
        translation=body.translation,
        context=body.context,
        cluster=body.cluster,
    )
    if not card or not card.schedule:
        raise HTTPException(status_code=500, detail="Failed to create card")

    return _to_response(card)


@router.get("/cards", response_model=list[CardResponse])
async def list_cards(repo: CardRepository = Depends(_repo)) -> list[CardResponse]:
    cards = await repo.list_all()
    return [_to_response(c) for c in cards]


@router.get("/session", response_model=list[CardResponse])
async def get_session(repo: CardRepository = Depends(_repo)) -> list[CardResponse]:
    session_cards = await repo.build_session()
    return [_candidate_to_response(c) for c in session_cards]


@router.get("/cards/{card_id}", response_model=CardResponse)
async def get_card(card_id: int, repo: CardRepository = Depends(_repo)) -> CardResponse:
    card = await repo.get_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return _to_response(card)


@router.patch("/cards/{card_id}", response_model=CardResponse)
async def update_card(
    card_id: int,
    body: UpdateCardRequest,
    repo: CardRepository = Depends(_repo),
) -> CardResponse:
    card, _english_changed = await repo.update(
        card_id,
        english=body.english,
        translation=body.translation,
        context=body.context,
        cluster=body.cluster,
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    return _to_response(card)


@router.post("/cards/{card_id}/overview", response_model=CardResponse)
async def request_overview(
    card_id: int,
    body: RequestOverviewBody,
    background_tasks: BackgroundTasks,
    user: UserModel = Depends(get_current_user),
    repo: CardRepository = Depends(_repo),
) -> CardResponse:
    """Generate overview on demand — cached result is returned without calling LLM."""
    if not get_overview_generator():
        raise HTTPException(status_code=503, detail="LLM overview is disabled")

    card = await repo.get_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if _needs_overview_generation(card.overview_status, card.overview, force=body.force):
        if body.force:
            card.overview = None
        await repo.set_overview_status(card_id, "generating")
        _enqueue_overview(background_tasks, card_id, user.id)

    card = await repo.get_by_id(card_id)
    return _to_response(card)  # type: ignore[arg-type]


@router.post("/cards/{card_id}/overview/regenerate", response_model=CardResponse)
async def regenerate_overview(
    card_id: int,
    background_tasks: BackgroundTasks,
    user: UserModel = Depends(get_current_user),
    repo: CardRepository = Depends(_repo),
) -> CardResponse:
    """Force a fresh overview (retry after failure or manual refresh)."""
    return await request_overview(
        card_id,
        RequestOverviewBody(force=True),
        background_tasks,
        user,
        repo,
    )


@router.post("/cards/{card_id}/review", response_model=CardResponse)
async def submit_review(
    card_id: int,
    body: SubmitReviewRequest,
    user: UserModel = Depends(get_current_user),
    repo: CardRepository = Depends(_repo),
) -> CardResponse:
    try:
        rating = ReviewRating(body.rating)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid rating") from exc

    card = await repo.submit_review(
        card_id=card_id,
        rating=rating,
        flip_latency_ms=body.flip_latency_ms,
        answer_latency_ms=body.answer_latency_ms,
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if body.combo_after and rating in (ReviewRating.GOOD, ReviewRating.GRADUATED):
        await repo.record_combo(body.combo_after)

    return _to_response(card)


@router.get("/llm/status")
async def llm_status() -> dict:
    import httpx

    provider = settings.llm_provider
    if provider == "none":
        return {"provider": "none", "available": False, "message": "LLM отключён"}

    if provider == "groq":
        available = bool(settings.groq_api_key)
        return {
            "provider": "groq",
            "available": available,
            "message": "Groq готов" if available else "Нужен GROQ_API_KEY в backend/.env",
        }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
            r.raise_for_status()
            models = [m["name"] for m in r.json().get("models", [])]
            model_ok = any(settings.ollama_model.split(":")[0] in m for m in models)
            return {
                "provider": "ollama",
                "available": model_ok,
                "models": models,
                "message": "Ollama готов" if model_ok else f"Модель {settings.ollama_model} не скачана. Запусти: ollama pull {settings.ollama_model}",
            }
    except Exception as exc:
        return {
            "provider": "ollama",
            "available": False,
            "message": f"Ollama не запущен. Запусти: brew services start ollama ({exc})",
        }


@router.get("/stats", response_model=StatsResponse)
async def get_stats(repo: CardRepository = Depends(_repo)) -> StatsResponse:
    stats = await repo.get_stats()
    return StatsResponse(**stats)


@router.get("/stats/daily", response_model=DailyStatsResponse)
async def get_daily_stats(
    days: int = 14,
    repo: CardRepository = Depends(_repo),
) -> DailyStatsResponse:
    data = await repo.get_swipes_by_day(days=days)
    return DailyStatsResponse(**data)
