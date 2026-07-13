const TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/;

export function toClientDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(TIMEZONE_SUFFIX.test(value) ? value : `${value}Z`);
}

export function formatDateTime(value: string | null | undefined) {
  const date = toClientDate(value);
  if (!date || Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
