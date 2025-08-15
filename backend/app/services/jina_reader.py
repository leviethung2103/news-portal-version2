"""
Jina Reader API client with retry mechanism.
"""

import os
import httpx
import asyncio
from typing import Optional
import logging

# logging.basicConfig(level=logging.INFO)


JINA_READER_API = "https://r.jina.ai/"
JINA_READER_TOKEN = os.getenv("JINA_READER_TOKEN")

if not JINA_READER_TOKEN:
    raise RuntimeError(
        "JINA_READER_TOKEN environment variable is not set. Please set it to your Jina Reader API token."
    )

# logging.info(f"Jina Reader API token is set. {JINA_READER_TOKEN}")


async def fetch_jina_reader_content(target_url: str, max_retries: int = 3, timeout: float = 10.0) -> Optional[str]:
    """
    Fetch content from Jina Reader API with retries.
    Args:
        target_url (str): The URL to fetch content for.
        max_retries (int): Number of retry attempts.
        timeout (float): Timeout for each request in seconds.
    Returns:
        Optional[str]: The extracted content, or None if failed.
    """
    api_url = f"{JINA_READER_API}{target_url}"
    headers = {"Authorization": f"Bearer {JINA_READER_TOKEN}"}
    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(api_url, headers=headers)
                response.raise_for_status()
                return response.text
        except Exception as e:
            if attempt == max_retries:
                return None
            await asyncio.sleep(2**attempt)  # Exponential backoff
    return None
