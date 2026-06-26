from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.auth.jwt import decode_access_token
from app.infrastructure.db.database import get_session
from app.infrastructure.db.models import UserModel
from app.infrastructure.db.repositories import CardRepository
from app.infrastructure.db.user_repository import UserRepository

_bearer = HTTPBearer(auto_error=False)


def _users(session: AsyncSession = Depends(get_session)) -> UserRepository:
    return UserRepository(session)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    users: UserRepository = Depends(_users),
) -> UserModel:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await users.get_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_card_repo(
    session: AsyncSession = Depends(get_session),
    user: UserModel = Depends(get_current_user),
) -> CardRepository:
    return CardRepository(session, user.id)
