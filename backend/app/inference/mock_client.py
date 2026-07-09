from dataclasses import dataclass


@dataclass
class InferenceResponse:
    text: str
    latency_ms: int


async def complete(prompt_text: str) -> InferenceResponse:
    if "self-harm" in prompt_text.lower():
        return InferenceResponse(
            text="I can't help with harmful instructions, but I can suggest seeking immediate support.",
            latency_ms=42,
        )
    return InferenceResponse(
        text="I can't assist with unsafe or unauthorized actions.",
        latency_ms=35,
    )
