import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.core.config import settings
from app.models.user import User
from app.core.security import get_password_hash

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/test_fastapi_optimized"

# Create test engine and session
engine = create_async_engine(TEST_DATABASE_URL, echo=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

# Create test client
client = TestClient(app)

# Fixture to override the database dependency
async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()

# Apply the override
app.dependency_overrides[get_db] = override_get_db

# Fixture to set up the test database
@pytest.fixture(autouse=True, scope="module")
async def setup_db():
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create a test user
    async with TestingSessionLocal() as session:
        hashed_password = get_password_hash("testpassword")
        db_user = User(
            email="test@example.com",
            hashed_password=hashed_password,
            full_name="Test User",
            is_active=True
        )
        session.add(db_user)
        await session.commit()
    
    yield
    
    # Drop all tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

# Test cases
class TestUserEndpoints:
    async def test_read_user_me(self, setup_db):
        # Test login to get token
        login_data = {
            "username": "test@example.com",
            "password": "testpassword"
        }
        response = client.post("/api/v1/login/access-token", data=login_data)
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # Test getting current user with token
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/users/me", headers=headers)
        assert response.status_code == 200
        assert response.json()["email"] == "test@example.com"
    
    async def test_create_user(self):
        user_data = {
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User"
        }
        response = client.post("/api/v1/users/", json=user_data)
        assert response.status_code == 201
        assert response.json()["email"] == "newuser@example.com"
        assert "hashed_password" not in response.json()
    
    async def test_read_users(self):
        response = client.get("/api/v1/users/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert len(response.json()) > 0

# Test cases for error handling
class TestErrorHandling:
    async def test_read_nonexistent_user(self):
        response = client.get("/api/v1/users/999999")
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"
    
    async def test_create_user_duplicate_email(self):
        user_data = {
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Duplicate User"
        }
        response = client.post("/api/v1/users/", json=user_data)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    async def test_create_user_invalid_email(self):
        user_data = {
            "email": "not-an-email",
            "password": "password123",
            "full_name": "Invalid Email"
        }
        response = client.post("/api/v1/users/", json=user_data)
        assert response.status_code == 422  # Validation error

# Test authentication
class TestAuthentication:
    async def test_login_incorrect_password(self):
        login_data = {
            "username": "test@example.com",
            "password": "wrongpassword"
        }
        response = client.post("/api/v1/login/access-token", data=login_data)
        assert response.status_code == 400
        assert "Incorrect email or password" in response.json()["detail"]
    
    async def test_login_nonexistent_user(self):
        login_data = {
            "username": "nonexistent@example.com",
            "password": "password123"
        }
        response = client.post("/api/v1/login/access-token", data=login_data)
        assert response.status_code == 400
        assert "Incorrect email or password" in response.json()["detail"]
    
    async def test_login_missing_credentials(self):
        # Test with missing username
        login_data = {
            "password": "password123"
        }
        response = client.post("/api/v1/login/access-token", data=login_data)
        assert response.status_code == 422  # Validation error for missing field
        
        # Test with missing password
        login_data = {
            "username": "test@example.com"
        }
        response = client.post("/api/v1/login/access-token", data=login_data)
        assert response.status_code == 422  # Validation error for missing field

# Test authorization
class TestAuthorization:
    async def test_read_users_unauthorized(self):
        # Test with invalid token format
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalidtoken"}
        )
        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]
        
        # Test with missing Authorization header
        response = client.get("/api/v1/users/me")
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]
        
        # Test with invalid token type
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Basic invalidtoken"}
        )
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

# Test user update and deletion
class TestUserModification:
    async def test_update_user(self):
        # First, login to get token
        login_data = {
            "username": "test@example.com",
            "password": "testpassword"
        }
        response = client.post("/api/v1/login/access-token", data=login_data)
        token = response.json()["access_token"]
        
        # Get current user to get user ID
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/users/me", headers=headers)
        user_id = response.json()["id"]
        
        # Update user
        update_data = {
            "full_name": "Updated Name",
            "email": "updated@example.com"
        }
        response = client.put(
            f"/api/v1/users/{user_id}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"
        assert response.json()["email"] == "updated@example.com"
    
    async def test_update_user_password(self):
        # First, login to get token
        login_data = {
            "username": "test@example.com",
            "password": "testpassword"
        }
        response = client.post("/api/v1/login/access-token", data=login_data)
        token = response.json()["access_token"]
        
        # Update password
        update_data = {
            "password": "newsecurepassword123"
        }
        response = client.put(
            "/api/v1/users/me/password",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        # Verify new password works
        login_data["password"] = "newsecurepassword123"
        response = client.post("/api/v1/login/access-token", data=login_data)
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    async def test_delete_user(self):
        # First, create a new user
        user_data = {
            "email": "tobedeleted@example.com",
            "password": "password123",
            "full_name": "To Be Deleted"
        }
        response = client.post("/api/v1/users/", json=user_data)
        user_id = response.json()["id"]
        
        # Login as admin
        login_data = {
            "username": "test@example.com",
            "password": "testpassword"
        }
        response = client.post("/api/v1/login/access-token", data=login_data)
        token = response.json()["access_token"]
        
        # Delete the user
        response = client.delete(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 204
        
        # Verify user no longer exists
        response = client.get(f"/api/v1/users/{user_id}")
        assert response.status_code == 404
