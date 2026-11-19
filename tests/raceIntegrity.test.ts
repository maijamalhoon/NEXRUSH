import { describe, expect, it } from 'vitest';
import { TRACKS } from '../src/data/tracks';
import { CARS } from '../src/data/cars';
import { RaceSimulation } from '../src/game/sim/race';
import { TrackSpline } from '../src/game/sim/track';
import { createInitialCarSimState } from '../src/game/sim/vehicle';

function makeRace() {
  const track = new TrackSpline(TRACKS[0]);
  const race = new RaceSimulation(track, {
    trackId: TRACKS[0].id, playerCarId: CARS[0].id,
    difficulty: 'normal', laps: 2, opponentsCount: 0,
  });
  const slot = track.getGridSlot(0);
  race.addCar(createInitialCarSimState('player', 'YOU', true,
    slot.position.x, slot.position.z, slot.heading), CARS[0]);
  return { race, track };
}
describe('race checkpoint integrity', () => {
  it('initializes grid progress at the actual starting position', () => {
    const { race } = makeRace();
    expect(race.state.cars.player.lapProgress).toBeGreaterThan(0.8);
    expect(race.state.cars.player.checkpointIndex).toBe(0);
  });
  it('does not award a lap during countdown or at an unverified start-line crossing', () => {
    const { race } = makeRace();
    const car = race.state.cars.player;
    const input = { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false, tick: 0 };
    for (let i = 0; i < 30; i++) race.step({ player: input });
    expect(car.lap).toBe(1);
  });
  it('restores checkpoint progress alongside a serialized race', () => {
    const { race } = makeRace();
    const snapshot = race.serialize();
    const { race: restored } = makeRace();
    restored.deserialize(snapshot);
    expect(restored.state.cars.player.lapProgress).toBe(race.state.cars.player.lapProgress);
    expect(restored.state.cars.player.checkpointIndex).toBe(0);
  });
  it('rejects malformed race snapshots', () => {
    const { race } = makeRace();
    expect(() => race.deserialize('{}')).toThrow();
  });
});
