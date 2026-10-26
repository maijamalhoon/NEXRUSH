import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { applyGrassDrag, crossedStartFinish, driftAngleDegrees, positiveAngle, TAU } from "./raceMath";

export type QualityMode = "auto" | "low" | "medium" | "high";
export interface Telemetry {
  speed: number;
  rpm: number;
  gear: number;
  elapsed: number;
  lap: number;
  position: number;
  offTrack: boolean;
  driftAngle: number;
  lapTime: number;
  lastLapTime: number;
  bestLapTime: number;
  countdown: number;
  racePhase: "COUNTDOWN" | "GO" | "RACING";
}
type Control = "left" | "right" | "accelerate" | "brake" | "handbrake";
type Opponent = { mesh: Mesh; progress: number; startProgress: number; speed: number; lane: number; wheels: Mesh[] };

const scales = { low: 0.62, medium: 0.8, high: 1 };
const RX = 34;
const RZ = 22;
const ROAD_HALF_WIDTH = 7.5;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export class RacingScene {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private car: Mesh;
  private wheels: Mesh[] = [];
  private opponents: Opponent[] = [];
  private optionalScenery: Array<{ isVisible: boolean }> = [];
  private autoSceneryVisible = true;
  private keys = new Set<string>();
  private controls = new Set<Control>();
  private mode: QualityMode = "auto";
  private speed = 0;
  private lateralVelocity = 0;
  private heading = -Math.PI / 2;
  private elapsed = 0;
  private lapTime = 0;
  private lastLapTime = 0;
  private bestLapTime = 0;
  private countdownRemaining = 3.0;
  private raceStarted = false;
  private goFlashRemaining = 0;
  private hudAccumulator = 0;
  private lap = 1;
  private lapProgress = 0;
  private offTrack = false;
  private fpsFrames = 0;
  private fpsStart = performance.now();
  private lowSamples = 0;
  private autoScale = window.matchMedia("(max-width: 700px)").matches ? 0.7 : 0.88;
  private disposed = false;
  private collisionCooldown = 0;
  private down = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "r" && !e.repeat) {
      e.preventDefault();
      this.resetCar();
      return;
    }
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    this.keys.add(k);
  };
  private up = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private clear = () => { this.keys.clear(); this.controls.clear(); };

  constructor(canvas: HTMLCanvasElement, private onTelemetry: (t: Telemetry) => void) {
    this.engine = new Engine(canvas, false, {
      preserveDrawingBuffer: false,
      stencil: false,
      powerPreference: "high-performance"
    }, false);
    this.engine.setHardwareScalingLevel(1 / this.autoScale);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.025, 0.035, 0.065, 1);
    this.scene.skipPointerMovePicking = true;
    this.camera = new ArcRotateCamera("chase", 0, 1.08, 13, new Vector3(0, 0.7, RZ), this.scene);
    this.camera.lowerRadiusLimit = 9;
    this.camera.upperRadiusLimit = 17;
    this.camera.inputs.clear();
    this.car = this.makeCar("player-car", new Color3(0.76, 0.035, 0.12), true);
    this.car.position.set(0, 0.65, RZ);
    this.makeTrack();
    this.makeWorld();
    this.makeCity();
    this.makeOpponents();
    this.applyQuality();
    window.addEventListener("keydown", this.down, { passive: false });
    window.addEventListener("keyup", this.up);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", this.clear);
  }

  async start() {
    if (this.disposed) return;
    this.engine.runRenderLoop(() => {
      if (this.disposed) return;
      const dt = Math.min(this.engine.getDeltaTime() / 1000, 0.04);
      if (document.hidden) {
        this.monitor();
        return;
      }
      this.update(dt);
      this.scene.render();
      this.monitor();
    });
    window.addEventListener("resize", this.resize);
  }

  private resize = () => {
    if (!this.disposed) {
      this.engine.resize();
      this.applyQuality();
    }
  };

  setControl(key: string, pressed: boolean) {
    if (!(["left", "right", "accelerate", "brake", "handbrake"] as string[]).includes(key)) return;
    if (pressed) this.controls.add(key as Control);
    else this.controls.delete(key as Control);
  }

  setQuality(q: QualityMode) {
    this.mode = q;
    this.applyQuality();
  }

  resetCar() {
    this.speed = 0;
    this.lateralVelocity = 0;
    this.heading = -Math.PI / 2;
    this.elapsed = 0;
    this.lapTime = 0;
    this.lastLapTime = 0;
    this.bestLapTime = 0;
    this.countdownRemaining = 3.0;
    this.raceStarted = false;
    this.goFlashRemaining = 0;
    this.hudAccumulator = 0;
    this.keys.clear();
    this.controls.clear();
    this.lap = 1;
    this.lapProgress = 0;
    this.lastProgress = 0;
    this.offTrack = false;
    this.collisionCooldown = 0;
    this.car.position.set(0, 0.65, RZ);
    this.car.rotation.y = this.heading;
    this.camera.alpha = 0;
    this.camera.radius = 12;
    this.camera.target.set(0, 1.3, RZ);
    for (const opponent of this.opponents) {
      opponent.progress = opponent.startProgress;
      const t = Math.PI / 2 + opponent.progress;
      const nxRaw = Math.cos(t) / RX;
      const nzRaw = Math.sin(t) / RZ;
      const nLength = Math.hypot(nxRaw, nzRaw);
      opponent.mesh.position.set(
        RX * Math.cos(t) + nxRaw / nLength * opponent.lane,
        0.65,
        RZ * Math.sin(t) + nzRaw / nLength * opponent.lane
      );
      opponent.mesh.rotation.y = Math.atan2(-RX * Math.sin(t), RZ * Math.cos(t));
    }
    this.publishTelemetry(false);
  }

  private applyQuality() {
    const scale = this.mode === "auto" ? this.autoScale : scales[this.mode];
    this.engine.setHardwareScalingLevel(1 / scale);
    if (this.mode === "low") this.autoSceneryVisible = false;
    else if (this.mode === "medium" || this.mode === "high") this.autoSceneryVisible = true;
    else if (scale <= 0.62) this.autoSceneryVisible = false;
    else if (scale >= 0.78) this.autoSceneryVisible = true;
    const showScenery = this.mode !== "low" && (this.mode !== "auto" || this.autoSceneryVisible);
    for (const item of this.optionalScenery) item.isVisible = showScenery;
  }

  private monitor() {
    if (document.hidden) {
      this.fpsFrames = 0;
      this.fpsStart = performance.now();
      return;
    }
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsStart < 1800) return;
    const fps = this.fpsFrames * 1000 / (now - this.fpsStart);
    this.fpsFrames = 0;
    this.fpsStart = now;
    if (this.mode !== "auto") return;
    if (fps < 42) this.lowSamples++;
    else this.lowSamples = Math.max(0, this.lowSamples - 1);
    if (this.lowSamples >= 2 && this.autoScale > 0.52) {
      this.autoScale = Math.max(0.52, this.autoScale - 0.08);
      this.lowSamples = 0;
      this.applyQuality();
    } else if (fps > 58 && this.autoScale < 0.96) {
      this.autoScale = Math.min(0.96, this.autoScale + 0.025);
      this.applyQuality();
    }
  }

  private update(dt: number) {
    this.hudAccumulator += dt;
    if (!this.raceStarted) {
      this.countdownRemaining = Math.max(0, this.countdownRemaining - dt);
      if (this.countdownRemaining <= 0) {
        this.raceStarted = true;
        this.elapsed = 0;
        this.lapTime = 0;
        this.goFlashRemaining = 0.7;
      }
      if (this.hudAccumulator >= 0.08) {
        this.hudAccumulator = 0;
        this.publishTelemetry(false);
      }
      return;
    }

    this.goFlashRemaining = Math.max(0, this.goFlashRemaining - dt);
    this.elapsed += dt;
    this.lapTime += dt;
    this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    const accel = this.keys.has("w") || this.keys.has("arrowup") || this.controls.has("accelerate");
    const brake = this.keys.has("s") || this.keys.has("arrowdown") || this.controls.has("brake");
    const left = this.keys.has("a") || this.keys.has("arrowleft") || this.controls.has("left");
    const right = this.keys.has("d") || this.keys.has("arrowright") || this.controls.has("right");
    const hand = this.keys.has(" ") || this.controls.has("handbrake");

    if (accel) this.speed += (this.speed < 0 ? 48 : 30) * dt;
    else if (this.speed > 0) this.speed = Math.max(0, this.speed - 5.5 * dt);
    else if (this.speed < 0) this.speed = Math.min(0, this.speed + 5.5 * dt);
    if (brake) {
      if (this.speed > 5) this.speed -= 52 * dt;
      else this.speed -= 20 * dt;
    }
    if (hand) this.speed *= Math.exp(-2.4 * dt);
    this.speed = clamp(this.speed, -28, 220);

    const steering = Number(right) - Number(left);
    const speedFactor = Math.min(1, Math.abs(this.speed) / 24);
    this.heading += steering * speedFactor * dt * (hand ? 1.85 : 1.22) * Math.sign(this.speed || 1);
    if (steering !== 0 && speedFactor > 0.1) {
      this.lateralVelocity += steering * speedFactor * (hand ? 15 : 4.2) * dt * Math.sign(this.speed || 1);
    }
    this.lateralVelocity = clamp(
      this.lateralVelocity * Math.exp(-dt * (hand ? 0.62 : 1.65)),
      -18,
      18
    );
    const sinHeading = Math.sin(this.heading);
    const cosHeading = Math.cos(this.heading);
    const forwardStep = this.speed * dt / 3.6;
    const lateralStep = this.lateralVelocity * dt;
    this.car.position.x += sinHeading * forwardStep + cosHeading * lateralStep;
    this.car.position.z += cosHeading * forwardStep - sinHeading * lateralStep;
    this.car.rotation.y = this.heading;

    const trackAngle = Math.atan2(this.car.position.z / RZ, this.car.position.x / RX);
    const nearestX = RX * Math.cos(trackAngle);
    const nearestZ = RZ * Math.sin(trackAngle);
    const distanceFromCentre = Math.hypot(this.car.position.x - nearestX, this.car.position.z - nearestZ);
    this.offTrack = distanceFromCentre > ROAD_HALF_WIDTH - 1.0;
    if (this.offTrack) {
      // Grass should slow the car down, never accelerate a stopped car backwards.
      this.speed = applyGrassDrag(this.speed, dt);
      this.lateralVelocity *= Math.exp(-4 * dt);
    }

    // Complete a lap only when crossing the line in the forward race direction.
    const previousProgress = this.lastProgress;
    this.lapProgress = positiveAngle(trackAngle - Math.PI / 2);
    if (crossedStartFinish(previousProgress, this.lapProgress, this.speed)) {
      this.lastLapTime = this.lapTime;
      if (this.bestLapTime === 0 || this.lastLapTime < this.bestLapTime) this.bestLapTime = this.lastLapTime;
      this.lap++;
      this.lapTime = 0;
    }
    this.lastProgress = this.lapProgress;

    for (const opponent of this.opponents) {
      opponent.progress += (opponent.speed / 3.6 / 29) * dt;
      const t = Math.PI / 2 + opponent.progress;
      const nxRaw = Math.cos(t) / RX;
      const nzRaw = Math.sin(t) / RZ;
      const nLength = Math.hypot(nxRaw, nzRaw);
      const nx = nxRaw / nLength;
      const nz = nzRaw / nLength;
      opponent.mesh.position.set(
        RX * Math.cos(t) + nx * opponent.lane,
        0.65,
        RZ * Math.sin(t) + nz * opponent.lane
      );
      const dx = -RX * Math.sin(t);
      const dz = RZ * Math.cos(t);
      opponent.mesh.rotation.y = Math.atan2(dx, dz);
      for (const wheel of opponent.wheels) wheel.rotation.x += opponent.speed * dt / 3.6;
      const dist = Math.hypot(this.car.position.x - opponent.mesh.position.x, this.car.position.z - opponent.mesh.position.z);
      if (dist < 2.7 && this.collisionCooldown === 0) {
        this.speed *= 0.68;
        this.heading += (this.car.position.x - opponent.mesh.position.x >= 0 ? 1 : -1) * 0.2;
        this.collisionCooldown = 0.65;
      }
    }

    for (const wheel of this.wheels) wheel.rotation.x += this.speed * dt / 1.2;
    const cameraFollow = Math.min(1, dt * 5);
    this.camera.target.x += (this.car.position.x - this.camera.target.x) * cameraFollow;
    this.camera.target.y += (this.car.position.y + 0.65 - this.camera.target.y) * cameraFollow;
    this.camera.target.z += (this.car.position.z - this.camera.target.z) * cameraFollow;
    this.camera.alpha = -Math.PI / 2 - this.heading;
    this.camera.beta = 1.08 + Math.min(0.12, Math.abs(this.speed) / 1200);
    this.camera.radius = 12 + Math.min(3, Math.abs(this.speed) / 70);

    if (this.hudAccumulator >= 0.08) {
      this.hudAccumulator = 0;
      this.publishTelemetry(accel);
    }
  }

  private publishTelemetry(accelerating: boolean) {
    const playerProgress = (this.lap - 1) * TAU + this.lapProgress;
    const position = 1 + this.opponents.filter(o => o.progress > playerProgress).length;
    const racePhase = !this.raceStarted
      ? "COUNTDOWN"
      : this.goFlashRemaining > 0 ? "GO" : "RACING";
    this.onTelemetry({
      speed: Math.abs(this.speed),
      gear: Math.max(1, Math.min(6, Math.floor(Math.max(0, this.speed) / 38) + 1)),
      rpm: 900 + Math.abs(this.speed) % 38 * 165 + (accelerating ? 900 : 0),
      elapsed: this.elapsed,
      lap: this.lap,
      position,
      offTrack: this.offTrack,
      driftAngle: driftAngleDegrees(this.lateralVelocity, this.speed),
      lapTime: this.lapTime,
      lastLapTime: this.lastLapTime,
      bestLapTime: this.bestLapTime,
      countdown: Math.max(1, Math.ceil(this.countdownRemaining)),
      racePhase
    });
  }

  private lastProgress = 0;

  private makeCar(name: string, color: Color3, player: boolean): Mesh {
    const body = MeshBuilder.CreateBox(name, { width: 1.9, height: 0.52, depth: 3.8 }, this.scene);
    body.position.y = 0.65;
    const paint = new StandardMaterial(name + "-paint", this.scene);
    paint.diffuseColor = color;
    paint.specularColor = new Color3(0.72, 0.78, 0.86);
    paint.specularPower = 64;
    body.material = paint;
    const cabin = MeshBuilder.CreateBox(name + "-canopy", { width: 1.32, height: 0.46, depth: 1.55 }, this.scene);
    cabin.position.set(0, 0.45, -0.15);
    cabin.parent = body;
    const glass = new StandardMaterial(name + "-glass", this.scene);
    glass.diffuseColor = new Color3(0.035, 0.12, 0.18);
    glass.emissiveColor = new Color3(0.01, 0.07, 0.09);
    cabin.material = glass;
    const rubber = new StandardMaterial(name + "-rubber", this.scene);
    rubber.diffuseColor = new Color3(0.035, 0.04, 0.055);
    const targetWheels = player ? this.wheels : [];
    for (const x of [-0.98, 0.98]) for (const z of [-1.2, 1.2]) {
      const w = MeshBuilder.CreateCylinder(name + "-wheel", { diameter: 0.78, height: 0.32, tessellation: 10 }, this.scene);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, -0.25, z);
      w.material = rubber;
      w.parent = body;
      targetWheels.push(w);
    }
    const spoiler = MeshBuilder.CreateBox(name + "-spoiler", { width: 1.75, height: 0.08, depth: 0.28 }, this.scene);
    spoiler.position.set(0, -0.15, -1.6);
    spoiler.parent = body;

    const headlampMaterial = new StandardMaterial(name + "-headlamp-material", this.scene);
    headlampMaterial.emissiveColor = new Color3(0.03, 0.65, 0.9);
    const headlamp = MeshBuilder.CreateBox(name + "-headlamp", { width: 1.25, height: 0.09, depth: 0.07 }, this.scene);
    headlamp.position.set(0, 0.03, 1.88);
    headlamp.material = headlampMaterial;
    headlamp.parent = body;

    const taillampMaterial = new StandardMaterial(name + "-taillamp-material", this.scene);
    taillampMaterial.emissiveColor = new Color3(0.95, 0.025, 0.12);
    const taillamp = MeshBuilder.CreateBox(name + "-taillamp", { width: 1.15, height: 0.08, depth: 0.07 }, this.scene);
    taillamp.position.set(0, 0.03, -1.88);
    taillamp.material = taillampMaterial;
    taillamp.parent = body;
    headlamp.isPickable = false;
    taillamp.isPickable = false;
    return body;
  }

  private makeTrack() {
    const ground = MeshBuilder.CreateGround("arena-ground", { width: 180, height: 150 }, this.scene);
    const groundMat = new StandardMaterial("ground-mat", this.scene);
    groundMat.diffuseColor = new Color3(0.045, 0.065, 0.085);
    groundMat.specularColor = Color3.Black();
    ground.material = groundMat;

    const inner: Vector3[] = [];
    const outer: Vector3[] = [];
    const segments = 112;
    for (let i = 0; i < segments; i++) {
      const t = i / segments * TAU;
      const nxRaw = Math.cos(t) / RX;
      const nzRaw = Math.sin(t) / RZ;
      const normalLength = Math.hypot(nxRaw, nzRaw);
      const nx = nxRaw / normalLength;
      const nz = nzRaw / normalLength;
      const cx = RX * Math.cos(t);
      const cz = RZ * Math.sin(t);
      inner.push(new Vector3(cx - nx * ROAD_HALF_WIDTH, 0.02, cz - nz * ROAD_HALF_WIDTH));
      outer.push(new Vector3(cx + nx * ROAD_HALF_WIDTH, 0.02, cz + nz * ROAD_HALF_WIDTH));
    }

    const road = MeshBuilder.CreateRibbon("closed-circuit", {
      pathArray: [inner, outer], closeArray: false, closePath: true,
      sideOrientation: Mesh.DOUBLESIDE
    }, this.scene);
    const roadMat = new StandardMaterial("road-mat", this.scene);
    roadMat.diffuseColor = new Color3(0.12, 0.15, 0.19);
    roadMat.specularColor = new Color3(0.16, 0.18, 0.22);
    road.material = roadMat;

    const outerLine = MeshBuilder.CreateLines("outer-neon-edge", { points: [...outer, outer[0]] }, this.scene);
    outerLine.color = new Color3(0.05, 0.8, 0.98);
    const innerLine = MeshBuilder.CreateLines("inner-neon-edge", { points: [...inner, inner[0]] }, this.scene);
    innerLine.color = new Color3(0.95, 0.035, 0.3);

    const dashMat = new StandardMaterial("lane-markers", this.scene);
    dashMat.emissiveColor = new Color3(0.16, 0.28, 0.32);
    const dashTemplate = MeshBuilder.CreateBox("lane-dash-0", { width: 0.12, height: 0.025, depth: 1.5 }, this.scene);
    dashTemplate.material = dashMat;
    for (let i = 0; i < 48; i++) {
      const t = i / 48 * TAU;
      const dash = i === 0 ? dashTemplate : dashTemplate.createInstance("lane-dash-" + i);
      dash.position.set(RX * Math.cos(t), 0.045, RZ * Math.sin(t));
      dash.rotation.y = Math.atan2(-RX * Math.sin(t), RZ * Math.cos(t));
    }

    const finishMat = new StandardMaterial("start-line-mat", this.scene);
    finishMat.emissiveColor = new Color3(0.28, 0.38, 0.45);
    const startTemplate = MeshBuilder.CreateBox("start-grid-0", { width: 1, height: 0.035, depth: 0.82 }, this.scene);
    startTemplate.material = finishMat;
    for (let i = 0; i < 14; i++) {
      const square = i === 0 ? startTemplate : startTemplate.createInstance("start-grid-" + i);
      square.position.set(-6.5 + i, 0.055, RZ);
    }
    const markerMat = new StandardMaterial("track-marker", this.scene);
    markerMat.emissiveColor = new Color3(0.02, 0.32, 0.42);
    const beaconTemplate = MeshBuilder.CreateCylinder("track-beacon-0", { height: 1.5, diameter: 0.22, tessellation: 6 }, this.scene);
    beaconTemplate.material = markerMat;
    for (let i = 0; i < 16; i++) {
      const t = i / 16 * TAU;
      const p = i === 0 ? beaconTemplate : beaconTemplate.createInstance("track-beacon-" + i);
      p.position.set((RX + 11) * Math.cos(t), 0.75, (RZ + 10) * Math.sin(t));
    }
  }

  private makeWorld() {
    const sky = MeshBuilder.CreateBox("sky", { size: 1000 }, this.scene);
    const skyMat = new StandardMaterial("sky-mat", this.scene);
    skyMat.backFaceCulling = false;
    skyMat.disableLighting = true;
    skyMat.emissiveColor = new Color3(0.025, 0.04, 0.085);
    sky.material = skyMat;
    sky.isPickable = false;
    const light = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.95;
    light.groundColor = new Color3(0.06, 0.08, 0.13);
    const orb = MeshBuilder.CreateSphere("neon-orb", { diameter: 3, segments: 8 }, this.scene);
    orb.position.set(-20, 12, 28);
    const orbMat = new StandardMaterial("orb-mat", this.scene);
    orbMat.emissiveColor = new Color3(0.02, 0.45, 0.75);
    orb.material = orbMat;
  }

  private makeCity() {
    const styles = [
      { width: 3.4, depth: 3.8, height: 8, bodyColor: new Color3(0.035, 0.07, 0.12), neonColor: new Color3(0.02, 0.48, 0.68) },
      { width: 4.1, depth: 3.4, height: 12, bodyColor: new Color3(0.055, 0.06, 0.12), neonColor: new Color3(0.22, 0.08, 0.62) },
      { width: 3.2, depth: 4.2, height: 16, bodyColor: new Color3(0.04, 0.075, 0.11), neonColor: new Color3(0.68, 0.035, 0.19) },
      { width: 4.6, depth: 3.8, height: 10, bodyColor: new Color3(0.065, 0.07, 0.1), neonColor: new Color3(0.04, 0.48, 0.38) }
    ];
    const templates: Array<{ body: Mesh; stripe: Mesh } | undefined> = new Array(styles.length);
    const towerCount = 40;

    for (let i = 0; i < towerCount; i++) {
      const t = i / towerCount * TAU + 0.035;
      const x = (RX + 20) * Math.cos(t);
      const z = (RZ + 18) * Math.sin(t);
      const styleIndex = i % styles.length;
      const style = styles[styleIndex];
      let body: Mesh | ReturnType<Mesh["createInstance"]>;
      let stripe: Mesh | ReturnType<Mesh["createInstance"]>;

      if (!templates[styleIndex]) {
        const bodyMesh = MeshBuilder.CreateBox("city-tower-" + styleIndex, {
          width: style.width, height: style.height, depth: style.depth
        }, this.scene);
        const bodyMaterial = new StandardMaterial("city-tower-material-" + styleIndex, this.scene);
        bodyMaterial.diffuseColor = style.bodyColor;
        bodyMaterial.specularColor = new Color3(0.12, 0.16, 0.22);
        bodyMesh.material = bodyMaterial;

        const stripeMesh = MeshBuilder.CreateBox("city-stripe-" + styleIndex, {
          width: 0.12, height: style.height * 0.72, depth: 0.07
        }, this.scene);
        const stripeMaterial = new StandardMaterial("city-stripe-material-" + styleIndex, this.scene);
        stripeMaterial.emissiveColor = style.neonColor;
        stripeMesh.material = stripeMaterial;

        templates[styleIndex] = { body: bodyMesh, stripe: stripeMesh };
        body = bodyMesh;
        stripe = stripeMesh;
      } else {
        body = templates[styleIndex]!.body.createInstance("city-tower-" + i);
        stripe = templates[styleIndex]!.stripe.createInstance("city-stripe-" + i);
      }

      body.position.set(x, style.height / 2, z);
      body.isPickable = false;
      stripe.position.set(x - style.width * 0.22, style.height / 2, z + style.depth / 2 + 0.04);
      stripe.isPickable = false;
      this.optionalScenery.push(body, stripe);
    }

    const cyan = new StandardMaterial("start-gate-cyan", this.scene);
    cyan.emissiveColor = new Color3(0.02, 0.68, 0.9);
    const pink = new StandardMaterial("start-gate-pink", this.scene);
    pink.emissiveColor = new Color3(0.92, 0.025, 0.19);

    for (const side of [-1, 1]) {
      const post = MeshBuilder.CreateBox("start-gate-post", { width: 0.42, height: 6.2, depth: 0.42 }, this.scene);
      post.position.set(side * 9.1, 3.1, RZ);
      post.material = side < 0 ? cyan : pink;
      post.isPickable = false;
    }
    const crossbar = MeshBuilder.CreateBox("start-gate-crossbar", { width: 18.2, height: 0.24, depth: 0.35 }, this.scene);
    crossbar.position.set(0, 6.15, RZ);
    crossbar.material = cyan;
    crossbar.isPickable = false;
  }

  private makeOpponents() {
    const configs = [
      { progress: 0.24, speed: 116, lane: -2.8, color: new Color3(0.04, 0.3, 0.92) },
      { progress: 0.53, speed: 126, lane: 0, color: new Color3(0.92, 0.52, 0.035) },
      { progress: 0.84, speed: 108, lane: 2.8, color: new Color3(0.12, 0.75, 0.42) }
    ];
    this.opponents = configs.map((config, i) => {
      const mesh = this.makeCar("opponent-" + (i + 1), config.color, false);
      const t = Math.PI / 2 + config.progress;
      const nxRaw = Math.cos(t) / RX;
      const nzRaw = Math.sin(t) / RZ;
      const nLength = Math.hypot(nxRaw, nzRaw);
      mesh.position.set(
        RX * Math.cos(t) + nxRaw / nLength * config.lane,
        0.65,
        RZ * Math.sin(t) + nzRaw / nLength * config.lane
      );
      mesh.rotation.y = Math.atan2(-RX * Math.sin(t), RZ * Math.cos(t));
      // The helper only registers player wheels; gather the opponent's four wheels by name.
      const wheels = this.scene.meshes.filter(m => m.name === "opponent-" + (i + 1) + "-wheel") as Mesh[];
      return { mesh, progress: config.progress, startProgress: config.progress, speed: config.speed, lane: config.lane, wheels };
    });
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("keydown", this.down);
    window.removeEventListener("keyup", this.up);
    window.removeEventListener("blur", this.clear);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.clear);
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
