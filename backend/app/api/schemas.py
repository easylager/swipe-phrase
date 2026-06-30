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
