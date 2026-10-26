import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { CarSimState } from "../sim/types";

export interface CarVisual {
  root: Mesh;
  chassis: Mesh;
  cockpit: Mesh;
  spoiler: Mesh;
  taillights: Mesh;
  wheels: Mesh[];
  frontWheels: Mesh[];
  bodyMat: StandardMaterial;
  taillightMat: StandardMaterial;
}

export class CarRenderer {
  private visualCars = new Map<string, CarVisual>();

  constructor(private scene: Scene) {}

  public getOrCreateCar(carState: CarSimState, colorHex = "#D4FF2A"): CarVisual {
    let visual = this.visualCars.get(carState.id);
    if (visual) return visual;

    const root = new Mesh(`car_${carState.id}`, this.scene);

    // 1. Aerodynamic Main Chassis
    const chassis = MeshBuilder.CreateBox(
      "chassis",
      { width: 1.95, height: 0.55, depth: 4.4 },
      this.scene
    );
    chassis.position.y = 0.42;
    chassis.parent = root;

    const bodyMat = new StandardMaterial(`bodyMat_${carState.id}`, this.scene);
    bodyMat.diffuseColor = Color3.FromHexString(colorHex);
    bodyMat.specularColor = new Color3(0.4, 0.4, 0.4);
    bodyMat.specularPower = 48;
    chassis.material = bodyMat;

    // 2. Cockpit / Windshield (Tinted glass)
    const cockpit = MeshBuilder.CreateBox(
      "cockpit",
      { width: 1.55, height: 0.46, depth: 2.1 },
      this.scene
    );
    cockpit.position.set(0, 0.84, -0.2);
    cockpit.parent = root;

    const glassMat = new StandardMaterial("glassMat", this.scene);
    glassMat.diffuseColor = new Color3(0.05, 0.08, 0.12);
    glassMat.specularColor = new Color3(0.8, 0.8, 0.9);
    glassMat.alpha = 0.85;
    cockpit.material = glassMat;

    // 3. Rear Spoiler Wing
    const spoiler = MeshBuilder.CreateBox(
      "spoiler",
      { width: 1.85, height: 0.08, depth: 0.45 },
      this.scene
    );
    spoiler.position.set(0, 0.96, -1.85);
    spoiler.parent = root;

    const spoilerMat = new StandardMaterial("spoilerMat", this.scene);
    spoilerMat.diffuseColor = new Color3(0.05, 0.05, 0.06);
    spoiler.material = spoilerMat;

    // 4. LED Headlights
    const headlightL = MeshBuilder.CreateBox(
      "headlightL",
      { width: 0.35, height: 0.1, depth: 0.1 },
      this.scene
    );
    headlightL.position.set(-0.65, 0.45, 2.18);
    headlightL.parent = root;

    const headlightR = MeshBuilder.CreateBox(
      "headlightR",
      { width: 0.35, height: 0.1, depth: 0.1 },
      this.scene
    );
    headlightR.position.set(0.65, 0.45, 2.18);
    headlightR.parent = root;

    const headMat = new StandardMaterial("headMat", this.scene);
    headMat.diffuseColor = new Color3(0.9, 0.95, 1.0);
    headMat.emissiveColor = new Color3(0.8, 0.9, 1.0);
    headlightL.material = headMat;
    headlightR.material = headMat;

    // 5. LED Taillight Bar
    const taillights = MeshBuilder.CreateBox(
      "taillights",
      { width: 1.7, height: 0.1, depth: 0.1 },
      this.scene
    );
    taillights.position.set(0, 0.48, -2.18);
    taillights.parent = root;

    const taillightMat = new StandardMaterial(`tailMat_${carState.id}`, this.scene);
    taillightMat.diffuseColor = new Color3(0.8, 0.05, 0.05);
    taillightMat.emissiveColor = new Color3(0.5, 0.02, 0.02);
    taillights.material = taillightMat;

    // 6. Wheels (4 rubber cylinders with alloy rims)
    const wheels: Mesh[] = [];
    const frontWheels: Mesh[] = [];
    const wheelPositions = [
      { x: -0.98, z: 1.35, isFront: true }, // Front Left
      { x: 0.98, z: 1.35, isFront: true }, // Front Right
      { x: -0.98, z: -1.35, isFront: false }, // Rear Left
      { x: 0.98, z: -1.35, isFront: false }, // Rear Right
    ];

    const tireMat = new StandardMaterial("tireMat", this.scene);
    tireMat.diffuseColor = new Color3(0.08, 0.08, 0.09);
    tireMat.specularColor = new Color3(0.1, 0.1, 0.1);

    wheelPositions.forEach((wp, idx) => {
      const wheel = MeshBuilder.CreateCylinder(
        `wheel_${carState.id}_${idx}`,
        {
          diameter: 0.72,
          height: 0.32,
          tessellation: 20,
        },
        this.scene
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp.x, 0.36, wp.z);
      wheel.material = tireMat;
      wheel.parent = root;

      wheels.push(wheel);
      if (wp.isFront) frontWheels.push(wheel);
    });

    visual = {
      root,
      chassis,
      cockpit,
      spoiler,
      taillights,
      wheels,
      frontWheels,
      bodyMat,
      taillightMat,
    };

    this.visualCars.set(carState.id, visual);
    return visual;
  }

  public updateCar(car: CarSimState, isBraking = false): void {
    const visual = this.visualCars.get(car.id);
    if (!visual) return;

    // Smooth position interpolation
    visual.root.position.x = car.position.x;
    visual.root.position.y = 0.0;
    visual.root.position.z = car.position.z;

    // Yaw rotation
    visual.root.rotation.y = car.heading;

    // Body roll during heavy steering / drifting
    const roll = -(car.lateralVelocity / 20) * 0.12;
    visual.chassis.rotation.z = roll;
    visual.cockpit.rotation.z = roll;

    // Wheel spin
    const spinDelta = (car.speedKmh / 3.6) * 0.08;
    for (const w of visual.wheels) {
      w.rotation.x += spinDelta;
    }

    // Front wheel steer angle
    const steerAngle = -car.angularVelocity * 0.25;
    for (const fw of visual.frontWheels) {
      fw.rotation.y = steerAngle;
    }

    // Brake lights glow
    if (isBraking) {
      visual.taillightMat.emissiveColor = new Color3(1.0, 0.1, 0.1);
    } else {
      visual.taillightMat.emissiveColor = new Color3(0.4, 0.02, 0.02);
    }
  }

  public dispose(): void {
    for (const visual of this.visualCars.values()) {
      visual.root.dispose();
    }
    this.visualCars.clear();
  }
}
