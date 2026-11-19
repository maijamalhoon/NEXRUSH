/** Pure, deterministic time-trial scoring. No rendering or storage dependencies. */
export type Medal = 'legend' | 'gold' | 'silver' | 'bronze' | 'none';
export interface TimeTrialTargets { legend: number; gold: number; silver: number; bronze: number }
export interface TimeTrialResult { elapsedMs: number; penaltyMs: number; finalMs: number; medal: Medal; clean: boolean }
export function evaluateTimeTrial(elapsedMs: number, penaltiesMs: readonly number[], targets: TimeTrialTargets): TimeTrialResult {
  const values = [elapsedMs, ...penaltiesMs, targets.legend, targets.gold, targets.silver, targets.bronze];
  if (values.some(v => !Number.isFinite(v) || v < 0)) throw new Error('Times must be finite and nonnegative');
  if (!(targets.legend < targets.gold && targets.gold < targets.silver && targets.silver < targets.bronze))
    throw new Error('Medal targets must be strictly increasing');
  const penaltyMs = penaltiesMs.reduce((a, b) => a + b, 0);
  const finalMs = elapsedMs + penaltyMs;
  if (!Number.isFinite(finalMs)) throw new Error('Time overflow');
  const medal: Medal = finalMs <= targets.legend ? 'legend' : finalMs <= targets.gold ? 'gold' : finalMs <= targets.silver ? 'silver' : finalMs <= targets.bronze ? 'bronze' : 'none';
  return { elapsedMs, penaltyMs, finalMs, medal, clean: penaltyMs === 0 };
}
export function isPersonalBest(next: TimeTrialResult, previousFinalMs?: number): boolean {
  return previousFinalMs === undefined || next.finalMs < previousFinalMs;
}
