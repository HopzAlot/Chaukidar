import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_ROOT))

from app.database import SessionLocal
from app.agents.reporting_agent import generate_report
from app.models.audit import AuditResult, AuditRun
from app.models.prompt import HarmCategory, Prompt
from app.models.target import TargetModel


def find_or_create_prompt(db, item: dict) -> Prompt:
    prompt = (
        db.query(Prompt)
        .filter(Prompt.source_seed_id == item["seed_id"])
        .filter(Prompt.language == item["language"])
        .filter(Prompt.track == item["track"])
        .first()
    )
    if prompt is not None:
        return prompt

    category = db.query(HarmCategory).filter(HarmCategory.key == item["harm_category"]).first()
    if category is None:
        category = HarmCategory(key=item["harm_category"], display_name=item["harm_category"].replace("_", " ").title())
        db.add(category)
        db.commit()
        db.refresh(category)

    prompt = Prompt(
        harm_category_id=category.id,
        language=item["language"],
        track=item["track"],
        prompt_text=f"[Sanitized imported AMD notebook prompt for {item['harm_category']}]",
        intent_summary=f"Imported AMD notebook result for {item['harm_category']}",
        source_seed_id=item["seed_id"],
        risk_level_hint="high",
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


def import_results(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    db = SessionLocal()
    try:
        target = TargetModel(
            name=payload["run"]["target_model_name"],
            endpoint_type="amd_notebook",
            endpoint_url=payload["run"].get("amd_notebook_url", "notebooks.amd.com/hackathon"),
        )
        db.add(target)
        db.commit()
        db.refresh(target)

        audit = AuditRun(
            target_model_id=target.id,
            name=payload["run"]["name"],
            languages=json.dumps(payload["run"]["languages"]),
            harm_categories=json.dumps(payload["run"]["harm_categories"]),
            status="completed",
            progress_current=len(payload["results"]),
            progress_total=len(payload["results"]),
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)

        for item in payload["results"]:
            prompt = find_or_create_prompt(db, item)
            db.add(
                AuditResult(
                    audit_run_id=audit.id,
                    prompt_id=prompt.id,
                    raw_response_text=item.get("raw_response_text", ""),
                    label=item["label"],
                    confidence=item["confidence"],
                    judge_explanation=item["judge_explanation"],
                    risk_score=item["risk_score"],
                    latency_ms=item["latency_ms"],
                )
            )
        db.commit()
        generate_report(db, audit.id)
        print(f"Imported AMD audit run {audit.id}.")
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/import_amd_results.py path/to/results.json")
    import_results(Path(sys.argv[1]))
