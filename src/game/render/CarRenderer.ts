import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { CarSimState } from "../sim/types";

export interface CarVisual {
  root: Mesh;
  bodyParts: Mesh[];
  wheels: Mesh[];
  frontWheels: Mesh[];
  bodyMat: StandardMaterial;
  taillightMat: StandardMaterial;
  headlightMat: StandardMaterial;
  underglowMat?: StandardMaterial;
}

export class CarRenderer {
  private visualCars = new Map<string, CarVisual>();

  constructor(private scene: Scene) {}

  public getOrCreateCar(carState: CarSimState, colorHex = "#D4FF2A"): CarVisual {
    let visual = this.visualCars.get(carState.id);
    if (visual) return visual;

    const root = new Mesh(`car_${carState.id}`, this.scene);
    const bodyParts: Mesh[] = [];

    // Materials
    const bodyMat = new StandardMaterial(`bodyMat_${carState.id}`, this.scene);
    bodyMat.diffuseColor = Color3.FromHexString(colorHex);
    bodyMat.specularColor = new Color3(0.65, 0.65, 0.65);
    bodyMat.specularPower = 64;

    const carbonMat = new StandardMaterial(`carbonMat_${carState.id}`, this.scene);
    carbonMat.diffuseColor = new Color3(0.06, 0.07, 0.09);
    carbonMat.specularColor = new Color3(0.2, 0.2, 0.25);
    carbonMat.specularPower = 32;

    const glassMat = new StandardMaterial("glassMat", this.scene);
    glassMat.diffuseColor = new Color3(0.04, 0.07, 0.12);
    glassMat.specularColor = new Color3(0.9, 0.95, 1.0);
    glassMat.specularPower = 96;
    glassMat.alpha = 0.88;

    const chromeMat = new StandardMaterial("chromeMat", this.scene);
    chromeMat.diffuseColor = new Color3(0.75, 0.75, 0.8);
    chromeMat.specularColor = new Color3(0.9, 0.9, 0.95);
    chromeMat.specularPower = 128;

    const tireRubberMat = new StandardMaterial("tireRubberMat", this.scene);
    tireRubberMat.diffuseColor = new Color3(0.1, 0.11, 0.12);
    tireRubberMat.specularColor = new Color3(0.15, 0.15, 0.15);

    const rimAlloyMat = new StandardMaterial("rimAlloyMat", this.scene);
    rimAlloyMat.diffuseColor = new Color3(0.85, 0.88, 0.92);
    rimAlloyMat.specularColor = new Color3(0.95, 0.95, 1.0);
    rimAlloyMat.specularPower = 90;

    const caliperMat = new StandardMaterial("caliperMat", this.scene);
    caliperMat.diffuseColor = new Color3(0.9, 0.1, 0.1);
    caliperMat.emissiveColor = new Color3(0.35, 0.05, 0.05);

    // --- 1. AERODYNAMIC CHASSIS (Lower Body) ---
    // Central chassis wedge
    const lowerBody = MeshBuilder.CreateBox("lowerBody", { width: 1.88, height: 0.36, depth: 4.1 }, this.scene);
    lowerBody.position.set(0, 0.34, 0);
    lowerBody.material = bodyMat;
    lowerBody.parent = root;
    bodyParts.push(lowerBody);

    // Sloped Hood / Nose
    const hood = MeshBuilder.CreateBox("hood", { width: 1.78, height: 0.22, depth: 1.5 }, this.scene);
    hood.position.set(0, 0.44, 1.25);
    hood.rotation.x = 0.08; // sloped down to nose
    hood.material = bodyMat;
    hood.parent = root;
    bodyParts.push(hood);

    // Front Bumper & Low Splitter (Carbon Fiber)
    const splitter = MeshBuilder.CreateBox("splitter", { width: 1.94, height: 0.06, depth: 0.45 }, this.scene);
    splitter.position.set(0, 0.16, 2.05);
    splitter.material = carbonMat;
    splitter.parent = root;
    bodyParts.push(splitter);

    // Side Skirts (Carbon)
    const skirtL = MeshBuilder.CreateBox("skirtL", { width: 0.12, height: 0.08, depth: 2.3 }, this.scene);
    skirtL.position.set(-0.95, 0.18, 0);
    skirtL.material = carbonMat;
    skirtL.parent = root;

    const skirtR = MeshBuilder.CreateBox("skirtR", { width: 0.12, height: 0.08, depth: 2.3 }, this.scene);
    skirtR.position.set(0.95, 0.18, 0);
    skirtR.material = carbonMat;
    skirtR.parent = root;

    // --- 2. CABIN & COCKPIT GREENHOUSE ---
    // Glass Cockpit (Fastback shape)
    const cabin = MeshBuilder.CreateBox("cabin", { width: 1.48, height: 0.42, depth: 1.85 }, this.scene);
    cabin.position.set(0, 0.72, -0.15);
    cabin.material = glassMat;
    cabin.parent = root;

    // Roof Panel (Carbon)
    const roof = MeshBuilder.CreateBox("roof", { width: 1.35, height: 0.05, depth: 1.2 }, this.scene);
    roof.position.set(0, 0.94, -0.2);
    roof.material = carbonMat;
    roof.parent = root;

    // Windshield frame (Angled front)
    const windshield = MeshBuilder.CreateBox("windshield", { width: 1.44, height: 0.42, depth: 0.55 }, this.scene);
    windshield.position.set(0, 0.68, 0.62);
    windshield.rotation.x = -0.42;
    windshield.material = glassMat;
    windshield.parent = root;

    // --- 3. REAR GT WING & DIFFUSER ---
    // Elevated GT Wing Blade
    const wingBlade = MeshBuilder.CreateBox("wingBlade", { width: 1.92, height: 0.05, depth: 0.38 }, this.scene);
    wingBlade.position.set(0, 0.98, -1.92);
    wingBlade.material = carbonMat;
    wingBlade.parent = root;

    // Wing End-plates
    const endplateL = MeshBuilder.CreateBox("endplateL", { width: 0.04, height: 0.22, depth: 0.42 }, this.scene);
    endplateL.position.set(-0.96, 0.98, -1.92);
    endplateL.material = carbonMat;
    endplateL.parent = root;

    const endplateR = MeshBuilder.CreateBox("endplateR", { width: 0.04, height: 0.22, depth: 0.42 }, this.scene);
    endplateR.position.set(0.96, 0.98, -1.92);
    endplateR.material = carbonMat;
    endplateR.parent = root;

    // Wing Mounting Struts
    const strutL = MeshBuilder.CreateBox("strutL", { width: 0.04, height: 0.38, depth: 0.08 }, this.scene);
    strutL.position.set(-0.45, 0.78, -1.86);
    strutL.rotation.x = -0.25;
    strutL.material = carbonMat;
    strutL.parent = root;

    const strutR = MeshBuilder.CreateBox("strutR", { width: 0.04, height: 0.38, depth: 0.08 }, this.scene);
    strutR.position.set(0.45, 0.78, -1.86);
    strutR.rotation.x = -0.25;
    strutR.material = carbonMat;
    strutR.parent = root;

    // Rear Aerodynamic Diffuser & Exhaust Tips
    const diffuser = MeshBuilder.CreateBox("diffuser", { width: 1.7, height: 0.12, depth: 0.32 }, this.scene);
    diffuser.position.set(0, 0.18, -2.05);
    diffuser.material = carbonMat;
    diffuser.parent = root;

    const exhaustL = MeshBuilder.CreateCylinder("exhaustL", { diameter: 0.12, height: 0.15 }, this.scene);
    exhaustL.rotation.x = Math.PI / 2;
    exhaustL.position.set(-0.35, 0.24, -2.12);
    exhaustL.material = chromeMat;
    exhaustL.parent = root;

    const exhaustR = MeshBuilder.CreateCylinder("exhaustR", { diameter: 0.12, height: 0.15 }, this.scene);
    exhaustR.rotation.x = Math.PI / 2;
    exhaustR.position.set(0.35, 0.24, -2.12);
    exhaustR.material = chromeMat;
    exhaustR.parent = root;

    // --- 4. LIGHTING: LED HEADLIGHTS & REAR TAILLIGHT BAR ---
    // Dual Projector Headlights
    const headlightMat = new StandardMaterial(`headMat_${carState.id}`, this.scene);
    headlightMat.diffuseColor = new Color3(0.9, 0.98, 1.0);
    headlightMat.emissiveColor = new Color3(0.85, 0.95, 1.0);

    const headlightL = MeshBuilder.CreateBox("headlightL", { width: 0.38, height: 0.12, depth: 0.14 }, this.scene);
    headlightL.position.set(-0.64, 0.38, 2.02);
    headlightL.material = headlightMat;
    headlightL.parent = root;

    const headlightR = MeshBuilder.CreateBox("headlightR", { width: 0.38, height: 0.12, depth: 0.14 }, this.scene);
    headlightR.position.set(0.64, 0.38, 2.02);
    headlightR.material = headlightMat;
    headlightR.parent = root;

    // Continuous Full-Width Rear LED Light Bar
    const taillightMat = new StandardMaterial(`tailMat_${carState.id}`, this.scene);
    taillightMat.diffuseColor = new Color3(1.0, 0.05, 0.08);
    taillightMat.emissiveColor = new Color3(0.8, 0.05, 0.05);

    const taillights = MeshBuilder.CreateBox("taillights", { width: 1.76, height: 0.11, depth: 0.08 }, this.scene);
    taillights.position.set(0, 0.45, -2.06);
    taillights.material = taillightMat;
    taillights.parent = root;

    // Underglow Neon Bar
    const underglowMat = new StandardMaterial(`underglow_${carState.id}`, this.scene);
    underglowMat.emissiveColor = Color3.FromHexString(colorHex).scale(0.8);
    underglowMat.diffuseColor = Color3.Black();

    const underglow = MeshBuilder.CreateBox("underglow", { width: 1.5, height: 0.02, depth: 2.6 }, this.scene);
    underglow.position.set(0, 0.08, 0);
    underglow.material = underglowMat;
    underglow.parent = root;

    // --- 5. DETAILED SPORTS WHEELS (Tires + 5-Spoke Rims + Calipers) ---
    const wheels: Mesh[] = [];
    const frontWheels: Mesh[] = [];
    const wheelPositions = [
      { x: -0.96, z: 1.32, isFront: true },  // Front Left
      { x: 0.96, z: 1.32, isFront: true },   // Front Right
      { x: -0.96, z: -1.28, isFront: false }, // Rear Left
      { x: 0.96, z: -1.28, isFront: false },  // Rear Right
    ];

    wheelPositions.forEach((wp, idx) => {
      // Wheel Hub Pivot
      const hub = new Mesh(`wheel_hub_${carState.id}_${idx}`, this.scene);
      hub.position.set(wp.x, 0.33, wp.z);
      hub.parent = root;

      // Outer Rubber Tire
      const tire = MeshBuilder.CreateCylinder(`tire_${idx}`, {
        diameter: 0.68,
        height: 0.30,
        tessellation: 24,
      }, this.scene);
      tire.rotation.z = Math.PI / 2;
      tire.material = tireRubberMat;
      tire.parent = hub;

      // Inner Alloy Rim (Chrome/Alloy)
      const rim = MeshBuilder.CreateCylinder(`rim_${idx}`, {
        diameter: 0.52,
        height: 0.31,
        tessellation: 20,
      }, this.scene);
      rim.rotation.z = Math.PI / 2;
      rim.material = rimAlloyMat;
      rim.parent = hub;

      // Center Spoke Star
      const spoke = MeshBuilder.CreateBox(`spoke_${idx}`, {
        width: 0.32,
        height: 0.44,
        depth: 0.44,
      }, this.scene);
      spoke.material = carbonMat;
      spoke.parent = hub;

      // Red Brake Caliper
      const caliper = MeshBuilder.CreateBox(`caliper_${idx}`, {
        width: 0.14,
        height: 0.16,
        depth: 0.18,
      }, this.scene);
      caliper.position.set(wp.x > 0 ? -0.1 : 0.1, 0.14, 0.08);
      caliper.material = caliperMat;
      caliper.parent = hub;

      wheels.push(hub);
      if (wp.isFront) frontWheels.push(hub);
    });

    visual = {
      root,
      bodyParts,
      wheels,
      frontWheels,
      bodyMat,
      taillightMat,
      headlightMat,
      underglowMat,
    };

    this.visualCars.set(carState.id, visual);
    return visual;
  }

  public updateCar(car: CarSimState, isBraking = false): void {
    const visual = this.visualCars.get(car.id);
    if (!visual) return;

    // Position in world
    visual.root.position.x = car.position.x;
    visual.root.position.y = 0.0;
    visual.root.position.z = car.position.z;

    // Heading yaw rotation (aligned to +Z forward)
    visual.root.rotation.y = car.heading;

    // Body roll during heavy steering / drifting
    const roll = -(car.lateralVelocity / 18) * 0.10;
    for (const part of visual.bodyParts) {
      part.rotation.z = roll;
    }

    // Wheel spin (rotation around local X inside the hub)
    const spinDelta = (car.speedKmh / 3.6) * 0.08;
    for (const w of visual.wheels) {
      w.rotation.x += spinDelta;
    }

    // Front wheel steer angle
    const steerAngle = -car.angularVelocity * 0.22;
    for (const fw of visual.frontWheels) {
      fw.rotation.y = steerAngle;
    }

    // Intense brake light glow
    if (isBraking) {
      visual.taillightMat.emissiveColor = new Color3(1.0, 0.15, 0.15);
    } else {
      visual.taillightMat.emissiveColor = new Color3(0.5, 0.02, 0.02);
    }
  }

  public dispose(): void {
    for (const visual of this.visualCars.values()) {
      visual.root.dispose();
    }
    this.visualCars.clear();
  }
}
