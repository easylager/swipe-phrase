from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CreateCardRequest(BaseModel):
    english: str = Field(..., min_length=1, max_length=500)
    translation: str = Field(..., min_length=1, max_length=500)
    context: str | None = Field(None, max_length=2000)
    cluster: str | None = Field(None, max_length=100)


class UpdateCardRequest(BaseModel):
    english: str = Field(..., min_length=1, max_length=500)
    translation: str = Field(..., min_length=1, max_length=500)
    context: str | None = Field(None, max_length=2000)
    cluster: str | None = Field(None, max_length=100)


class SubmitReviewRequest(BaseModel):
    rating: str = Field(..., pattern="^(again|good|graduated)$")
    flip_latency_ms: int | None = Field(None, ge=0)
    answer_latency_ms: int | None = Field(None, ge=0)
    combo_after: int | None = Field(None, ge=0, le=9999)


class RequestOverviewBody(BaseModel):
    """force=true re-generates even when a cached overview exists."""
    force: bool = False


class SnoozeCardRequest(BaseModel):
    days: int = Field(..., ge=2, le=30)


class CardResponse(BaseModel):
    id: int
    english: str
    translation: str
    context: str | None
    cluster: str | None
    overview: str | None = None
    overview_status: str = "skipped"
    state: str
    due: str
    bucket: str | None = None

    model_config = {"from_attributes": True}


class StatsResponse(BaseModel):
    swipes_today: int
    best_combo_today: int = 0


class DailySwipeStat(BaseModel):
    date: str
    count: int


class DailyStatsResponse(BaseModel):
    days: list[DailySwipeStat]
    total: int


class VocabularyItemResponse(BaseModel):
    id: int
    english: str
    translation: str
    cluster: str | None
    state: str
    known_count: int
    total_count: int
    success_rate: float | None = None
    lapses: int = 0


class VocabularyStatsResponse(BaseModel):
    total_words: int
    with_stats: int
    without_stats: int
    items: list[VocabularyItemResponse]


class MatchdayDayResult(BaseModel):
    date: str
    total: int
    known: int
    accuracy: float
    completed: bool


class MatchdayMvpWord(BaseModel):
    card_id: int
    english: str
    delta_accuracy: float
    today_accuracy: float
    previous_accuracy: float


class SquadPlayerResponse(BaseModel):
    id: str
    name: str
    full_name: str
    position: str
    number: int
    era: str
    rarity: str
    metric: str
    target: int
    current: int
    progress: float
    unlocked: bool
    unlock_hint: str
    moment: str


class SquadCollectionResponse(BaseModel):
    total: int
    unlocked_count: int
    wc2026_total: int
    wc2026_unlocked: int
    players: list[SquadPlayerResponse]
    next_unlock: SquadPlayerResponse | None = None


class MatchdayStatsResponse(BaseModel):
    date: str
    target_reviews: int
    target_accuracy: float
    today_total: int
    today_known: int
    today_accuracy: float
    today_completed: bool
    today_result: str | None = None
    unbeaten_run: int
    form_last5: list[MatchdayDayResult]
    xp_total: int
    level: int
    xp_in_level: int
    xp_to_next_level: int
    season_progress: float
    season_name: str
    mvp_word: MatchdayMvpWord | None = None
