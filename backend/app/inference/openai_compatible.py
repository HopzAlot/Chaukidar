import asyncio
from dataclasses import dataclass
from time import perf_counter

import httpx


@dataclass
class InferenceResponse:
    text: str
    latency_ms: int


def _should_retry(exc: Exception) -> bool:
    if isinstance(exc, (httpx.TimeoutException, httpx.TransportError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in {408, 409, 425, 429, 500, 502, 503, 504}
    return False


async def complete(
    base_url: str,
    model: str,
    prompt_text: str,
    api_key: str = "",
    timeout_seconds: int = 60,
    max_retries: int = 3,
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

    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        for attempt in range(max_retries + 1):
            try:
                response = await client.post(
                    f"{base_url.rstrip('/')}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                latency_ms = int((perf_counter() - started) * 1000)
                return InferenceResponse(text=data["choices"][0]["message"]["content"], latency_ms=latency_ms)
            except Exception as exc:
                last_error = exc
                if attempt >= max_retries or not _should_retry(exc):
                    raise
                await asyncio.sleep(0.8 * (2 ** attempt))

    raise RuntimeError(f"Fireworks inference failed: {last_error}")
