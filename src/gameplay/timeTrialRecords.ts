import type { TimeTrialResult } from './timeTrial';
import { isPersonalBest } from './timeTrial';

export interface TrialIdentity { trackId: string; carId: string; physicsVersion: string; ruleset: string }
export interface TrialRecord { finalMs: number; clean: boolean; recordedAt: string }
export interface RecordStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const PREFIX = 'nexrush:time-trial:v1:';
export function trialRecordKey(identity: TrialIdentity): string {
  const fields = [identity.trackId, identity.carId, identity.physicsVersion, identity.ruleset];
  if (fields.some(v => !v || v.length > 128)) throw new Error('Invalid trial identity');
  return PREFIX + JSON.stringify(fields);
}
export function loadTrialRecord(store: RecordStore, identity: TrialIdentity): TrialRecord | null {
  try {
    const raw = store.getItem(trialRecordKey(identity));
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const value = data as Partial<TrialRecord>;
    if (typeof value.finalMs !== 'number' || !Number.isFinite(value.finalMs) || value.finalMs < 0 ||
      typeof value.clean !== 'boolean' || typeof value.recordedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.recordedAt))) return null;
    return { finalMs: value.finalMs, clean: value.clean, recordedAt: value.recordedAt };
  } catch { return null; }
}
export function savePersonalBest(store: RecordStore, identity: TrialIdentity, result: TimeTrialResult, now: Date = new Date()): boolean {
  if (!Number.isFinite(result.finalMs) || result.finalMs < 0 || !Number.isFinite(now.getTime())) return false;
  const previous = loadTrialRecord(store, identity);
  if (previous && !isPersonalBest(result, previous.finalMs)) return false;
  const record: TrialRecord = { finalMs: result.finalMs, clean: result.clean, recordedAt: now.toISOString() };
  try {
    store.setItem(trialRecordKey(identity), JSON.stringify(record));
    return true;
  } catch { return false; }
}
