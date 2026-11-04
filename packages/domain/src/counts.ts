/**
 * `formatCount(1, 'seat')` → "1 seat", `formatCount(12, 'station')` → "12 stations". Nouns in this
 * product pluralise by appending `s`; pass `plural` for one that does not.
 */
export function formatCount(count: number, noun: string, plural = `${noun}s`): string {
  return `${count} ${count === 1 ? noun : plural}`;
}
