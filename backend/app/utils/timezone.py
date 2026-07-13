from datetime import datetime, timezone
from zoneinfo import ZoneInfo

KARACHI_TZ = ZoneInfo('Asia/Karachi')


def to_karachi_time(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(KARACHI_TZ)
