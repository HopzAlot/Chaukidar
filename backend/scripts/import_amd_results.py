import json
from pathlib import Path

from app.database import SessionLocal
from app.models.audit import AuditResult, AuditRun
from app.models.prompt import Prompt
from app.models.target import TargetModel


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
            prompt = db.get(Prompt, item["local_prompt_id"])
            if prompt is None:
                continue
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
        print(f"Imported AMD audit run {audit.id}.")
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/import_amd_results.py path/to/results.json")
    import_results(Path(sys.argv[1]))
