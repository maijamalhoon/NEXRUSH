/**
 * Seeded PRNG using Mulberry32 algorithm.
 * Guarantees cross-platform deterministic random numbers.
 */
export class SeededRng {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive).
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random float in [min, max).
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Returns a pseudo-random integer in [min, max].
   */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Clones current state for snapshot/rollback.
   */
  getState(): number {
    return this.state;
  }

  setState(state: number): void {
    this.state = state >>> 0;
  }
}
