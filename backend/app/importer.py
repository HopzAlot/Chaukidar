import json

from sqlalchemy.orm import Session

from app.agents.judge_agent import judge_response
from app.agents.reporting_agent import generate_report
from app.models.audit import AuditResult, AuditRun
from app.models.prompt import HarmCategory, Prompt
from app.models.target import TargetModel
from app.schemas.imported_audit import ImportedAuditPayload, ImportedAuditResult


def find_or_create_prompt(db: Session, item: ImportedAuditResult) -> Prompt:
    prompt = (
        db.query(Prompt)
        .filter(Prompt.source_seed_id == item.seed_id)
        .filter(Prompt.language == item.language)
        .filter(Prompt.track == item.track)
        .first()
    )
    if prompt is not None:
        return prompt

    category = db.query(HarmCategory).filter(HarmCategory.key == item.harm_category).first()
    if category is None:
        category = HarmCategory(
            key=item.harm_category,
            display_name=item.harm_category.replace("_", " ").title(),
        )
        db.add(category)
        db.flush()

    prompt = Prompt(
        harm_category_id=category.id,
        language=item.language,
        track=item.track,
        prompt_text=item.prompt_text or f"[Sanitized imported audit prompt for {item.harm_category}]",
        intent_summary=item.intent_summary or f"Imported audit result for {item.harm_category}",
        source_seed_id=item.seed_id,
        risk_level_hint="high",
    )
    db.add(prompt)
    db.flush()
    return prompt


async def import_audit_payload(
    db: Session,
    payload: ImportedAuditPayload,
    provider_override: str | None = None,
    rejudge_imported: bool = False,
) -> AuditRun:
    run = payload.run
    provider = provider_override or run.provider
    default_url = (
        "https://api.fireworks.ai/inference/v1"
        if provider == "fireworks"
        else "notebooks.amd.com/hackathon"
    )
    endpoint_url = run.endpoint_url or run.amd_notebook_url or default_url
    target = (
        db.query(TargetModel)
        .filter(TargetModel.name == run.target_model_name)
        .filter(TargetModel.endpoint_type == provider)
        .first()
    )
    if target is None:
        target = TargetModel(
            name=run.target_model_name,
            endpoint_type=provider,
            endpoint_url=endpoint_url,
        )
        db.add(target)
        db.flush()

    tracks = {item.track for item in payload.results}
    audit = AuditRun(
        target_model_id=target.id,
        name=run.name,
        languages=json.dumps(run.languages),
        harm_categories=json.dumps(run.harm_categories),
        include_english_track="english_seed" in tracks,
        include_translation_track="translation_baseline" in tracks,
        include_native_track="native_adapted" in tracks,
        status="completed",
        progress_current=len(payload.results),
        progress_total=len(payload.results),
    )
    db.add(audit)
    db.flush()

    for item in payload.results:
        prompt = find_or_create_prompt(db, item)
        if rejudge_imported:
            verdict = await judge_response(prompt.prompt_text, item.raw_response_text)
            label = verdict.label
            confidence = verdict.confidence
            judge_explanation = verdict.explanation
            risk_score = verdict.risk_score
        else:
            missing = [
                field
                for field, value in {
                    "label": item.label,
                    "confidence": item.confidence,
                    "judge_explanation": item.judge_explanation,
                    "risk_score": item.risk_score,
                }.items()
                if value is None or value == ""
            ]
            if missing:
                raise ValueError(
                    "Imported result is missing judged fields "
                    f"{', '.join(missing)}. Enable rejudge_imported to judge raw responses on import."
                )
            label = item.label
            confidence = item.confidence
            judge_explanation = item.judge_explanation
            risk_score = item.risk_score

        db.add(
            AuditResult(
                audit_run_id=audit.id,
                prompt_id=prompt.id,
                raw_response_text=item.raw_response_text,
                label=label,
                confidence=confidence,
                judge_explanation=judge_explanation,
                risk_score=risk_score,
                latency_ms=item.latency_ms,
            )
        )

    db.commit()
    db.refresh(audit)
    generate_report(db, audit.id)
    return audit
