import os
import httpx
import asyncio
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "<OPENROUTER_API_KEY>")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-3-27b-it:free")

if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY environment variable is not set. Please set it to your OpenRouter API key.")


async def summarize_content(text: str, max_retries: int = 3, wait_seconds: int = 20) -> Optional[str]:
    """
    Summarize the input text using OpenRouter API with retry mechanism.
    Args:
        text (str): The raw text to summarize.
        max_retries (int): Number of retry attempts.
        wait_seconds (int): Wait time between retries in seconds.
    Returns:
        Optional[str]: The summarized text, or None if failed.
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    # Load prompt template from markdown file, path can be set via env variable
    prompt_path = os.getenv("SUMMARIZE_PROMPT_PATH", "prompts/summarize.md")
    logging.info(f"Using prompt template from: {prompt_path}")
    if not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Prompt template file not found: {prompt_path}")
    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt_template = f.read()
    # Replace the placeholder with the actual text
    prompt = prompt_template.replace("{{content}}", text)
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
    }
    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                # Extract summary from response
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    summary = choices[0]["message"].get("content")
                    logging.info(f"Summary obtained: {summary}")
                    return summary
        except Exception as e:
            if attempt == max_retries:
                return None
            await asyncio.sleep(wait_seconds)
    return None
