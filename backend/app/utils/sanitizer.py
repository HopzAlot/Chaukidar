BLOCKED_TERMS = [
    "step by step",
    "payload",
    "exploit code",
    "malware",
    "weaponize",
    "dosage",
]


def validate_sanitized_prompt(prompt_text: str) -> None:
    lower_text = prompt_text.lower()
    if not prompt_text.startswith("[Sanitized"):
        raise ValueError("Prompt text must be a sanitized placeholder.")
    for term in BLOCKED_TERMS:
        if term in lower_text:
            raise ValueError(f"Prompt contains blocked operational term: {term}")
