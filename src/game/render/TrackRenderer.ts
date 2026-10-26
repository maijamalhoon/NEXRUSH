import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TrackSpline } from "../sim/track";

export class TrackRenderer {
  private meshes: Mesh[] = [];
  private materials: StandardMaterial[] = [];
  private clouds: Mesh[] = [];
  private waterMesh: Mesh | null = null;
  private animTime = 0;

  constructor(private scene: Scene) {}

  public buildTrack(track: TrackSpline): void {
    this.dispose();

    const samples = track.samples;
    const n = samples.length;
    if (n < 4) return;

    const halfWidth = track.defaultWidth * 0.5;
    const weather = track.data.weather || "sunny_clouds";

    // 1. Sky Dome & Dynamic 3D Clouds
    this.buildSkyDome(track);
    this.buildClouds(weather);

    // 2. Paths for 4-Lane Highway & Markings
    const leftPath: Vector3[] = [];
    const rightPath: Vector3[] = [];

    // Road markings
    const centerLeftPath: Vector3[] = [];
    const centerRightPath: Vector3[] = [];
    const laneDivL_Left: Vector3[] = [];
    const laneDivL_Right: Vector3[] = [];
    const laneDivR_Left: Vector3[] = [];
    const laneDivR_Right: Vector3[] = [];

    const leftEdgeInner: Vector3[] = [];
    const leftEdgeOuter: Vector3[] = [];
    const rightEdgeInner: Vector3[] = [];
    const rightEdgeOuter: Vector3[] = [];

    // Curbs
    const curbLeftInner: Vector3[] = [];
    const curbLeftOuter: Vector3[] = [];
    const curbRightInner: Vector3[] = [];
    const curbRightOuter: Vector3[] = [];

    // Concrete Barriers
    const barrierLeftBase: Vector3[] = [];
    const barrierLeftTop: Vector3[] = [];
    const barrierRightBase: Vector3[] = [];
    const barrierRightTop: Vector3[] = [];

    for (let i = 0; i < n; i++) {
      const s = samples[i];
      const p = s.position;
      const nx = s.normal.x;
      const nz = s.normal.z;

      // Roadway asphalt edges
      leftPath.push(new Vector3(p.x - nx * halfWidth, p.y + 0.02, p.z - nz * halfWidth));
      rightPath.push(new Vector3(p.x + nx * halfWidth, p.y + 0.02, p.z + nz * halfWidth));

      // Centerline ribbon (yellow)
      centerLeftPath.push(new Vector3(p.x - nx * 0.12, p.y + 0.04, p.z - nz * 0.12));
      centerRightPath.push(new Vector3(p.x + nx * 0.12, p.y + 0.04, p.z + nz * 0.12));

      // Lane dividers (4-lane highway: inner left and inner right)
      const laneOffset = halfWidth * 0.5;
      laneDivL_Left.push(new Vector3(p.x - nx * (laneOffset + 0.08), p.y + 0.038, p.z - nz * (laneOffset + 0.08)));
      laneDivL_Right.push(new Vector3(p.x - nx * (laneOffset - 0.08), p.y + 0.038, p.z - nz * (laneOffset - 0.08)));

      laneDivR_Left.push(new Vector3(p.x + nx * (laneOffset - 0.08), p.y + 0.038, p.z + nz * (laneOffset - 0.08)));
      laneDivR_Right.push(new Vector3(p.x + nx * (laneOffset + 0.08), p.y + 0.038, p.z + nz * (laneOffset + 0.08)));

      // Solid white outer edge lines
      leftEdgeInner.push(new Vector3(p.x - nx * (halfWidth - 0.40), p.y + 0.04, p.z - nz * (halfWidth - 0.40)));
      leftEdgeOuter.push(new Vector3(p.x - nx * (halfWidth - 0.16), p.y + 0.04, p.z - nz * (halfWidth - 0.16)));

      rightEdgeInner.push(new Vector3(p.x + nx * (halfWidth - 0.16), p.y + 0.04, p.z + nz * (halfWidth - 0.16)));
      rightEdgeOuter.push(new Vector3(p.x + nx * (halfWidth - 0.40), p.y + 0.04, p.z + nz * (halfWidth - 0.40)));

      // Red & White Rumble Curbs
      curbLeftInner.push(new Vector3(p.x - nx * halfWidth, p.y + 0.08, p.z - nz * halfWidth));
      curbLeftOuter.push(new Vector3(p.x - nx * (halfWidth + 1.1), p.y + 0.15, p.z - nz * (halfWidth + 1.1)));

      curbRightInner.push(new Vector3(p.x + nx * halfWidth, p.y + 0.08, p.z + nz * halfWidth));
      curbRightOuter.push(new Vector3(p.x + nx * (halfWidth + 1.1), p.y + 0.15, p.z + nz * (halfWidth + 1.1)));

      // Concrete Jersey Retaining Barriers
      barrierLeftBase.push(new Vector3(p.x - nx * (halfWidth + 1.5), p.y + 0.1, p.z - nz * (halfWidth + 1.5)));
      barrierLeftTop.push(new Vector3(p.x - nx * (halfWidth + 1.5), p.y + 1.05, p.z - nz * (halfWidth + 1.5)));

      barrierRightBase.push(new Vector3(p.x + nx * (halfWidth + 1.5), p.y + 0.1, p.z + nz * (halfWidth + 1.5)));
      barrierRightTop.push(new Vector3(p.x + nx * (halfWidth + 1.5), p.y + 1.05, p.z + nz * (halfWidth + 1.5)));
    }

    // Connect loops
    leftPath.push(leftPath[0]);
    rightPath.push(rightPath[0]);
    centerLeftPath.push(centerLeftPath[0]);
    centerRightPath.push(centerRightPath[0]);
    laneDivL_Left.push(laneDivL_Left[0]);
    laneDivL_Right.push(laneDivL_Right[0]);
    laneDivR_Left.push(laneDivR_Left[0]);
    laneDivR_Right.push(laneDivR_Right[0]);

    leftEdgeInner.push(leftEdgeInner[0]);
    leftEdgeOuter.push(leftEdgeOuter[0]);
    rightEdgeInner.push(rightEdgeInner[0]);
    rightEdgeOuter.push(rightEdgeOuter[0]);

    curbLeftInner.push(curbLeftInner[0]);
    curbLeftOuter.push(curbLeftOuter[0]);
    curbRightInner.push(curbRightInner[0]);
    curbRightOuter.push(curbRightOuter[0]);

    barrierLeftBase.push(barrierLeftBase[0]);
    barrierLeftTop.push(barrierLeftTop[0]);
    barrierRightBase.push(barrierRightBase[0]);
    barrierRightTop.push(barrierRightTop[0]);

    // --- 1. Realistic Asphalt Road Ribbon ---
    const road = MeshBuilder.CreateRibbon(
      "track_road",
      { pathArray: [leftPath, rightPath], closeArray: false, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    );
    const roadMat = new StandardMaterial("roadMat", this.scene);
    roadMat.diffuseColor = new Color3(0.12, 0.13, 0.16); // High-grade dark asphalt
    roadMat.specularColor = new Color3(0.48, 0.52, 0.60); // Realistic road sheen reflecting sunlight
    roadMat.specularPower = 36;
    road.material = roadMat;
    this.meshes.push(road);
    this.materials.push(roadMat);

    // --- 2. Yellow Centerline Ribbon ---
    const centerLine = MeshBuilder.CreateRibbon(
      "centerLine",
      { pathArray: [centerLeftPath, centerRightPath], closeArray: false },
      this.scene
    );
    const centerMat = new StandardMaterial("centerMat", this.scene);
    centerMat.diffuseColor = new Color3(0.96, 0.82, 0.18);
    centerMat.emissiveColor = new Color3(0.35, 0.28, 0.05);
    centerLine.material = centerMat;
    this.meshes.push(centerLine);
    this.materials.push(centerMat);

    // --- 3. White Lane Divider Ribbons (4-Lane Highway) ---
    const laneDivMat = new StandardMaterial("laneDivMat", this.scene);
    laneDivMat.diffuseColor = new Color3(0.92, 0.94, 0.98);
    laneDivMat.emissiveColor = new Color3(0.2, 0.22, 0.25);
    this.materials.push(laneDivMat);

    const laneDivL = MeshBuilder.CreateRibbon(
      "laneDivL",
      { pathArray: [laneDivL_Left, laneDivL_Right], closeArray: false },
      this.scene
    );
    laneDivL.material = laneDivMat;
    this.meshes.push(laneDivL);

    const laneDivR = MeshBuilder.CreateRibbon(
      "laneDivR",
      { pathArray: [laneDivR_Left, laneDivR_Right], closeArray: false },
      this.scene
    );
    laneDivR.material = laneDivMat;
    this.meshes.push(laneDivR);

    // --- 4. Solid White Edge Lines ---
    const edgeL = MeshBuilder.CreateRibbon(
      "edgeL",
      { pathArray: [leftEdgeInner, leftEdgeOuter], closeArray: false },
      this.scene
    );
    edgeL.material = laneDivMat;
    this.meshes.push(edgeL);

    const edgeR = MeshBuilder.CreateRibbon(
      "edgeR",
      { pathArray: [rightEdgeInner, rightEdgeOuter], closeArray: false },
      this.scene
    );
    edgeR.material = laneDivMat;
    this.meshes.push(edgeR);

    // --- 5. Red & White Curbs ---
    const curbMat = new StandardMaterial("curbMat", this.scene);
    curbMat.diffuseColor = new Color3(0.85, 0.18, 0.18);
    curbMat.specularColor = new Color3(0.25, 0.25, 0.25);
    this.materials.push(curbMat);

    const leftCurb = MeshBuilder.CreateRibbon(
      "left_curb",
      { pathArray: [curbLeftOuter, curbLeftInner], closeArray: false },
      this.scene
    );
    leftCurb.material = curbMat;
    this.meshes.push(leftCurb);

    const rightCurb = MeshBuilder.CreateRibbon(
      "right_curb",
      { pathArray: [curbRightInner, curbRightOuter], closeArray: false },
      this.scene
    );
    rightCurb.material = curbMat;
    this.meshes.push(rightCurb);

    // --- 6. Concrete Barrier Retaining Walls (Matching Reference Photo) ---
    const barrierMat = new StandardMaterial("barrierMat", this.scene);
    barrierMat.diffuseColor = new Color3(0.72, 0.74, 0.78); // Concrete highway block
    barrierMat.specularColor = new Color3(0.18, 0.18, 0.18);
    barrierMat.specularPower = 24;
    this.materials.push(barrierMat);

    const leftBarrier = MeshBuilder.CreateRibbon(
      "left_barrier",
      { pathArray: [barrierLeftBase, barrierLeftTop], closeArray: false, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    );
    leftBarrier.material = barrierMat;
    this.meshes.push(leftBarrier);

    const rightBarrier = MeshBuilder.CreateRibbon(
      "right_barrier",
      { pathArray: [barrierRightBase, barrierRightTop], closeArray: false, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    );
    rightBarrier.material = barrierMat;
    this.meshes.push(rightBarrier);

    // --- 7. Barrier Safety Amber Reflectors ---
    this.buildBarrierReflectors(samples, halfWidth);

    // --- 8. Corner Skid Marks & Racing Line Rubber ---
    this.buildSkidMarks(samples, halfWidth);

    // --- 9. Start / Finish Gantry ---
    this.buildStartGantry(samples[0], halfWidth);

    // --- 10. Trackside Lights & Light Pools ---
    this.buildTrackLights(track, halfWidth);

    // --- 11. Scenery & Mountain Horizon ---
    this.buildScenery(track);
  }

  /**
   * Builds an expansive panoramic sky dome matching real daylight / sunset.
   */
  private buildSkyDome(track: TrackSpline): void {
    const skyDome = MeshBuilder.CreateSphere(
      "skyDome",
      { diameter: 3200, segments: 16, sideOrientation: Mesh.BACKSIDE },
      this.scene
    );
    skyDome.position.set(0, 0, 0);

    const skyMat = new StandardMaterial("skyMat", this.scene);
    skyMat.backFaceCulling = false;
    skyMat.disableLighting = true;

    const weather = track.data.weather || "sunny_clouds";
    if (weather === "sunny_clouds") {
      // Clear azure California sky (Reference Photo style)
      skyMat.emissiveColor = new Color3(0.24, 0.52, 0.88);
    } else if (track.data.theme === "city_night") {
      skyMat.emissiveColor = new Color3(0.06, 0.08, 0.16);
    } else {
      // sunset
      skyMat.emissiveColor = new Color3(0.35, 0.16, 0.24);
    }

    skyDome.material = skyMat;
    this.meshes.push(skyDome);
    this.materials.push(skyMat);
  }

  /**
   * Generates volumetric 3D drifting cumulus clouds across the sky!
   */
  private buildClouds(weather: string): void {
    const cloudMat = new StandardMaterial("cloudMat", this.scene);
    cloudMat.specularColor = new Color3(0.1, 0.1, 0.1);

    if (weather === "sunny_clouds") {
      cloudMat.diffuseColor = new Color3(0.96, 0.98, 1.0);
      cloudMat.emissiveColor = new Color3(0.45, 0.50, 0.60);
      cloudMat.alpha = 0.82;
    } else if (weather === "sunset") {
      cloudMat.diffuseColor = new Color3(0.95, 0.60, 0.40);
      cloudMat.emissiveColor = new Color3(0.40, 0.20, 0.15);
      cloudMat.alpha = 0.85;
    } else {
      // overcast
      cloudMat.diffuseColor = new Color3(0.35, 0.38, 0.42);
      cloudMat.emissiveColor = new Color3(0.15, 0.18, 0.22);
      cloudMat.alpha = 0.90;
    }
    this.materials.push(cloudMat);

    // Create 24 billowy cumulus cloud formations across the 3km sky
    for (let i = 0; i < 24; i++) {
      const cloudRoot = new Mesh(`cloud_group_${i}`, this.scene);
      const angle = (i / 24) * Math.PI * 2 + (i % 3) * 0.4;
      const radius = 350 + (i % 5) * 220;
      const cx = Math.cos(angle) * radius + ((i * 73) % 200 - 100);
      const cz = Math.sin(angle) * radius + ((i * 47) % 200 - 100);
      const cy = 200 + ((i * 19) % 90);

      cloudRoot.position.set(cx, cy, cz);

      // Group of 3-5 overlapping soft spherical cloud puffs
      const puffCount = 3 + (i % 3);
      for (let p = 0; p < puffCount; p++) {
        const sx = 65 + ((p * 23) % 45);
        const sy = 24 + ((p * 13) % 18);
        const sz = 55 + ((p * 31) % 40);

        const puff = MeshBuilder.CreateSphere(`puff_${i}_${p}`, { diameter: 1, segments: 10 }, this.scene);
        puff.scaling.set(sx, sy, sz);
        puff.position.set((p - puffCount * 0.5) * 35, ((p % 2) - 0.5) * 10, ((p % 3) - 1) * 25);
        puff.material = cloudMat;
        puff.parent = cloudRoot;
        this.meshes.push(puff);
      }

      this.clouds.push(cloudRoot);
      this.meshes.push(cloudRoot);
    }
  }

  /**
   * Adds glowing amber safety reflectors along barrier tops.
   */
  private buildBarrierReflectors(samples: Array<{ position: { x: number; y: number; z: number }; normal: { x: number; z: number } }>, halfWidth: number): void {
    const reflectorMat = new StandardMaterial("reflectorMat", this.scene);
    reflectorMat.diffuseColor = new Color3(1.0, 0.65, 0.1);
    reflectorMat.emissiveColor = new Color3(0.95, 0.55, 0.05);
    this.materials.push(reflectorMat);

    for (let i = 0; i < samples.length; i += 7) {
      const s = samples[i];
      const p = s.position;
      const nx = s.normal.x;
      const nz = s.normal.z;

      // Left Reflector Stud
      const studL = MeshBuilder.CreateBox(`studL_${i}`, { width: 0.22, height: 0.10, depth: 0.12 }, this.scene);
      studL.position.set(p.x - nx * (halfWidth + 1.5), p.y + 1.08, p.z - nz * (halfWidth + 1.5));
      studL.material = reflectorMat;
      this.meshes.push(studL);

      // Right Reflector Stud
      const studR = MeshBuilder.CreateBox(`studR_${i}`, { width: 0.22, height: 0.10, depth: 0.12 }, this.scene);
      studR.position.set(p.x + nx * (halfWidth + 1.5), p.y + 1.08, p.z + nz * (halfWidth + 1.5));
      studR.material = reflectorMat;
      this.meshes.push(studR);
    }
  }

  /**
   * Places authentic racing rubber skid marks on braking zones and apexes.
   */
  private buildSkidMarks(samples: Array<{ position: { x: number; y: number; z: number }; normal: { x: number; z: number } }>, halfWidth: number): void {
    const skidMat = new StandardMaterial("skidMat", this.scene);
    skidMat.diffuseColor = new Color3(0.04, 0.04, 0.05); // Burned tire rubber
    skidMat.alpha = 0.55;
    this.materials.push(skidMat);

    // Place skid patches on corner entries every 16 samples
    for (let i = 8; i < samples.length; i += 16) {
      const s = samples[i];
      const p = s.position;
      const nx = s.normal.x;
      const nz = s.normal.z;

      // Dual tire skid track
      const skidL = MeshBuilder.CreatePlane(`skidL_${i}`, { width: 0.6, height: 9.0 }, this.scene);
      skidL.position.set(p.x - nx * (halfWidth * 0.35), p.y + 0.035, p.z - nz * (halfWidth * 0.35));
      skidL.rotation.x = Math.PI / 2;
      skidL.material = skidMat;
      this.meshes.push(skidL);

      const skidR = MeshBuilder.CreatePlane(`skidR_${i}`, { width: 0.6, height: 9.0 }, this.scene);
      skidR.position.set(p.x + nx * (halfWidth * 0.35), p.y + 0.035, p.z + nz * (halfWidth * 0.35));
      skidR.rotation.x = Math.PI / 2;
      skidR.material = skidMat;
      this.meshes.push(skidR);
    }
  }

  /**
   * Start / Finish Gantry with illuminated banner and signal pods.
   */
  private buildStartGantry(
    startSample: {
      position: { x: number; y: number; z: number };
      normal: { x: number; z: number };
      tangent: { x: number; z: number };
    },
    halfWidth: number
  ): void {
    const p = startSample.position;
    const nx = startSample.normal.x;
    const nz = startSample.normal.z;
    const tx = startSample.tangent.x;
    const tz = startSample.tangent.z;

    // Checkered Start/Finish stripe across the asphalt
    const startStripe = MeshBuilder.CreatePlane(
      "startStripe",
      { width: halfWidth * 2, height: 2.4 },
      this.scene
    );
    startStripe.position = new Vector3(p.x, p.y + 0.05, p.z);
    startStripe.rotation.x = Math.PI / 2;
    startStripe.rotation.z = -Math.atan2(tx, tz);

    const stripeMat = new StandardMaterial("stripeMat", this.scene);
    stripeMat.diffuseColor = new Color3(0.96, 0.96, 0.98);
    stripeMat.emissiveColor = new Color3(0.35, 0.35, 0.35);
    startStripe.material = stripeMat;
    this.meshes.push(startStripe);
    this.materials.push(stripeMat);

    // Gantry Truss Structure
    const span = halfWidth + 2.6;
    const pLeft = new Vector3(p.x - nx * span, p.y, p.z - nz * span);
    const pRight = new Vector3(p.x + nx * span, p.y, p.z + nz * span);

    const pillarMat = new StandardMaterial("pillarMat", this.scene);
    pillarMat.diffuseColor = new Color3(0.18, 0.20, 0.25);
    this.materials.push(pillarMat);

    const pillarL = MeshBuilder.CreateCylinder("pillarL", { height: 8.5, diameter: 0.75 }, this.scene);
    pillarL.position = new Vector3(pLeft.x, pLeft.y + 4.25, pLeft.z);
    pillarL.material = pillarMat;
    this.meshes.push(pillarL);

    const pillarR = MeshBuilder.CreateCylinder("pillarR", { height: 8.5, diameter: 0.75 }, this.scene);
    pillarR.position = new Vector3(pRight.x, pRight.y + 4.25, pRight.z);
    pillarR.material = pillarMat;
    this.meshes.push(pillarR);

    // Overhead Heavy Beam
    const beam = MeshBuilder.CreateBox(
      "gantryBeam",
      { width: 1.5, height: 1.6, depth: span * 2 + 1.2 },
      this.scene
    );
    beam.position = new Vector3((pLeft.x + pRight.x) * 0.5, p.y + 8.0, (pLeft.z + pRight.z) * 0.5);
    beam.rotation.y = Math.atan2(pRight.x - pLeft.x, pRight.z - pLeft.z);
    beam.material = pillarMat;
    this.meshes.push(beam);

    // Glowing Countdown Signal Light Pods
    const lightPodMat = new StandardMaterial("podMat", this.scene);
    lightPodMat.diffuseColor = new Color3(0.95, 0.15, 0.15);
    lightPodMat.emissiveColor = new Color3(0.95, 0.15, 0.15);
    this.materials.push(lightPodMat);

    for (let i = -2; i <= 2; i++) {
      const pod = MeshBuilder.CreateSphere(`pod_${i}`, { diameter: 0.45 }, this.scene);
      pod.position = new Vector3(
        (pLeft.x + pRight.x) * 0.5 + nx * (i * 1.3),
        p.y + 7.4,
        (pLeft.z + pRight.z) * 0.5 + nz * (i * 1.3)
      );
      pod.material = lightPodMat;
      this.meshes.push(pod);
    }
  }

  /**
   * Streetlights with downward light pool decals on the asphalt.
   */
  private buildTrackLights(track: TrackSpline, halfWidth: number): void {
    const lampMat = new StandardMaterial("lampPoleMat", this.scene);
    lampMat.diffuseColor = new Color3(0.24, 0.27, 0.34);
    this.materials.push(lampMat);

    const lightBulbMat = new StandardMaterial("lampBulbMat", this.scene);
    lightBulbMat.diffuseColor = new Color3(1.0, 0.95, 0.75);
    lightBulbMat.emissiveColor = new Color3(1.0, 0.95, 0.75);
    this.materials.push(lightBulbMat);

    const poolMat = new StandardMaterial("poolMat", this.scene);
    poolMat.diffuseColor = new Color3(1.0, 0.92, 0.7);
    poolMat.emissiveColor = new Color3(0.35, 0.30, 0.18);
    poolMat.alpha = 0.25;
    this.materials.push(poolMat);

    for (let i = 4; i < track.samples.length; i += 12) {
      const s = track.samples[i];
      const side = (i / 12) % 2 === 0 ? 1 : -1;
      const poleOffset = halfWidth + 2.5;

      const px = s.position.x + s.normal.x * poleOffset * side;
      const pz = s.position.z + s.normal.z * poleOffset * side;

      // Pole
      const pole = MeshBuilder.CreateCylinder(`lamp_${i}`, { height: 9.5, diameter: 0.38 }, this.scene);
      pole.position.set(px, s.position.y + 4.75, pz);
      pole.material = lampMat;
      this.meshes.push(pole);

      // Arm
      const arm = MeshBuilder.CreateBox(`arm_${i}`, { width: 0.22, height: 0.22, depth: 2.4 }, this.scene);
      const armAngle = Math.atan2(-s.normal.x * side, -s.normal.z * side);
      arm.position.set(
        px - s.normal.x * side * 1.0,
        s.position.y + 9.2,
        pz - s.normal.z * side * 1.0
      );
      arm.rotation.y = armAngle;
      arm.material = lampMat;
      this.meshes.push(arm);

      // Fixture Head
      const fixture = MeshBuilder.CreateBox(`fixture_${i}`, { width: 0.5, height: 0.2, depth: 0.85 }, this.scene);
      fixture.position.set(
        px - s.normal.x * side * 2.0,
        s.position.y + 9.0,
        pz - s.normal.z * side * 2.0
      );
      fixture.material = lightBulbMat;
      this.meshes.push(fixture);

      // Light Pool on Asphalt Road
      const pool = MeshBuilder.CreateDisc(`pool_${i}`, { radius: 4.8 }, this.scene);
      pool.rotation.x = Math.PI / 2;
      pool.position.set(
        px - s.normal.x * side * 3.5,
        s.position.y + 0.032,
        pz - s.normal.z * side * 3.5
      );
      pool.material = poolMat;
      this.meshes.push(pool);
    }
  }

  /**
   * Environment Scenery: Mountains matching reference photo, ocean, and canyon rock.
   */
  private buildScenery(track: TrackSpline): void {
    const theme = track.data.theme;

    // Ground plane
    const ground = MeshBuilder.CreateGround("ground", { width: 3200, height: 3200 }, this.scene);
    ground.position.y = -0.05;
    const groundMat = new StandardMaterial("groundMat", this.scene);

    if (theme === "city_night") {
      groundMat.diffuseColor = new Color3(0.05, 0.06, 0.09);
      this.buildCityBuildings(track);
    } else if (theme === "coastal_sunset" || track.data.id === "pacific_highway") {
      groundMat.diffuseColor = new Color3(0.18, 0.16, 0.15); // Highway verge earth
      this.buildCoastalIslands();
    } else {
      groundMat.diffuseColor = new Color3(0.24, 0.16, 0.11);
      this.buildCanyonMesas(track);
    }

    ground.material = groundMat;
    this.meshes.push(ground);
    this.materials.push(groundMat);
  }

  private buildCityBuildings(track: TrackSpline): void {
    const bldgMat = new StandardMaterial("bldgMat", this.scene);
    bldgMat.diffuseColor = new Color3(0.08, 0.1, 0.15);
    bldgMat.specularColor = new Color3(0.2, 0.25, 0.35);
    bldgMat.specularPower = 32;
    this.materials.push(bldgMat);

    const windowMat = new StandardMaterial("windowMat", this.scene);
    windowMat.diffuseColor = new Color3(0.2, 0.4, 0.6);
    windowMat.emissiveColor = new Color3(0.15, 0.28, 0.45);
    this.materials.push(windowMat);

    for (let i = 0; i < track.samples.length; i += 6) {
      const s = track.samples[i];
      const offset = 42 + (i % 4) * 22;
      const side = i % 2 === 0 ? 1 : -1;

      const bx = s.position.x + s.normal.x * offset * side;
      const bz = s.position.z + s.normal.z * offset * side;
      const height = 35 + ((i * 19) % 75);
      const width = 18 + (i % 14);

      const bldg = MeshBuilder.CreateBox(`bldg_${i}`, { width, height, depth: width }, this.scene);
      bldg.position.set(bx, height * 0.5, bz);
      bldg.material = bldgMat;
      this.meshes.push(bldg);

      const band = MeshBuilder.CreateBox(`band_${i}`, { width: width + 0.2, height: 1.8, depth: width + 0.2 }, this.scene);
      band.position.set(bx, height * 0.72, bz);
      band.material = windowMat;
      this.meshes.push(band);
    }
  }

  private buildCoastalIslands(): void {
    // Water plane with reflective sunset/sunlight sheen
    const water = MeshBuilder.CreateGround("water", { width: 3600, height: 3600 }, this.scene);
    water.position.y = -1.2;
    const waterMat = new StandardMaterial("waterMat", this.scene);
    waterMat.diffuseColor = new Color3(0.08, 0.22, 0.38);
    waterMat.specularColor = new Color3(0.85, 0.88, 0.95); // Bright specular sun sheen
    waterMat.specularPower = 64;
    water.material = waterMat;
    this.waterMesh = water;
    this.meshes.push(water);
    this.materials.push(waterMat);

    // Distant Mountain Ranges matching reference photo horizon
    const mountainMat = new StandardMaterial("mountainMat", this.scene);
    mountainMat.diffuseColor = new Color3(0.28, 0.25, 0.30);
    mountainMat.specularColor = new Color3(0.05, 0.05, 0.05);
    this.materials.push(mountainMat);

    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const dist = 1150 + (i % 4) * 160;
      const mx = Math.cos(angle) * dist;
      const mz = Math.sin(angle) * dist;
      const h = 210 + ((i * 37) % 160);
      const diam = 380 + ((i * 19) % 220);

      const mountain = MeshBuilder.CreateCylinder(`mtn_${i}`, {
        height: h,
        diameterTop: 30,
        diameterBottom: diam,
        tessellation: 9,
      }, this.scene);
      mountain.position.set(mx, h * 0.5 - 25, mz);
      mountain.material = mountainMat;
      this.meshes.push(mountain);
    }
  }

  private buildCanyonMesas(track: TrackSpline): void {
    const rockMat = new StandardMaterial("rockMat", this.scene);
    rockMat.diffuseColor = new Color3(0.32, 0.19, 0.12);
    rockMat.specularColor = new Color3(0.1, 0.08, 0.06);
    this.materials.push(rockMat);

    for (let i = 0; i < track.samples.length; i += 5) {
      const s = track.samples[i];
      const offset = 38 + (i % 28);
      const side = i % 2 === 0 ? 1 : -1;

      const rx = s.position.x + s.normal.x * offset * side;
      const rz = s.position.z + s.normal.z * offset * side;
      const h = 24 + ((i * 13) % 45);

      const mesa = MeshBuilder.CreateCylinder(
        `mesa_${i}`,
        { height: h, diameterTop: 20, diameterBottom: 40 },
        this.scene
      );
      mesa.position.set(rx, h * 0.5 - 1, rz);
      mesa.material = rockMat;
      this.meshes.push(mesa);
    }
  }

  /**
   * Updates dynamic clouds and water wave animation every frame.
   */
  public update(dt: number): void {
    this.animTime += dt;

    // Slowly drift clouds across the sky with gentle wind
    const windSpeedX = 3.5 * dt;
    const windSpeedZ = 1.2 * dt;

    for (const cloud of this.clouds) {
      cloud.position.x += windSpeedX;
      cloud.position.z += windSpeedZ;

      // Wrap around bounds so the sky remains full of clouds indefinitely
      if (cloud.position.x > 1400) cloud.position.x -= 2800;
      if (cloud.position.z > 1400) cloud.position.z -= 2800;
    }

    // Subtle water specular ripple
    if (this.waterMesh) {
      this.waterMesh.position.y = -1.2 + Math.sin(this.animTime * 1.5) * 0.05;
    }
  }

  public dispose(): void {
    for (const mesh of this.meshes) {
      mesh.dispose();
    }
    this.meshes = [];
    this.clouds = [];
    this.waterMesh = null;

    for (const mat of this.materials) {
      mat.dispose();
    }
    this.materials = [];
  }
}
