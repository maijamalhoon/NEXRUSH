import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TrackRenderer } from "./TrackRenderer";
import { CarRenderer } from "./CarRenderer";
import type { TrackSpline } from "../sim/track";
import type { CarSimState, RaceSimState } from "../sim/types";

export type CameraMode = "CHASE" | "ORBIT" | "HOOD";

export class SceneManager {
  public readonly engine: Engine;
  public readonly scene: Scene;
  public readonly camera: ArcRotateCamera;
  public readonly trackRenderer: TrackRenderer;
  public readonly carRenderer: CarRenderer;

  private hemiLight: HemisphericLight;
  private dirLight: DirectionalLight;
  private cameraMode: CameraMode = "ORBIT";
  private baseFov = 0.82; // radians (~47 deg)

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(
      canvas,
      true,
      {
        preserveDrawingBuffer: false,
        stencil: false,
        powerPreference: "high-performance",
      },
      true
    );

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.043, 0.051, 0.071, 1);

    // Camera setup
    this.camera = new ArcRotateCamera(
      "mainCam",
      -Math.PI / 2,
      1.25,
      12,
      new Vector3(0, 1.0, 0),
      this.scene
    );
    this.camera.lowerRadiusLimit = 6;
    this.camera.upperRadiusLimit = 25;
    this.camera.fov = this.baseFov;

    // Lighting
    this.hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.scene);
    this.hemiLight.intensity = 0.65;

    this.dirLight = new DirectionalLight("dirLight", new Vector3(-0.5, -1, -0.5), this.scene);
    this.dirLight.intensity = 0.85;

    // Sub-renderers
    this.trackRenderer = new TrackRenderer(this.scene);
    this.carRenderer = new CarRenderer(this.scene);

    // Auto resize
    window.addEventListener("resize", this.onResize);
  }

  private onResize = () => {
    this.engine.resize();
  };

  public setQuality(quality: "auto" | "low" | "medium" | "high"): void {
    switch (quality) {
      case "low":
        this.engine.setHardwareScalingLevel(1.5);
        break;
      case "medium":
        this.engine.setHardwareScalingLevel(1.2);
        break;
      case "high":
        this.engine.setHardwareScalingLevel(1.0);
        break;
      case "auto":
      default:
        this.engine.setHardwareScalingLevel(window.devicePixelRatio > 1.5 ? 1.25 : 1.0);
        break;
    }
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }

  public loadTrack(track: TrackSpline): void {
    this.trackRenderer.buildTrack(track);

    // Update scene fog and lighting according to track theme
    const theme = track.data.theme;
    if (theme === "city_night") {
      this.scene.clearColor = new Color4(0.03, 0.04, 0.06, 1);
      this.scene.fogMode = Scene.FOGMODE_EXP2;
      this.scene.fogDensity = 0.003;
      this.scene.fogColor = new Color3(0.02, 0.03, 0.05);
      this.hemiLight.intensity = 0.5;
      this.dirLight.intensity = 0.7;
    } else if (theme === "coastal_sunset") {
      this.scene.clearColor = new Color4(0.18, 0.09, 0.14, 1);
      this.scene.fogMode = Scene.FOGMODE_EXP2;
      this.scene.fogDensity = 0.002;
      this.scene.fogColor = new Color3(0.17, 0.08, 0.12);
      this.hemiLight.intensity = 0.75;
      this.dirLight.intensity = 1.1;
    } else {
      // desert
      this.scene.clearColor = new Color4(0.14, 0.08, 0.06, 1);
      this.scene.fogMode = Scene.FOGMODE_EXP2;
      this.scene.fogDensity = 0.0025;
      this.scene.fogColor = new Color3(0.14, 0.08, 0.06);
      this.hemiLight.intensity = 0.8;
      this.dirLight.intensity = 1.0;
    }
  }

  public renderFrame(
    raceState: RaceSimState | null,
    playerCar: CarSimState | null,
    dt: number
  ): void {
    if (this.cameraMode === "ORBIT") {
      // Slow turntable orbit for menus & garage
      this.camera.alpha += 0.35 * dt;
      this.camera.radius = 9.5;
      this.camera.beta = 1.25;
      if (playerCar) {
        this.camera.target.set(playerCar.position.x, 0.8, playerCar.position.z);
      }
    } else if (this.cameraMode === "CHASE" && playerCar) {
      // Dynamic Chase Camera
      const forwardX = Math.cos(playerCar.heading);
      const forwardZ = Math.sin(playerCar.heading);

      // Target point slightly ahead of car
      const lookDist = Math.max(4.0, playerCar.speedKmh * 0.06);
      const targetX = playerCar.position.x + forwardX * lookDist;
      const targetZ = playerCar.position.z + forwardZ * lookDist;

      // Smooth camera interpolation towards car heading
      const desiredAlpha = -playerCar.heading - Math.PI / 2;
      let alphaDiff = desiredAlpha - this.camera.alpha;
      while (alphaDiff > Math.PI) alphaDiff -= Math.PI * 2;
      while (alphaDiff < -Math.PI) alphaDiff += Math.PI * 2;
      this.camera.alpha += alphaDiff * Math.min(1.0, 8.0 * dt);

      // Camera radius and height back off with speed
      const speedRatio = Math.min(1.0, playerCar.speedKmh / 240);
      this.camera.radius = 9.5 + speedRatio * 3.5;
      this.camera.beta = 1.28 - speedRatio * 0.08;

      // FOV push during high speed & Rush boost
      const fovBoost = playerCar.isBoosting ? 0.16 : 0.0;
      this.camera.fov = this.baseFov + speedRatio * 0.1 + fovBoost;

      this.camera.target.set(targetX, 0.9, targetZ);
    }

    // Update 3D car meshes
    if (raceState) {
      for (const car of Object.values(raceState.cars)) {
        this.carRenderer.getOrCreateCar(car);
        this.carRenderer.updateCar(car);
      }
    }

    this.scene.render();
  }

  public dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.trackRenderer.dispose();
    this.carRenderer.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}
