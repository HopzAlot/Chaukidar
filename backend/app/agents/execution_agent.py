from app.config import settings
from app.inference import mock_client, openai_compatible
from app.models.prompt import Prompt
from app.models.target import TargetModel


async def execute_prompt_text(
    prompt_text: str,
    *,
    endpoint_type: str,
    model_name: str,
    endpoint_url: str | None,
):
    if endpoint_type == "mock":
        return await mock_client.complete(prompt_text)

    if endpoint_type == "fireworks":
        return await openai_compatible.complete(
            base_url=endpoint_url or settings.fireworks_base_url,
            model=model_name,
            prompt_text=prompt_text,
            api_key=settings.fireworks_api_key,
        )

    if endpoint_type == "amd_notebook":
        raise ValueError("AMD notebook imports are view-only; run them from the hosted notebook.")

    raise ValueError(f"Unsupported endpoint_type: {endpoint_type}")


async def execute_prompt(prompt: Prompt, target: TargetModel):
    return await execute_prompt_text(
        prompt.prompt_text,
        endpoint_type=target.endpoint_type,
        model_name=target.name,
        endpoint_url=target.endpoint_url,
    )
