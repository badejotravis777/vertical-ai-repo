export function formatMoney(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString()} ${currency}`;
  }
}

export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/[,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export const VERDICTS = {
  take_it: { label: 'Take it', tone: 'good' },
  negotiate: { label: 'Negotiate', tone: 'warn' },
  walk_away: { label: 'Walk away', tone: 'bad' },
};
