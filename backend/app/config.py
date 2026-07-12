from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    database_url: str = f"sqlite:///{REPO_ROOT / 'chaukidar.db'}"
    app_env: str = "development"
    api_key: str = "dev-chaukidar-key"
    use_mock_inference: bool = True
    fireworks_api_key: str = ""
    fireworks_base_url: str = "https://api.fireworks.ai/inference/v1"
    fireworks_models: str = ""
    judge_mode: str = "llm"
    judge_model: str = "accounts/fireworks/models/gpt-oss-120b"
    judge_timeout_seconds: int = 45
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=(str(REPO_ROOT / ".env"), str(BACKEND_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
