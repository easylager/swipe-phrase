from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.auth.passwords import hash_password, verify_password
from app.infrastructure.db.models import UserModel


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: int) -> UserModel | None:
        result = await self._session.execute(select(UserModel).where(UserModel.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> UserModel | None:
        normalized = email.strip().lower()
        result = await self._session.execute(select(UserModel).where(UserModel.email == normalized))
        return result.scalar_one_or_none()

    async def create(self, email: str, password: str) -> UserModel:
        user = UserModel(
            email=email.strip().lower(),
            password_hash=hash_password(password),
        )
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
        return user

    async def authenticate(self, email: str, password: str) -> UserModel | None:
        user = await self.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            return None
        return user
