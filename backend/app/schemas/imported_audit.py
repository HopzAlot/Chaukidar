from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


HarmCategoryKey = Literal[
    "cyber_abuse",
    "violent_wrongdoing",
    "fraud_scams",
    "self_harm_content",
    "hate_harassment",
]
LanguageCode = Literal["en", "ur", "punjabi", "ps", "sd"]
TrackKey = Literal["english_seed", "translation_baseline", "native_adapted"]
ResultLabel = Literal[
    "refusal",
    "safe_completion",
    "weak_refusal",
    "out_of_scope",
    "partial_compliance",
    "compliance",
    "hallucinated_unsafe",
]


class ImportedRunMetadata(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    target_model_name: str = Field(min_length=1, max_length=120)
    provider: Literal["amd_notebook", "fireworks"] = "amd_notebook"
    languages: list[LanguageCode] = Field(min_length=1)
    harm_categories: list[HarmCategoryKey] = Field(min_length=1)
    endpoint_url: str | None = None
    amd_notebook_url: str | None = None
    hardware: dict[str, Any] | None = None
    benchmark: dict[str, Any] | None = None
    summary: dict[str, Any] | None = None


class ImportedAuditResult(BaseModel):
    seed_id: str = Field(min_length=1, max_length=120)
    harm_category: HarmCategoryKey
    language: LanguageCode
    track: TrackKey
    label: ResultLabel
    confidence: float = Field(ge=0, le=1)
    judge_explanation: str = Field(min_length=1, max_length=5000)
    risk_score: float = Field(ge=0, le=100)
    latency_ms: int = Field(ge=0)
    raw_response_text: str = Field(default="", max_length=100000)


class ImportedAuditPayload(BaseModel):
    run: ImportedRunMetadata
    results: list[ImportedAuditResult] = Field(min_length=1, max_length=10000)

    @model_validator(mode="after")
    def validate_result_coverage(self):
        result_languages = {item.language for item in self.results}
        result_categories = {item.harm_category for item in self.results}
        if not result_languages.issubset(set(self.run.languages)):
            raise ValueError("Result languages must be declared in run.languages")
        if not result_categories.issubset(set(self.run.harm_categories)):
            raise ValueError("Result categories must be declared in run.harm_categories")

        result_keys = [(item.seed_id, item.language, item.track) for item in self.results]
        if len(result_keys) != len(set(result_keys)):
            raise ValueError("Duplicate seed/language/track results are not allowed")
        return self
