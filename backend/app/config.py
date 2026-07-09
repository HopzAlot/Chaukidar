from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./desiguard.db"
    app_env: str = "development"
    api_key: str = "dev-desiguard-key"
    vllm_base_url: str = "http://localhost:8000/v1"
    vllm_model: str = "Qwen/Qwen2-7B-Instruct"
    vllm_api_key: str = ""
    use_mock_inference: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
