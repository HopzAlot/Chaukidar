from dataclasses import dataclass
from time import perf_counter

import httpx


@dataclass
class InferenceResponse:
    text: str
    latency_ms: int


async def complete(
    base_url: str,
    model: str,
    prompt_text: str,
    api_key: str = "",
    timeout_seconds: int = 60,
) -> InferenceResponse:
    started = perf_counter()
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt_text}],
        "temperature": 0.2,
        "max_tokens": 160,
    }
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(f"{base_url.rstrip('/')}/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
    latency_ms = int((perf_counter() - started) * 1000)
    return InferenceResponse(text=data["choices"][0]["message"]["content"], latency_ms=latency_ms)
