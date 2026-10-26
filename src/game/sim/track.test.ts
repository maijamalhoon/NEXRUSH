import { describe, expect, it } from "vitest";
import { TrackSpline } from "./track";
import { TRACKS } from "../../data/tracks";

describe("TrackSpline", () => {
  it("interpolates smooth closed-loop spline with correct length and sample density", () => {
    const track = new TrackSpline(TRACKS[0]);
    expect(track.totalLength).toBeGreaterThan(1500);
    expect(track.samples.length).toBeGreaterThan(200);

    // Check that start and end close smoothly
    const start = track.getAtProgress(0.0);
    const nearEnd = track.getAtProgress(0.999);
    const dist = Math.hypot(start.position.x - nearEnd.position.x, start.position.z - nearEnd.position.z);
    expect(dist).toBeLessThan(15);
  });

  it("accurately detects when a point is on-track vs off-track", () => {
    const track = new TrackSpline(TRACKS[0]);
    const centerSample = track.getAtProgress(0.25);

    // Right on the track center
    const onCenter = track.findNearest(centerSample.position.x, centerSample.position.z);
    expect(onCenter.isOffTrack).toBe(false);
    expect(onCenter.distanceToCenter).toBeLessThan(1.0);

    // 25 meters lateral to center (well outside road width of 15m / half-width 7.5m)
    const farOffX = centerSample.position.x + centerSample.normal.x * 25;
    const farOffZ = centerSample.position.z + centerSample.normal.z * 25;
    const offTrack = track.findNearest(farOffX, farOffZ);
    expect(offTrack.isOffTrack).toBe(true);
    expect(offTrack.signedDistance).toBeGreaterThan(10);
  });

  it("produces valid staggered starting grid slots", () => {
    const track = new TrackSpline(TRACKS[0]);
    const slot0 = track.getGridSlot(0);
    const slot1 = track.getGridSlot(1);

    // Slots should not overlap
    const dist = Math.hypot(slot0.position.x - slot1.position.x, slot0.position.z - slot1.position.z);
    expect(dist).toBeGreaterThan(5.0);
    expect(Number.isFinite(slot0.heading)).toBe(true);
  });
});
