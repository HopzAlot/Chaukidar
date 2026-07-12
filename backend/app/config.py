from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./chaukidar.db"
    app_env: str = "development"
    api_key: str = "dev-chaukidar-key"
    use_mock_inference: bool = True
    fireworks_api_key: str = ""
    fireworks_base_url: str = "https://api.fireworks.ai/inference/v1"
    fireworks_models: str = ""
    judge_mode: str = "llm"
    judge_model: str = "accounts/fireworks/models/gpt-oss-120b"
    judge_timeout_seconds: int = 45

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
