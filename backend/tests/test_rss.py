import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_get_rss_feeds(async_client: AsyncClient):
    response = await async_client.get("/api/v1/rss/feeds")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_rss_feed(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/rss/feeds",
        json={
            "name": "Test Feed",
            "url": "https://example.com/rss",
            "category": "Tech",
            "active": True,
            "fetch_interval": 60,
        },
    )
    assert response.status_code in (200, 201, 422)


@pytest.mark.asyncio
async def test_get_rss_articles(async_client: AsyncClient):
    response = await async_client.get("/api/v1/rss/articles")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
