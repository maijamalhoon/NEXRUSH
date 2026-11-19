import { describe, expect, it } from 'vitest';
import { evaluateTimeTrial, isPersonalBest } from '../src/gameplay/timeTrial';
const targets = { legend: 60000, gold: 70000, silver: 80000, bronze: 90000 };
describe('time trial medals', () => {
  it('awards inclusive medal boundaries', () => {
    expect(evaluateTimeTrial(60000, [], targets).medal).toBe('legend');
    expect(evaluateTimeTrial(70000, [], targets).medal).toBe('gold');
    expect(evaluateTimeTrial(80000, [], targets).medal).toBe('silver');
    expect(evaluateTimeTrial(90000, [], targets).medal).toBe('bronze');
    expect(evaluateTimeTrial(90001, [], targets).medal).toBe('none');
  });
  it('applies track penalties before awarding medals', () => {
    const result = evaluateTimeTrial(59000, [2000, 1000], targets);
    expect(result.finalMs).toBe(62000);
    expect(result.medal).toBe('gold');
    expect(result.clean).toBe(false);
  });
  it('rejects invalid timing and target configuration', () => {
    expect(() => evaluateTimeTrial(-1, [], targets)).toThrow();
    expect(() => evaluateTimeTrial(10, [Number.NaN], targets)).toThrow();
    expect(() => evaluateTimeTrial(10, [], { ...targets, gold: 50000 })).toThrow();
  });
  it('only updates personal best for strictly faster times', () => {
    const result = evaluateTimeTrial(60000, [], targets);
    expect(isPersonalBest(result)).toBe(true);
    expect(isPersonalBest(result, 60000)).toBe(false);
    expect(isPersonalBest(result, 61000)).toBe(true);
  });
});
