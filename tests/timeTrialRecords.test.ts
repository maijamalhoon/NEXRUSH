import { describe, expect, it } from 'vitest';
import { evaluateTimeTrial } from '../src/gameplay/timeTrial';
import { loadTrialRecord, savePersonalBest, trialRecordKey } from '../src/gameplay/timeTrialRecords';
const identity = { trackId: 'neon', carId: 'apex', physicsVersion: '1', ruleset: 'standard' };
const targets = { legend: 60000, gold: 70000, silver: 80000, bronze: 90000 };
function memoryStore() {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); }, map };
}
describe('time trial personal best records', () => {
  it('stores a first result and only replaces with a faster one', () => {
    const store = memoryStore();
    expect(savePersonalBest(store, identity, evaluateTimeTrial(65000, [], targets))).toBe(true);
    expect(savePersonalBest(store, identity, evaluateTimeTrial(70000, [], targets))).toBe(false);
    expect(savePersonalBest(store, identity, evaluateTimeTrial(60000, [], targets))).toBe(true);
    expect(loadTrialRecord(store, identity)?.finalMs).toBe(60000);
  });
  it('isolates records by car and track', () => {
    expect(trialRecordKey(identity)).not.toBe(trialRecordKey({ ...identity, carId: 'venom' }));
    expect(trialRecordKey(identity)).not.toBe(trialRecordKey({ ...identity, trackId: 'coast' }));
  });
  it('recovers from corrupted or unavailable storage', () => {
    const store = memoryStore();
    store.setItem(trialRecordKey(identity), '{bad');
    expect(loadTrialRecord(store, identity)).toBeNull();
    const denied = { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('denied'); } };
    expect(loadTrialRecord(denied, identity)).toBeNull();
    expect(savePersonalBest(denied, identity, evaluateTimeTrial(60000, [], targets))).toBe(false);
  });
});
