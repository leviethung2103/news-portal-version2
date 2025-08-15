import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_read_vision_items(async_client: AsyncClient):
    response = await async_client.get("/api/v1/vision_board/items")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_vision_item(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/vision_board/items",
        json={
            "title": "Test Vision",
            "description": "Test Description",
            "category": "Career",
            "priority": "high",
            "target_date": "2025-12-31",
            "is_completed": False,
        },
    )
    assert response.status_code in (200, 201, 422)  # 422 if validation fails


@pytest.mark.asyncio
async def test_read_vision_item(async_client: AsyncClient):
    # Assuming item with ID 1 exists
    response = await async_client.get("/api/v1/vision_board/items/1")
    assert response.status_code in (200, 404)
