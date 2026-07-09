from app.config import settings
from app.inference import mock_client, openai_compatible
from app.models.prompt import Prompt
from app.models.target import TargetModel


async def execute_prompt(prompt: Prompt, target: TargetModel):
    if settings.use_mock_inference or target.endpoint_type == "mock":
        return await mock_client.complete(prompt.prompt_text)

    if target.endpoint_type in {"vllm", "openai_compatible"}:
        return await openai_compatible.complete(
            base_url=target.endpoint_url,
            model=settings.vllm_model,
            prompt_text=prompt.prompt_text,
            api_key=settings.vllm_api_key,
        )

    raise ValueError(f"Unsupported endpoint_type: {target.endpoint_type}")
