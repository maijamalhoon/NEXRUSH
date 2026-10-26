import type { TrackData, Vector2D } from "./types";

export interface SplineSample {
  position: { x: number; y: number; z: number };
  tangent: { x: number; z: number };
  normal: { x: number; z: number };
  width: number;
  distance: number;
  progress: number; // 0 to 1
  isCheckpoint: boolean;
}

export interface NearestTrackInfo {
  progress: number;
  distanceToCenter: number;
  signedDistance: number; // positive = right of track, negative = left
  isOffTrack: boolean;
  closestPoint: Vector2D;
  tangent: Vector2D;
  checkpointIndex: number;
}

/**
 * Catmull-Rom spline interpolation between 4 points.
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
}

export class TrackSpline {
  public readonly data: TrackData;
  public readonly samples: SplineSample[] = [];
  public readonly totalLength: number;
  public readonly defaultWidth: number;
  public readonly checkpointCount: number;

  constructor(data: TrackData, sampleDensity = 1.5) {
    this.data = data;
    this.defaultWidth = data.roadWidth || 15;
    const pts = data.points;
    const n = pts.length;
    if (n < 3) throw new Error("Track must have at least 3 control points");

    // First pass: generate rough samples along Catmull-Rom segments
    const roughPoints: Array<{ x: number; y: number; z: number; width: number; cpIndex: number }> =
      [];

    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];

      // Estimate distance between p1 and p2 to determine subdivision
      const segDist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const steps = Math.max(8, Math.ceil(segDist / sampleDensity));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
        const y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
        const z = catmullRom(p0.z, p1.z, p2.z, p3.z, t);
        const width =
          p1.width !== undefined && p2.width !== undefined
            ? p1.width + (p2.width - p1.width) * t
            : this.defaultWidth;

        roughPoints.push({ x, y, z, width, cpIndex: i });
      }
    }

    // Second pass: compute cumulative distances and tangents
    let cumDist = 0;
    const m = roughPoints.length;
    const tempDistances: number[] = [0];

    for (let i = 0; i < m; i++) {
      const next = roughPoints[(i + 1) % m];
      const d = Math.hypot(next.x - roughPoints[i].x, next.z - roughPoints[i].z);
      cumDist += d;
      tempDistances.push(cumDist);
    }
    this.totalLength = cumDist;

    // Checkpoint count: at least 16 checkpoints or one per control point
    this.checkpointCount = Math.max(16, n);

    for (let i = 0; i < m; i++) {
      const curr = roughPoints[i];
      const next = roughPoints[(i + 1) % m];
      const prev = roughPoints[(i - 1 + m) % m];

      let tx = next.x - prev.x;
      let tz = next.z - prev.z;
      const tLen = Math.hypot(tx, tz) || 1;
      tx /= tLen;
      tz /= tLen;

      // Normal is perpendicular to tangent in XZ (facing track right)
      const nx = -tz;
      const nz = tx;

      const progress = tempDistances[i] / this.totalLength;
      const isCheckpoint = i % Math.floor(m / this.checkpointCount) === 0;

      this.samples.push({
        position: { x: curr.x, y: curr.y, z: curr.z },
        tangent: { x: tx, z: tz },
        normal: { x: nx, z: nz },
        width: curr.width,
        distance: tempDistances[i],
        progress,
        isCheckpoint,
      });
    }
  }

  /**
   * Evaluates track position, tangent, and normal at normalized progress s in [0, 1).
   */
  getAtProgress(s: number): SplineSample {
    const wrappedS = ((s % 1) + 1) % 1;
    const targetDist = wrappedS * this.totalLength;

    // Binary search for closest sample
    let low = 0;
    let high = this.samples.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.samples[mid].distance < targetDist) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx0 = Math.max(0, Math.min(this.samples.length - 1, high));
    const idx1 = (idx0 + 1) % this.samples.length;
    const s0 = this.samples[idx0];
    const s1 = this.samples[idx1];

    let span = s1.distance - s0.distance;
    if (span < 0) span += this.totalLength;
    const t = span > 0 ? (targetDist - s0.distance) / span : 0;

    return {
      position: {
        x: s0.position.x + (s1.position.x - s0.position.x) * t,
        y: s0.position.y + (s1.position.y - s0.position.y) * t,
        z: s0.position.z + (s1.position.z - s0.position.z) * t,
      },
      tangent: {
        x: s0.tangent.x + (s1.tangent.x - s0.tangent.x) * t,
        z: s0.tangent.z + (s1.tangent.z - s0.tangent.z) * t,
      },
      normal: {
        x: s0.normal.x + (s1.normal.x - s0.normal.x) * t,
        z: s0.normal.z + (s1.normal.z - s0.normal.z) * t,
      },
      width: s0.width + (s1.width - s0.width) * t,
      distance: targetDist,
      progress: wrappedS,
      isCheckpoint: s0.isCheckpoint,
    };
  }

  /**
   * Fast spatial lookup to find nearest track center line point and off-track status.
   */
  findNearest(x: number, z: number, searchNearProgress?: number): NearestTrackInfo {
    let bestDistSq = Infinity;
    let bestIdx = 0;

    // If searchNearProgress is provided, search localized window for speed
    let startIdx = 0;
    let endIdx = this.samples.length;
    if (searchNearProgress !== undefined) {
      const centerIdx = Math.floor(searchNearProgress * this.samples.length);
      const window = Math.floor(this.samples.length * 0.15); // +/- 15% of track
      startIdx = Math.max(0, centerIdx - window);
      endIdx = Math.min(this.samples.length, centerIdx + window);
    }

    for (let i = startIdx; i < endIdx; i++) {
      const s = this.samples[i];
      const dx = x - s.position.x;
      const dz = z - s.position.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }

    // If localized search didn't find anything close, fallback to global
    if (bestDistSq > 900 && searchNearProgress !== undefined) {
      for (let i = 0; i < this.samples.length; i++) {
        const s = this.samples[i];
        const dx = x - s.position.x;
        const dz = z - s.position.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = i;
        }
      }
    }

    const sample = this.samples[bestIdx];
    const dx = x - sample.position.x;
    const dz = z - sample.position.z;

    // Signed distance: dot product with track normal
    const signedDist = dx * sample.normal.x + dz * sample.normal.z;
    const halfWidth = sample.width * 0.5;
    const isOffTrack = Math.abs(signedDist) > halfWidth;
    const checkpointIndex = Math.floor(sample.progress * this.checkpointCount);

    return {
      progress: sample.progress,
      distanceToCenter: Math.sqrt(bestDistSq),
      signedDistance: signedDist,
      isOffTrack,
      closestPoint: { x: sample.position.x, z: sample.position.z },
      tangent: sample.tangent,
      checkpointIndex,
    };
  }

  /**
   * Generates staggered grid start positions for players and bots.
   * Slot 0 is pole position (e.g. player or AI).
   */
  getGridSlot(slotIndex: number): { position: Vector2D; heading: number } {
    // Start grid is placed slightly behind start line (progress 0.96 - 0.99)
    const slotSpacingMeters = 8.0;
    const totalDist = this.totalLength;
    const startOffsetDist = totalDist - 12 - slotIndex * slotSpacingMeters;
    const s = (((startOffsetDist % totalDist) + totalDist) % totalDist) / totalDist;

    const sample = this.getAtProgress(s);
    // Stagger left and right lanes
    const laneOffset = (slotIndex % 2 === 0 ? 1 : -1) * 3.2;

    const posX = sample.position.x + sample.normal.x * laneOffset;
    const posZ = sample.position.z + sample.normal.z * laneOffset;
    const heading = Math.atan2(sample.tangent.z, sample.tangent.x);

    return {
      position: { x: posX, z: posZ },
      heading,
    };
  }
}
