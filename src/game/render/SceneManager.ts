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
  private isFirstChaseFrame = true;
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
    this.scene.clearColor = new Color4(0.06, 0.08, 0.14, 1);

    // Camera setup
    this.camera = new ArcRotateCamera(
      "mainCam",
      -Math.PI / 2,
      1.25,
      12,
      new Vector3(0, 1.0, 0),
      this.scene
    );
    this.camera.lowerRadiusLimit = 5.5;
    this.camera.upperRadiusLimit = 25;
    this.camera.fov = this.baseFov;

    // Lighting
    this.hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.scene);
    this.hemiLight.intensity = 0.95;
    this.hemiLight.diffuse = new Color3(0.75, 0.82, 0.98);
    this.hemiLight.groundColor = new Color3(0.18, 0.22, 0.3);

    this.dirLight = new DirectionalLight("dirLight", new Vector3(-0.4, -1, -0.4), this.scene);
    this.dirLight.intensity = 1.2;

    // Cinematic Color Grading & Tone Mapping (Automotive Commercial Look)
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType = 1;
    this.scene.imageProcessingConfiguration.exposure = 1.18;
    this.scene.imageProcessingConfiguration.contrast = 1.25;
    this.scene.imageProcessingConfiguration.vignetteEnabled = true;
    this.scene.imageProcessingConfiguration.vignetteWeight = 1.1;
    this.scene.imageProcessingConfiguration.vignetteColor = new Color4(0, 0, 0, 0);

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

  public setCameraMode(mode: CameraMode, immediateHeading?: number): void {
    this.cameraMode = mode;
    if (mode === "CHASE") {
      this.isFirstChaseFrame = true;
      if (immediateHeading !== undefined) {
        this.camera.alpha = -Math.PI / 2 - immediateHeading;
      }
    }
  }

  public loadTrack(track: TrackSpline): void {
    this.trackRenderer.buildTrack(track);

    // Update scene fog and lighting according to track theme
    const theme = track.data.theme;
    if (theme === "city_night") {
      this.scene.clearColor = new Color4(0.06, 0.08, 0.14, 1);
      this.scene.fogMode = Scene.FOGMODE_LINEAR;
      this.scene.fogStart = 150.0;
      this.scene.fogEnd = 650.0;
      this.scene.fogColor = new Color3(0.08, 0.10, 0.18);
      this.hemiLight.intensity = 0.95;
      this.hemiLight.diffuse = new Color3(0.72, 0.82, 0.98);
      this.hemiLight.groundColor = new Color3(0.18, 0.22, 0.3);
      this.dirLight.intensity = 1.25;
      this.dirLight.diffuse = new Color3(0.95, 0.95, 1.0);
    } else if (theme === "coastal_sunset") {
      this.scene.clearColor = new Color4(0.25, 0.12, 0.18, 1);
      this.scene.fogMode = Scene.FOGMODE_LINEAR;
      this.scene.fogStart = 160.0;
      this.scene.fogEnd = 700.0;
      this.scene.fogColor = new Color3(0.28, 0.15, 0.22);
      this.hemiLight.intensity = 1.05;
      this.hemiLight.diffuse = new Color3(1.0, 0.8, 0.65);
      this.hemiLight.groundColor = new Color3(0.25, 0.15, 0.2);
      this.dirLight.intensity = 1.35;
      this.dirLight.diffuse = new Color3(1.0, 0.85, 0.65);
    } else {
      // desert
      this.scene.clearColor = new Color4(0.22, 0.15, 0.1, 1);
      this.scene.fogMode = Scene.FOGMODE_LINEAR;
      this.scene.fogStart = 150.0;
      this.scene.fogEnd = 650.0;
      this.scene.fogColor = new Color3(0.25, 0.18, 0.12);
      this.hemiLight.intensity = 1.0;
      this.hemiLight.diffuse = new Color3(1.0, 0.92, 0.8);
      this.hemiLight.groundColor = new Color3(0.25, 0.18, 0.12);
      this.dirLight.intensity = 1.3;
      this.dirLight.diffuse = new Color3(1.0, 0.9, 0.7);
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
      // Dynamic Chase Camera (heading 0 = +Z forward)
      const forwardX = Math.sin(playerCar.heading);
      const forwardZ = Math.cos(playerCar.heading);

      // Target point slightly ahead of car
      const lookDist = Math.max(4.0, playerCar.speedKmh * 0.05);
      const targetX = playerCar.position.x + forwardX * lookDist;
      const targetZ = playerCar.position.z + forwardZ * lookDist;

      // Desired alpha in Babylon coordinate system:
      // When heading is 0 (+Z), camera is in -Z relative to target (alpha = -Math.PI / 2)
      const desiredAlpha = -Math.PI / 2 - playerCar.heading;

      if (this.isFirstChaseFrame) {
        this.camera.alpha = desiredAlpha;
        this.camera.beta = 1.30;
        this.camera.radius = 9.0;
        this.camera.target.set(targetX, 1.1, targetZ);
        this.isFirstChaseFrame = false;
      } else {
        let alphaDiff = desiredAlpha - this.camera.alpha;
        while (alphaDiff > Math.PI) alphaDiff -= Math.PI * 2;
        while (alphaDiff < -Math.PI) alphaDiff += Math.PI * 2;
        this.camera.alpha += alphaDiff * Math.min(1.0, 10.0 * dt);

        const speedRatio = Math.min(1.0, playerCar.speedKmh / 240);
        this.camera.radius = 8.8 + speedRatio * 3.2;
        this.camera.beta = 1.30 - speedRatio * 0.06;

        const fovBoost = playerCar.isBoosting ? 0.16 : 0.0;
        this.camera.fov = this.baseFov + speedRatio * 0.1 + fovBoost;

        this.camera.target.set(targetX, 1.1, targetZ);
      }

      // Camera impact shake during collisions and takedowns
      if (raceState && raceState.impactShake && raceState.impactShake > 0) {
        const shakeAmt = raceState.impactShake * 0.35;
        this.camera.target.x += (Math.random() - 0.5) * shakeAmt;
        this.camera.target.y += (Math.random() - 0.5) * shakeAmt;
        raceState.impactShake = Math.max(0, raceState.impactShake - 3.5 * dt);
      }
    }

    // Update 3D car meshes
    if (raceState) {
      for (const car of Object.values(raceState.cars)) {
        this.carRenderer.getOrCreateCar(car, car.color);
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
