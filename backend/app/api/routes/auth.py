from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import _users, get_current_user
from app.api.schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.infrastructure.auth.jwt import create_access_token
from app.infrastructure.db.models import UserModel
from app.infrastructure.db.user_repository import UserRepository

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest, users: UserRepository = Depends(_users)) -> AuthResponse:
    if await users.get_by_email(body.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = await users.create(body.email, body.password)
    token = create_access_token(user_id=user.id, email=user.email)
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, users: UserRepository = Depends(_users)) -> AuthResponse:
    user = await users.authenticate(body.email, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(user_id=user.id, email=user.email)
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(user: UserModel = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)
