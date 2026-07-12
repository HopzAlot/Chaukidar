import argparse
import asyncio
import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_ROOT))

from app.database import SessionLocal
from app.importer import import_audit_payload
from app.schemas.imported_audit import ImportedAuditPayload


async def import_results(path: Path, rejudge_imported: bool = False) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    db = SessionLocal()
    try:
        validated = ImportedAuditPayload.model_validate(payload)
        audit = await import_audit_payload(db, validated, rejudge_imported=rejudge_imported)
        mode = "re-judged" if rejudge_imported else "as-is"
        print(f"Imported {validated.run.provider} audit run {audit.id} ({mode}).")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import AMD/Fireworks audit results JSON.")
    parser.add_argument("path", type=Path)
    parser.add_argument("--rejudge", action="store_true", help="Re-run backend judge over imported raw responses.")
    args = parser.parse_args()
    asyncio.run(import_results(args.path, rejudge_imported=args.rejudge))
