import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_ROOT))

from app.database import Base, SessionLocal, engine
from app.models.prompt import HarmCategory, Prompt
from app.models.target import TargetModel
from app.utils.sanitizer import validate_sanitized_prompt


DATA_DIR = BACKEND_ROOT / "app" / "data"
SEED_DATA_DIR = BACKEND_ROOT / "app" / "seed_data"
DEMO_DATASET = SEED_DATA_DIR / "demo_dataset.json"

CATEGORIES = {
    "cyber_abuse": "Cyber Abuse",
    "violent_wrongdoing": "Violent Wrongdoing",
    "fraud_scams": "Fraud & Scams",
    "self_harm_content": "Self-Harm Content",
    "hate_harassment": "Hate/Harassment",
}


def load_prompt_files() -> list[dict]:
    files: list[Path] = []
    if DATA_DIR.exists():
        seed_prompts = DATA_DIR / "seed_prompts_en.json"
        if seed_prompts.exists():
            files.append(seed_prompts)
        for folder in (DATA_DIR / "translated", DATA_DIR / "native_adapted"):
            if folder.exists():
                files.extend(sorted(folder.glob("*.json")))

    if not files:
        if not DEMO_DATASET.exists():
            raise FileNotFoundError(
                f"No private data folder found and demo dataset is missing: {DEMO_DATASET}"
            )
        files = [DEMO_DATASET]
        print(f"Private data folder not found; loading demo dataset from {DEMO_DATASET}.")

    records: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    for path in files:
        for record in json.loads(path.read_text(encoding="utf-8")):
            key = (record["seed_id"], record["language"], record["track"])
            if key in seen:
                continue
            seen.add(key)
            records.append(record)
    return records


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for key, display_name in CATEGORIES.items():
            existing = db.query(HarmCategory).filter(HarmCategory.key == key).first()
            if existing is None:
                db.add(HarmCategory(key=key, display_name=display_name))
        db.commit()

        if db.query(TargetModel).count() == 0:
            db.add(TargetModel(name="Mock Safety Target", endpoint_type="mock", endpoint_url="mock://local"))
            db.commit()

        categories = {category.key: category for category in db.query(HarmCategory).all()}
        for record in load_prompt_files():
            validate_sanitized_prompt(record["prompt_text"])
            exists = (
                db.query(Prompt)
                .filter(Prompt.source_seed_id == record["seed_id"])
                .filter(Prompt.language == record["language"])
                .filter(Prompt.track == record["track"])
                .first()
            )
            if exists:
                exists.harm_category_id = categories[record["harm_category"]].id
                exists.prompt_text = record["prompt_text"]
                exists.intent_summary = record["intent_summary"]
                exists.risk_level_hint = record["risk_level_hint"]
                continue
            db.add(
                Prompt(
                    harm_category_id=categories[record["harm_category"]].id,
                    language=record["language"],
                    track=record["track"],
                    prompt_text=record["prompt_text"],
                    intent_summary=record["intent_summary"],
                    source_seed_id=record["seed_id"],
                    risk_level_hint=record["risk_level_hint"],
                )
            )
        db.commit()
        print("Seeded Chaukidar database.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
