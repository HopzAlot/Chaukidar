import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_ROOT))

from app.database import SessionLocal
from app.importer import import_audit_payload
from app.schemas.imported_audit import ImportedAuditPayload


def import_results(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    db = SessionLocal()
    try:
        validated = ImportedAuditPayload.model_validate(payload)
        audit = import_audit_payload(db, validated)
        print(f"Imported {validated.run.provider} audit run {audit.id}.")
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/import_amd_results.py path/to/results.json")
    import_results(Path(sys.argv[1]))
