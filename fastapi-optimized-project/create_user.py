import asyncio
from getpass import getpass
from app.db.session import async_session_factory, Base, engine
from app.models import (
    user,
    rss,
    vision_board,
    project,
    vision_board,
)  # and any other models, including VisionItem if it's in another file
from app.models.user import User
from app.core.security import get_password_hash


async def create_user(email: str, password: str, full_name: str, is_active: bool = True):
    async with async_session_factory() as session:
        # Check if user already exists
        result = await session.execute(User.__table__.select().where(User.email == email))
        existing = result.first()
        if existing:
            print(f"User with email {email} already exists.")
            return
        hashed_password = get_password_hash(password)
        user = User(email=email, hashed_password=hashed_password, full_name=full_name, is_active=is_active)
        session.add(user)
        await session.commit()
        print(f"User {email} created successfully.")


async def main():
    print("Create a new user")
    email = input("Email: ").strip()
    password = getpass("Password: ")
    full_name = input("Full name: ").strip()
    await create_user(email, password, full_name)


if __name__ == "__main__":
    # Ensure tables exist
    async def setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(setup())
    asyncio.run(main())
