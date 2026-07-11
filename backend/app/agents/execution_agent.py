from app.config import settings
from app.inference import mock_client, openai_compatible
from app.models.prompt import Prompt
from app.models.target import TargetModel


async def execute_prompt(prompt: Prompt, target: TargetModel):
    if target.endpoint_type == "mock":
        return await mock_client.complete(prompt.prompt_text)

    if target.endpoint_type == "fireworks":
        return await openai_compatible.complete(
            base_url=target.endpoint_url or settings.fireworks_base_url,
            model=target.name,
            prompt_text=prompt.prompt_text,
            api_key=settings.fireworks_api_key,
        )

    if target.endpoint_type == "amd_notebook":
        raise ValueError("AMD notebook imports are view-only; run them from the hosted notebook.")

    raise ValueError(f"Unsupported endpoint_type: {target.endpoint_type}")
