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
  nitroFlames: Mesh[];
  wreckSmoke: Mesh;
}

export class CarRenderer {
  private visualCars = new Map<string, CarVisual>();

  constructor(private scene: Scene) {}

  public getOrCreateCar(carState: CarSimState, colorHex = "#D61826"): CarVisual {
    let visual = this.visualCars.get(carState.id);
    if (visual) return visual;

    const root = new Mesh(`car_${carState.id}`, this.scene);
    const bodyParts: Mesh[] = [];

    // --- High-Grade Automotive Materials ---
    const bodyMat = new StandardMaterial(`bodyMat_${carState.id}`, this.scene);
    bodyMat.diffuseColor = Color3.FromHexString(colorHex || "#D61826");
    bodyMat.specularColor = new Color3(0.75, 0.75, 0.8);
    bodyMat.specularPower = 64;

    const satinBlackMat = new StandardMaterial(`satinBlack_${carState.id}`, this.scene);
    satinBlackMat.diffuseColor = new Color3(0.08, 0.09, 0.11);
    satinBlackMat.specularColor = new Color3(0.2, 0.2, 0.22);
    satinBlackMat.specularPower = 32;

    const glassMat = new StandardMaterial("glassMat", this.scene);
    glassMat.diffuseColor = new Color3(0.04, 0.05, 0.08);
    glassMat.specularColor = new Color3(0.9, 0.95, 1.0);
    glassMat.specularPower = 96;
    glassMat.alpha = 0.85;

    const chromeMat = new StandardMaterial("chromeMat", this.scene);
    chromeMat.diffuseColor = new Color3(0.8, 0.82, 0.88);
    chromeMat.specularColor = new Color3(0.95, 0.95, 1.0);
    chromeMat.specularPower = 128;

    const tireRubberMat = new StandardMaterial("tireRubberMat", this.scene);
    tireRubberMat.diffuseColor = new Color3(0.1, 0.11, 0.13);
    tireRubberMat.specularColor = new Color3(0.12, 0.12, 0.12);

    const rimMuscleMat = new StandardMaterial("rimMuscleMat", this.scene);
    rimMuscleMat.diffuseColor = new Color3(0.14, 0.15, 0.18); // Satin gunmetal black
    rimMuscleMat.specularColor = new Color3(0.5, 0.52, 0.56);
    rimMuscleMat.specularPower = 48;

    const caliperMat = new StandardMaterial("caliperMat", this.scene);
    caliperMat.diffuseColor = new Color3(0.95, 0.1, 0.1); // Brembo Red
    caliperMat.emissiveColor = new Color3(0.35, 0.02, 0.02);

    // --- 1. DODGE CHALLENGER HELLCAT WIDEBODY CHASSIS ---
    // Main lower muscular body block
    const lowerBody = MeshBuilder.CreateBox("lowerBody", { width: 1.98, height: 0.44, depth: 4.8 }, this.scene);
    lowerBody.position.set(0, 0.38, 0);
    lowerBody.material = bodyMat;
    lowerBody.parent = root;
    bodyParts.push(lowerBody);

    // Satin black lower side skirts
    const skirtL = MeshBuilder.CreateBox("skirtL", { width: 0.08, height: 0.09, depth: 2.7 }, this.scene);
    skirtL.position.set(-1.02, 0.18, 0);
    skirtL.material = satinBlackMat;
    skirtL.parent = root;

    const skirtR = MeshBuilder.CreateBox("skirtR", { width: 0.08, height: 0.09, depth: 2.7 }, this.scene);
    skirtR.position.set(1.02, 0.18, 0);
    skirtR.material = satinBlackMat;
    skirtR.parent = root;

    // --- 2. ICONIC WIDEBODY FLARED FENDERS (Front & Rear) ---
    // Front Left Flare
    const flareFL = MeshBuilder.CreateBox("flareFL", { width: 0.16, height: 0.36, depth: 1.15 }, this.scene);
    flareFL.position.set(-1.06, 0.42, 1.42);
    flareFL.material = bodyMat;
    flareFL.parent = root;
    bodyParts.push(flareFL);

    // Front Right Flare
    const flareFR = MeshBuilder.CreateBox("flareFR", { width: 0.16, height: 0.36, depth: 1.15 }, this.scene);
    flareFR.position.set(1.06, 0.42, 1.42);
    flareFR.material = bodyMat;
    flareFR.parent = root;
    bodyParts.push(flareFR);

    // Rear Left Flare (Wide Muscle Stance)
    const flareRL = MeshBuilder.CreateBox("flareRL", { width: 0.18, height: 0.38, depth: 1.22 }, this.scene);
    flareRL.position.set(-1.08, 0.43, -1.35);
    flareRL.material = bodyMat;
    flareRL.parent = root;
    bodyParts.push(flareRL);

    // Rear Right Flare
    const flareRR = MeshBuilder.CreateBox("flareRR", { width: 0.18, height: 0.38, depth: 1.22 }, this.scene);
    flareRR.position.set(1.08, 0.43, -1.35);
    flareRR.material = bodyMat;
    flareRR.parent = root;
    bodyParts.push(flareRR);

    // --- 3. LONG MUSCLE HOOD WITH DUAL AIR SCOOPS ---
    const hood = MeshBuilder.CreateBox("hood", { width: 1.94, height: 0.16, depth: 1.7 }, this.scene);
    hood.position.set(0, 0.58, 1.42);
    hood.rotation.x = 0.02; // slight muscle car rake
    hood.material = bodyMat;
    hood.parent = root;
    bodyParts.push(hood);

    // Dual Hellcat Heat Extractor Scoops (Left & Right)
    const scoopL = MeshBuilder.CreateBox("scoopL", { width: 0.32, height: 0.06, depth: 0.58 }, this.scene);
    scoopL.position.set(-0.44, 0.68, 1.42);
    scoopL.material = bodyMat;
    scoopL.parent = root;
    bodyParts.push(scoopL);

    const scoopR = MeshBuilder.CreateBox("scoopR", { width: 0.32, height: 0.06, depth: 0.58 }, this.scene);
    scoopR.position.set(0.44, 0.68, 1.42);
    scoopR.material = bodyMat;
    scoopR.parent = root;
    bodyParts.push(scoopR);

    // Recessed Black Nostril Mesh on scoops
    const scoopMouthL = MeshBuilder.CreateBox("scoopMouthL", { width: 0.28, height: 0.05, depth: 0.06 }, this.scene);
    scoopMouthL.position.set(-0.44, 0.68, 1.72);
    scoopMouthL.material = satinBlackMat;
    scoopMouthL.parent = root;

    const scoopMouthR = MeshBuilder.CreateBox("scoopMouthR", { width: 0.28, height: 0.05, depth: 0.06 }, this.scene);
    scoopMouthR.position.set(0.44, 0.68, 1.72);
    scoopMouthR.material = satinBlackMat;
    scoopMouthR.parent = root;

    // --- 4. SIGNATURE FRONT RECESSED GRILLE & QUAD HALO HEADLIGHTS ---
    // Recessed black honeycomb grille frame
    const grilleRecess = MeshBuilder.CreateBox("grilleRecess", { width: 1.92, height: 0.26, depth: 0.14 }, this.scene);
    grilleRecess.position.set(0, 0.50, 2.30);
    grilleRecess.material = satinBlackMat;
    grilleRecess.parent = root;

    // Lower Front Bumper Intake & Front Splitter (Matte Black)
    const lowerIntake = MeshBuilder.CreateBox("lowerIntake", { width: 1.45, height: 0.16, depth: 0.14 }, this.scene);
    lowerIntake.position.set(0, 0.26, 2.30);
    lowerIntake.material = satinBlackMat;
    lowerIntake.parent = root;

    const frontSplitter = MeshBuilder.CreateBox("frontSplitter", { width: 2.06, height: 0.05, depth: 0.42 }, this.scene);
    frontSplitter.position.set(0, 0.16, 2.38);
    frontSplitter.material = satinBlackMat;
    frontSplitter.parent = root;

    // Quad Round Halo Headlights (2 on left, 2 on right!)
    const headlightMat = new StandardMaterial(`headMat_${carState.id}`, this.scene);
    headlightMat.diffuseColor = new Color3(0.92, 0.96, 1.0);
    headlightMat.emissiveColor = new Color3(1.0, 1.0, 1.0); // Bright LED Halo Glow

    const projectorCenterMat = new StandardMaterial("projectorCenterMat", this.scene);
    projectorCenterMat.diffuseColor = new Color3(0.12, 0.14, 0.18);
    projectorCenterMat.specularColor = new Color3(0.9, 0.95, 1.0);

    const quadHaloPositions = [
      { x: -0.72, y: 0.52, z: 2.34 }, // Outer Left
      { x: -0.46, y: 0.52, z: 2.34 }, // Inner Left
      { x: 0.46, y: 0.52, z: 2.34 },  // Inner Right
      { x: 0.72, y: 0.52, z: 2.34 },  // Outer Right
    ];

    quadHaloPositions.forEach((pos, idx) => {
      // Glowing Outer Ring
      const haloRing = MeshBuilder.CreateCylinder(`halo_${idx}`, {
        diameter: 0.20,
        height: 0.04,
        tessellation: 20,
      }, this.scene);
      haloRing.rotation.x = Math.PI / 2;
      haloRing.position.set(pos.x, pos.y, pos.z);
      haloRing.material = headlightMat;
      haloRing.parent = root;

      // Dark Projector Center Lens
      const lens = MeshBuilder.CreateCylinder(`lens_${idx}`, {
        diameter: 0.12,
        height: 0.05,
        tessellation: 16,
      }, this.scene);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(pos.x, pos.y, pos.z + 0.01);
      lens.material = projectorCenterMat;
      lens.parent = root;
    });

    // SRT Badge Accent on Grille
    const srtBadge = MeshBuilder.CreateBox("srtBadge", { width: 0.14, height: 0.05, depth: 0.02 }, this.scene);
    srtBadge.position.set(0.24, 0.52, 2.37);
    srtBadge.material = chromeMat;
    srtBadge.parent = root;

    // --- 5. COUPE GREENHOUSE, PILLARS & SIDE MIRRORS ---
    // Angled Windshield
    const windshield = MeshBuilder.CreateBox("windshield", { width: 1.60, height: 0.44, depth: 0.65 }, this.scene);
    windshield.position.set(0, 0.78, 0.62);
    windshield.rotation.x = -0.52;
    windshield.material = glassMat;
    windshield.parent = root;

    // Fastback Roof
    const roof = MeshBuilder.CreateBox("roof", { width: 1.55, height: 0.05, depth: 1.6 }, this.scene);
    roof.position.set(0, 0.98, -0.16);
    roof.material = bodyMat;
    roof.parent = root;
    bodyParts.push(roof);

    // Rear Sloped Window
    const rearWindow = MeshBuilder.CreateBox("rearWindow", { width: 1.52, height: 0.44, depth: 0.68 }, this.scene);
    rearWindow.position.set(0, 0.78, -0.96);
    rearWindow.rotation.x = 0.52;
    rearWindow.material = glassMat;
    rearWindow.parent = root;

    // Side Windows
    const cabinSides = MeshBuilder.CreateBox("cabinSides", { width: 1.54, height: 0.36, depth: 1.6 }, this.scene);
    cabinSides.position.set(0, 0.78, -0.16);
    cabinSides.material = glassMat;
    cabinSides.parent = root;

    // Side Mirrors in Body Color
    const mirrorL = MeshBuilder.CreateBox("mirrorL", { width: 0.16, height: 0.10, depth: 0.14 }, this.scene);
    mirrorL.position.set(-1.02, 0.74, 0.50);
    mirrorL.material = bodyMat;
    mirrorL.parent = root;

    const mirrorR = MeshBuilder.CreateBox("mirrorR", { width: 0.16, height: 0.10, depth: 0.14 }, this.scene);
    mirrorR.position.set(1.02, 0.74, 0.50);
    mirrorR.material = bodyMat;
    mirrorR.parent = root;

    // --- 6. REAR TRUNK, DUCKTAIL SPOILER, AND CHALLENGER TAILLIGHTS ---
    // Rear Trunk Deck
    const trunk = MeshBuilder.CreateBox("trunk", { width: 1.88, height: 0.15, depth: 0.9 }, this.scene);
    trunk.position.set(0, 0.60, -1.72);
    trunk.material = bodyMat;
    trunk.parent = root;
    bodyParts.push(trunk);

    // Satin Black Ducktail Lip Spoiler
    const spoiler = MeshBuilder.CreateBox("ducktailSpoiler", { width: 1.94, height: 0.08, depth: 0.22 }, this.scene);
    spoiler.position.set(0, 0.70, -2.18);
    spoiler.material = satinBlackMat;
    spoiler.parent = root;

    // Recessed Black Rear Fascia
    const rearFascia = MeshBuilder.CreateBox("rearFascia", { width: 1.88, height: 0.26, depth: 0.10 }, this.scene);
    rearFascia.position.set(0, 0.50, -2.38);
    rearFascia.material = satinBlackMat;
    rearFascia.parent = root;

    // Twin Rectangular Dodge Challenger LED Taillight Halos
    const taillightMat = new StandardMaterial(`tailMat_${carState.id}`, this.scene);
    taillightMat.diffuseColor = new Color3(1.0, 0.08, 0.08);
    taillightMat.emissiveColor = new Color3(0.9, 0.05, 0.05);

    const tailL = MeshBuilder.CreateBox("tailL", { width: 0.65, height: 0.14, depth: 0.04 }, this.scene);
    tailL.position.set(-0.52, 0.50, -2.43);
    tailL.material = taillightMat;
    tailL.parent = root;

    const tailR = MeshBuilder.CreateBox("tailR", { width: 0.65, height: 0.14, depth: 0.04 }, this.scene);
    tailR.position.set(0.52, 0.50, -2.43);
    tailR.material = taillightMat;
    tailR.parent = root;

    // Dual Massive Chrome Exhaust Tips
    const exhaustL = MeshBuilder.CreateCylinder("exhaustL", { diameter: 0.16, height: 0.18 }, this.scene);
    exhaustL.rotation.x = Math.PI / 2;
    exhaustL.position.set(-0.52, 0.22, -2.44);
    exhaustL.material = chromeMat;
    exhaustL.parent = root;

    const exhaustR = MeshBuilder.CreateCylinder("exhaustR", { diameter: 0.16, height: 0.18 }, this.scene);
    exhaustR.rotation.x = Math.PI / 2;
    exhaustR.position.set(0.52, 0.22, -2.44);
    exhaustR.material = chromeMat;
    exhaustR.parent = root;

    // --- 7. NITRO EXHAUST BOOST FLAMES ---
    const nitroMat = new StandardMaterial(`nitroMat_${carState.id}`, this.scene);
    nitroMat.diffuseColor = new Color3(0.2, 0.7, 1.0);
    nitroMat.emissiveColor = new Color3(0.3, 0.85, 1.0);
    nitroMat.alpha = 0.9;

    const nitroL = MeshBuilder.CreateCylinder(`nitroL_${carState.id}`, {
      diameterTop: 0.04,
      diameterBottom: 0.22,
      height: 0.9,
    }, this.scene);
    nitroL.rotation.x = Math.PI / 2;
    nitroL.position.set(-0.52, 0.22, -2.95);
    nitroL.material = nitroMat;
    nitroL.parent = root;
    nitroL.isVisible = false;

    const nitroR = MeshBuilder.CreateCylinder(`nitroR_${carState.id}`, {
      diameterTop: 0.04,
      diameterBottom: 0.22,
      height: 0.9,
    }, this.scene);
    nitroR.rotation.x = Math.PI / 2;
    nitroR.position.set(0.52, 0.22, -2.95);
    nitroR.material = nitroMat;
    nitroR.parent = root;
    nitroR.isVisible = false;

    // --- 8. WRECK DAMAGE SMOKE ---
    const wreckSmokeMat = new StandardMaterial(`smokeMat_${carState.id}`, this.scene);
    wreckSmokeMat.diffuseColor = new Color3(0.15, 0.15, 0.15);
    wreckSmokeMat.emissiveColor = new Color3(0.9, 0.3, 0.05); // smoldering ember
    wreckSmokeMat.alpha = 0.75;

    const wreckSmoke = MeshBuilder.CreateSphere(`wreckSmoke_${carState.id}`, { diameter: 1.2 }, this.scene);
    wreckSmoke.position.set(0, 1.1, 1.4);
    wreckSmoke.material = wreckSmokeMat;
    wreckSmoke.parent = root;
    wreckSmoke.isVisible = false;

    // --- 9. MEATY WIDE RADIAL MUSCLE WHEELS & RED BREMBO CALIPERS ---
    const wheels: Mesh[] = [];
    const frontWheels: Mesh[] = [];
    const wheelPositions = [
      { x: -1.02, z: 1.42, isFront: true, tireWidth: 0.33, diameter: 0.70 },   // Front Left
      { x: 1.02, z: 1.42, isFront: true, tireWidth: 0.33, diameter: 0.70 },    // Front Right
      { x: -1.06, z: -1.35, isFront: false, tireWidth: 0.38, diameter: 0.72 }, // Rear Left (Extra Wide Muscle Radial)
      { x: 1.06, z: -1.35, isFront: false, tireWidth: 0.38, diameter: 0.72 },  // Rear Right (Extra Wide Muscle Radial)
    ];

    wheelPositions.forEach((wp, idx) => {
      // Hub Pivot
      const hub = new Mesh(`hub_${carState.id}_${idx}`, this.scene);
      hub.position.set(wp.x, 0.34, wp.z);
      hub.parent = root;

      // Beefy Outer Rubber Tire
      const tire = MeshBuilder.CreateCylinder(`tire_${idx}`, {
        diameter: wp.diameter,
        height: wp.tireWidth,
        tessellation: 24,
      }, this.scene);
      tire.rotation.z = Math.PI / 2;
      tire.material = tireRubberMat;
      tire.parent = hub;

      // Satin Gunmetal 5-Spoke Muscle Rim
      const rim = MeshBuilder.CreateCylinder(`rim_${idx}`, {
        diameter: wp.diameter * 0.76,
        height: wp.tireWidth + 0.01,
        tessellation: 20,
      }, this.scene);
      rim.rotation.z = Math.PI / 2;
      rim.material = rimMuscleMat;
      rim.parent = hub;

      // 5-Spoke Cross
      const star1 = MeshBuilder.CreateBox(`spoke1_${idx}`, {
        width: wp.tireWidth + 0.02,
        height: 0.12,
        depth: wp.diameter * 0.72,
      }, this.scene);
      star1.material = rimMuscleMat;
      star1.parent = hub;

      const star2 = MeshBuilder.CreateBox(`spoke2_${idx}`, {
        width: wp.tireWidth + 0.02,
        height: wp.diameter * 0.72,
        depth: 0.12,
      }, this.scene);
      star2.material = rimMuscleMat;
      star2.parent = hub;

      // Red Brembo Brake Caliper
      const caliper = MeshBuilder.CreateBox(`caliper_${idx}`, {
        width: 0.12,
        height: 0.22,
        depth: 0.12,
      }, this.scene);
      caliper.position.set(wp.x > 0 ? -0.10 : 0.10, 0.15, 0);
      caliper.material = caliperMat;
      caliper.parent = hub;

      wheels.push(tire);
      if (wp.isFront) {
        frontWheels.push(hub);
      }
    });

    visual = {
      root,
      bodyParts,
      wheels,
      frontWheels,
      bodyMat,
      taillightMat,
      headlightMat,
      nitroFlames: [nitroL, nitroR],
      wreckSmoke,
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

    // Body roll during heavy steering / power slides
    const roll = -(car.lateralVelocity / 20) * 0.08;
    for (const part of visual.bodyParts) {
      part.rotation.z = roll;
    }

    // Wheel spin
    const spinDelta = (car.speedKmh / 3.6) * 0.08;
    for (const w of visual.wheels) {
      w.rotation.x += spinDelta;
    }

    // Front wheel steer angle
    const steerAngle = -car.angularVelocity * 0.22;
    for (const fw of visual.frontWheels) {
      fw.rotation.y = steerAngle;
    }

    // Brake light intensification
    if (isBraking) {
      visual.taillightMat.emissiveColor = new Color3(1.0, 0.2, 0.2);
    } else {
      visual.taillightMat.emissiveColor = new Color3(0.7, 0.04, 0.04);
    }

    // Nitro exhaust flame visibility & flicker
    const showNitro = car.isBoosting && !car.isWrecked;
    for (const flame of visual.nitroFlames) {
      flame.isVisible = showNitro;
      if (showNitro) {
        const flicker = 0.85 + Math.random() * 0.35;
        flame.scaling.set(flicker, flicker, flicker * 1.2);
      }
    }

    // Wreck damage smoke
    if (visual.wreckSmoke) {
      visual.wreckSmoke.isVisible = car.isWrecked;
      if (car.isWrecked) {
        const pulse = 1.0 + Math.sin(Date.now() * 0.01) * 0.25;
        visual.wreckSmoke.scaling.set(pulse, pulse * 1.4, pulse);
      }
    }
  }

  public dispose(): void {
    for (const visual of this.visualCars.values()) {
      visual.root.dispose();
    }
    this.visualCars.clear();
  }
}
