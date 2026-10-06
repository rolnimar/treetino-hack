import { BadRequestException } from '@nestjs/common';

export function reportDayTimestamp(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new BadRequestException(
      'day must be a UTC date in YYYY-MM-DD format',
    );
  const milliseconds = Date.parse(value + 'T00:00:00Z');
  if (
    !Number.isFinite(milliseconds) ||
    milliseconds < 0 ||
    new Date(milliseconds).toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException(
      'day must be a valid UTC date on or after 1970-01-01',
    );
  return String(milliseconds / 1000);
}
