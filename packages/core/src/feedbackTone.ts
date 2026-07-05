export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger';

export function getFeedbackTone(message: string): FeedbackTone {
  const normalized = message.trim();
  if (!normalized) {
    return 'info';
  }
  if (
    /^(could not|no recovery)/i.test(normalized) ||
    /\bnot valid\b/i.test(normalized) ||
    /\brequired\./i.test(normalized) ||
    /^choose\b/i.test(normalized)
  ) {
    return 'danger';
  }
  if (
    /^(export text has local edits|create at least|reset loads)/i.test(
      normalized
    ) ||
    /\bunavailable\b/i.test(normalized)
  ) {
    return 'warning';
  }
  if (
    /^(copied|created|deleted|imported|opened|refreshed|restored|saved|starter data is open|updated)/i.test(
      normalized
    )
  ) {
    return 'success';
  }
  return 'info';
}
