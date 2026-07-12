import asyncio
from dataclasses import dataclass
from time import perf_counter

import httpx


@dataclass
class InferenceResponse:
    text: str
    latency_ms: int


def _collect_strings(value: object) -> list[str]:
    if isinstance(value, str):
        return [value] if value.strip() else []
    if isinstance(value, list):
        strings: list[str] = []
        for item in value:
            strings.extend(_collect_strings(item))
        return strings
    if isinstance(value, dict):
        strings: list[str] = []
        for item in value.values():
            strings.extend(_collect_strings(item))
        return strings
    return []


def _extract_message_text(data: dict) -> str:
    try:
        choice = data["choices"][0]
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError(f"Fireworks response missing choices: keys={list(data) if isinstance(data, dict) else type(data).__name__}") from exc

    if not isinstance(choice, dict):
        raise ValueError(f"Fireworks response choice is not an object: {type(choice).__name__}")

    message = choice.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            return content
        if isinstance(content, list):
            parts = _collect_strings(content)
            if parts:
                return "\n".join(parts)

        # Prefer final answer-like fields before reasoning text. GPT-OSS often puts
        # partial JSON in reasoning_content, which must not be parsed as verdict.
        for fallback_key in ("output_text", "refusal"):
            value = message.get(fallback_key)
            if isinstance(value, str) and value.strip():
                return value

    text = choice.get("text")
    if isinstance(text, str) and text.strip():
        return text

    for key in ("output_text", "content"):
        value = choice.get(key)
        if isinstance(value, str) and value.strip():
            return value

    strings = _collect_strings(choice)
    for text_value in strings:
        if "{" in text_value and "}" in text_value:
            return text_value
    for text_value in strings:
        if text_value.strip():
            return text_value

    raise ValueError(f"Fireworks response has no usable text. choice_keys={list(choice)}")


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
    temperature: float = 0.2,
    max_tokens: int = 160,
    response_format: dict | None = None,
) -> InferenceResponse:
    started = perf_counter()
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt_text}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format is not None:
        payload["response_format"] = response_format

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
                return InferenceResponse(text=_extract_message_text(data), latency_ms=latency_ms)
            except Exception as exc:
                last_error = exc
                if attempt >= max_retries or not _should_retry(exc):
                    raise
                await asyncio.sleep(0.8 * (2 ** attempt))

    raise RuntimeError(f"Fireworks inference failed: {last_error}")
