import type { Question } from '../types';
import { shuffle } from './shuffle';

export function buildSession(
  qs: Question[],
  cfg: { count: number; shuffle: boolean; rng?: () => number },
): Question[] {
  const n = Math.max(0, Math.min(cfg.count, qs.length));
  if (!cfg.shuffle) return qs.slice(0, n);
  return shuffle(qs, cfg.rng)
    .slice(0, n)
    .map((q) => ({ ...q, options: shuffle(q.options, cfg.rng) }));
}
