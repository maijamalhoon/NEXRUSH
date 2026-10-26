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

  constructor(private scene: Scene) {}

  public buildTrack(track: TrackSpline): void {
    this.dispose();

    const samples = track.samples;
    const n = samples.length;
    if (n < 4) return;

    const halfWidth = track.defaultWidth * 0.5;

    // 1. Build Sky Dome
    this.buildSkyDome(track);

    // 2. Road & Markings Paths
    const leftPath: Vector3[] = [];
    const rightPath: Vector3[] = [];
    const centerLeftPath: Vector3[] = [];
    const centerRightPath: Vector3[] = [];
    const leftEdgeInner: Vector3[] = [];
    const leftEdgeOuter: Vector3[] = [];
    const rightEdgeInner: Vector3[] = [];
    const rightEdgeOuter: Vector3[] = [];

    const curbLeftInner: Vector3[] = [];
    const curbLeftOuter: Vector3[] = [];
    const curbRightInner: Vector3[] = [];
    const curbRightOuter: Vector3[] = [];

    const barrierLeftBase: Vector3[] = [];
    const barrierLeftTop: Vector3[] = [];
    const barrierRightBase: Vector3[] = [];
    const barrierRightTop: Vector3[] = [];

    for (let i = 0; i < n; i++) {
      const s = samples[i];
      const p = s.position;
      const nx = s.normal.x;
      const nz = s.normal.z;

      // Asphalt edges
      leftPath.push(new Vector3(p.x - nx * halfWidth, p.y + 0.02, p.z - nz * halfWidth));
      rightPath.push(new Vector3(p.x + nx * halfWidth, p.y + 0.02, p.z + nz * halfWidth));

      // Centerline ribbon (yellow)
      centerLeftPath.push(new Vector3(p.x - nx * 0.12, p.y + 0.04, p.z - nz * 0.12));
      centerRightPath.push(new Vector3(p.x + nx * 0.12, p.y + 0.04, p.z + nz * 0.12));

      // White edge lines
      leftEdgeInner.push(new Vector3(p.x - nx * (halfWidth - 0.35), p.y + 0.04, p.z - nz * (halfWidth - 0.35)));
      leftEdgeOuter.push(new Vector3(p.x - nx * (halfWidth - 0.15), p.y + 0.04, p.z - nz * (halfWidth - 0.15)));

      rightEdgeInner.push(new Vector3(p.x + nx * (halfWidth - 0.15), p.y + 0.04, p.z + nz * (halfWidth - 0.15)));
      rightEdgeOuter.push(new Vector3(p.x + nx * (halfWidth - 0.35), p.y + 0.04, p.z + nz * (halfWidth - 0.35)));

      // Raised red/white curbs
      curbLeftInner.push(new Vector3(p.x - nx * halfWidth, p.y + 0.08, p.z - nz * halfWidth));
      curbLeftOuter.push(new Vector3(p.x - nx * (halfWidth + 0.9), p.y + 0.14, p.z - nz * (halfWidth + 0.9)));

      curbRightInner.push(new Vector3(p.x + nx * halfWidth, p.y + 0.08, p.z + nz * halfWidth));
      curbRightOuter.push(new Vector3(p.x + nx * (halfWidth + 0.9), p.y + 0.14, p.z + nz * (halfWidth + 0.9)));

      // Metallic crash barriers
      barrierLeftBase.push(new Vector3(p.x - nx * (halfWidth + 1.4), p.y + 0.1, p.z - nz * (halfWidth + 1.4)));
      barrierLeftTop.push(new Vector3(p.x - nx * (halfWidth + 1.4), p.y + 0.95, p.z - nz * (halfWidth + 1.4)));

      barrierRightBase.push(new Vector3(p.x + nx * (halfWidth + 1.4), p.y + 0.1, p.z + nz * (halfWidth + 1.4)));
      barrierRightTop.push(new Vector3(p.x + nx * (halfWidth + 1.4), p.y + 0.95, p.z + nz * (halfWidth + 1.4)));
    }

    // Close loops
    leftPath.push(leftPath[0]);
    rightPath.push(rightPath[0]);
    centerLeftPath.push(centerLeftPath[0]);
    centerRightPath.push(centerRightPath[0]);
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

    // --- Road Surface ---
    const road = MeshBuilder.CreateRibbon(
      "track_road",
      { pathArray: [leftPath, rightPath], closeArray: false, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    );
    const roadMat = new StandardMaterial("roadMat", this.scene);
    roadMat.diffuseColor = new Color3(0.09, 0.1, 0.13);
    roadMat.specularColor = new Color3(0.3, 0.32, 0.38);
    roadMat.specularPower = 32;
    road.material = roadMat;
    this.meshes.push(road);
    this.materials.push(roadMat);

    // --- Centerline Ribbon ---
    const centerLine = MeshBuilder.CreateRibbon(
      "centerLine",
      { pathArray: [centerLeftPath, centerRightPath], closeArray: false },
      this.scene
    );
    const centerMat = new StandardMaterial("centerMat", this.scene);
    centerMat.diffuseColor = new Color3(0.96, 0.82, 0.18); // Racing yellow
    centerMat.emissiveColor = new Color3(0.4, 0.32, 0.05);
    centerLine.material = centerMat;
    this.meshes.push(centerLine);
    this.materials.push(centerMat);

    // --- White Edge Lines ---
    const edgeMat = new StandardMaterial("edgeMat", this.scene);
    edgeMat.diffuseColor = new Color3(0.92, 0.94, 0.98);
    edgeMat.emissiveColor = new Color3(0.25, 0.25, 0.28);
    this.materials.push(edgeMat);

    const edgeL = MeshBuilder.CreateRibbon(
      "edgeL",
      { pathArray: [leftEdgeInner, leftEdgeOuter], closeArray: false },
      this.scene
    );
    edgeL.material = edgeMat;
    this.meshes.push(edgeL);

    const edgeR = MeshBuilder.CreateRibbon(
      "edgeR",
      { pathArray: [rightEdgeInner, rightEdgeOuter], closeArray: false },
      this.scene
    );
    edgeR.material = edgeMat;
    this.meshes.push(edgeR);

    // --- Left & Right Curbs ---
    const curbMat = new StandardMaterial("curbMat", this.scene);
    curbMat.diffuseColor = new Color3(0.85, 0.18, 0.18);
    curbMat.specularColor = new Color3(0.2, 0.2, 0.2);
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

    // --- Concrete Barrier Retaining Walls ---
    const barrierMat = new StandardMaterial("barrierMat", this.scene);
    barrierMat.diffuseColor = new Color3(0.72, 0.74, 0.78);
    barrierMat.specularColor = new Color3(0.15, 0.15, 0.15);
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

    // --- Start / Finish Checkered Decal & Gantry ---
    this.buildStartGantry(samples[0], halfWidth);

    // --- Trackside Street Lights ---
    this.buildTrackLights(track, halfWidth);

    // --- Scenery Theme ---
    this.buildScenery(track);
  }

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

    const theme = track.data.theme;
    if (theme === "city_night") {
      skyMat.emissiveColor = new Color3(0.06, 0.08, 0.16);
    } else if (theme === "coastal_sunset") {
      skyMat.emissiveColor = new Color3(0.32, 0.14, 0.22);
    } else {
      skyMat.emissiveColor = new Color3(0.28, 0.18, 0.12);
    }

    skyDome.material = skyMat;
    this.meshes.push(skyDome);
    this.materials.push(skyMat);
  }

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

    // 1. Checkered Start/Finish stripe across the asphalt
    const startStripe = MeshBuilder.CreatePlane(
      "startStripe",
      { width: halfWidth * 2, height: 2.2 },
      this.scene
    );
    startStripe.position = new Vector3(p.x, p.y + 0.05, p.z);
    startStripe.rotation.x = Math.PI / 2;
    startStripe.rotation.z = -Math.atan2(tx, tz);

    const stripeMat = new StandardMaterial("stripeMat", this.scene);
    stripeMat.diffuseColor = new Color3(0.95, 0.95, 0.95);
    stripeMat.emissiveColor = new Color3(0.4, 0.4, 0.4);
    startStripe.material = stripeMat;
    this.meshes.push(startStripe);
    this.materials.push(stripeMat);

    // 2. Truss pillars
    const span = halfWidth + 2.6;
    const pLeft = new Vector3(p.x - nx * span, p.y, p.z - nz * span);
    const pRight = new Vector3(p.x + nx * span, p.y, p.z + nz * span);

    const pillarMat = new StandardMaterial("pillarMat", this.scene);
    pillarMat.diffuseColor = new Color3(0.15, 0.18, 0.24);
    this.materials.push(pillarMat);

    const pillarL = MeshBuilder.CreateCylinder("pillarL", { height: 8, diameter: 0.7 }, this.scene);
    pillarL.position = new Vector3(pLeft.x, pLeft.y + 4.0, pLeft.z);
    pillarL.material = pillarMat;
    this.meshes.push(pillarL);

    const pillarR = MeshBuilder.CreateCylinder("pillarR", { height: 8, diameter: 0.7 }, this.scene);
    pillarR.position = new Vector3(pRight.x, pRight.y + 4.0, pRight.z);
    pillarR.material = pillarMat;
    this.meshes.push(pillarR);

    // 3. Top Cross Beam
    const beam = MeshBuilder.CreateBox(
      "gantryBeam",
      { width: 1.4, height: 1.5, depth: span * 2 + 1.2 },
      this.scene
    );
    beam.position = new Vector3((pLeft.x + pRight.x) * 0.5, p.y + 7.5, (pLeft.z + pRight.z) * 0.5);
    beam.rotation.y = Math.atan2(pRight.x - pLeft.x, pRight.z - pLeft.z);
    beam.material = pillarMat;
    this.meshes.push(beam);

    // 4. Glowing Start Countdown Signal Lights
    const lightPodMat = new StandardMaterial("podMat", this.scene);
    lightPodMat.diffuseColor = new Color3(0.95, 0.15, 0.15);
    lightPodMat.emissiveColor = new Color3(0.95, 0.15, 0.15);
    this.materials.push(lightPodMat);

    for (let i = -2; i <= 2; i++) {
      const pod = MeshBuilder.CreateSphere(`pod_${i}`, { diameter: 0.4 }, this.scene);
      pod.position = new Vector3(
        (pLeft.x + pRight.x) * 0.5 + nx * (i * 1.2),
        p.y + 7.0,
        (pLeft.z + pRight.z) * 0.5 + nz * (i * 1.2)
      );
      pod.material = lightPodMat;
      this.meshes.push(pod);
    }
  }

  private buildTrackLights(track: TrackSpline, halfWidth: number): void {
    const lampMat = new StandardMaterial("lampPoleMat", this.scene);
    lampMat.diffuseColor = new Color3(0.22, 0.25, 0.32);
    this.materials.push(lampMat);

    const lightBulbMat = new StandardMaterial("lampBulbMat", this.scene);
    lightBulbMat.diffuseColor = new Color3(1.0, 0.95, 0.75);
    lightBulbMat.emissiveColor = new Color3(1.0, 0.95, 0.75);
    this.materials.push(lightBulbMat);

    // Place a light pole every 10 samples
    for (let i = 4; i < track.samples.length; i += 10) {
      const s = track.samples[i];
      const side = (i / 10) % 2 === 0 ? 1 : -1;
      const poleOffset = halfWidth + 2.4;

      const px = s.position.x + s.normal.x * poleOffset * side;
      const pz = s.position.z + s.normal.z * poleOffset * side;

      // Pole
      const pole = MeshBuilder.CreateCylinder(`lamp_${i}`, { height: 9, diameter: 0.35 }, this.scene);
      pole.position.set(px, s.position.y + 4.5, pz);
      pole.material = lampMat;
      this.meshes.push(pole);

      // Arm extending inwards
      const arm = MeshBuilder.CreateBox(`arm_${i}`, { width: 0.2, height: 0.2, depth: 2.2 }, this.scene);
      const armAngle = Math.atan2(-s.normal.x * side, -s.normal.z * side);
      arm.position.set(
        px - s.normal.x * side * 0.9,
        s.position.y + 8.8,
        pz - s.normal.z * side * 0.9
      );
      arm.rotation.y = armAngle;
      arm.material = lampMat;
      this.meshes.push(arm);

      // Glowing Lamp Fixture Head
      const fixture = MeshBuilder.CreateBox(`fixture_${i}`, { width: 0.45, height: 0.2, depth: 0.8 }, this.scene);
      fixture.position.set(
        px - s.normal.x * side * 1.8,
        s.position.y + 8.6,
        pz - s.normal.z * side * 1.8
      );
      fixture.material = lightBulbMat;
      this.meshes.push(fixture);
    }
  }

  private buildScenery(track: TrackSpline): void {
    const theme = track.data.theme;

    // Ground plane
    const ground = MeshBuilder.CreateGround("ground", { width: 3200, height: 3200 }, this.scene);
    ground.position.y = -0.05;
    const groundMat = new StandardMaterial("groundMat", this.scene);

    if (theme === "city_night") {
      groundMat.diffuseColor = new Color3(0.05, 0.06, 0.09);
      this.buildCityBuildings(track);
    } else if (theme === "coastal_sunset") {
      groundMat.diffuseColor = new Color3(0.14, 0.09, 0.08);
      this.buildCoastalIslands();
    } else {
      groundMat.diffuseColor = new Color3(0.22, 0.14, 0.09);
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

    // Place skyline skyscrapers around track perimeter
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

      // Lit window band
      const band = MeshBuilder.CreateBox(`band_${i}`, { width: width + 0.2, height: 1.8, depth: width + 0.2 }, this.scene);
      band.position.set(bx, height * 0.72, bz);
      band.material = windowMat;
      this.meshes.push(band);
    }
  }

  private buildCoastalIslands(): void {
    // Water plane with reflective sunset sheen
    const water = MeshBuilder.CreateGround("water", { width: 3600, height: 3600 }, this.scene);
    water.position.y = -1.2;
    const waterMat = new StandardMaterial("waterMat", this.scene);
    waterMat.diffuseColor = new Color3(0.08, 0.16, 0.28);
    waterMat.specularColor = new Color3(0.8, 0.55, 0.4);
    waterMat.specularPower = 64;
    water.material = waterMat;
    this.meshes.push(water);
    this.materials.push(waterMat);

    // Distant Mountain Ranges matching reference photo horizon
    const mountainMat = new StandardMaterial("mountainMat", this.scene);
    mountainMat.diffuseColor = new Color3(0.25, 0.21, 0.26);
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

  public dispose(): void {
    for (const mesh of this.meshes) {
      mesh.dispose();
    }
    this.meshes = [];

    for (const mat of this.materials) {
      mat.dispose();
    }
    this.materials = [];
  }
}
