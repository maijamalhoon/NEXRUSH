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

    // 1. Build Road Ribbon Mesh
    const leftPath: Vector3[] = [];
    const rightPath: Vector3[] = [];
    const curbLeftPath: Vector3[] = [];
    const curbRightPath: Vector3[] = [];
    const barrierLeftPath: Vector3[] = [];
    const barrierRightPath: Vector3[] = [];

    const halfWidth = track.defaultWidth * 0.5;

    for (let i = 0; i < n; i++) {
      const s = samples[i];
      const p = s.position;
      const nx = s.normal.x;
      const nz = s.normal.z;

      // Asphalt edges
      leftPath.push(new Vector3(p.x - nx * halfWidth, p.y + 0.05, p.z - nz * halfWidth));
      rightPath.push(new Vector3(p.x + nx * halfWidth, p.y + 0.05, p.z + nz * halfWidth));

      // Curbs (slightly raised)
      curbLeftPath.push(
        new Vector3(p.x - nx * (halfWidth + 0.8), p.y + 0.12, p.z - nz * (halfWidth + 0.8))
      );
      curbRightPath.push(
        new Vector3(p.x + nx * (halfWidth + 0.8), p.y + 0.12, p.z + nz * (halfWidth + 0.8))
      );

      // Guardrail barriers
      barrierLeftPath.push(
        new Vector3(p.x - nx * (halfWidth + 1.6), p.y + 0.8, p.z - nz * (halfWidth + 1.6))
      );
      barrierRightPath.push(
        new Vector3(p.x + nx * (halfWidth + 1.6), p.y + 0.8, p.z + nz * (halfWidth + 1.6))
      );
    }

    // Connect closed loops
    leftPath.push(leftPath[0]);
    rightPath.push(rightPath[0]);
    curbLeftPath.push(curbLeftPath[0]);
    curbRightPath.push(curbRightPath[0]);
    barrierLeftPath.push(barrierLeftPath[0]);
    barrierRightPath.push(barrierRightPath[0]);

    // Road Mesh
    const road = MeshBuilder.CreateRibbon(
      "track_road",
      { pathArray: [leftPath, rightPath], closeArray: false, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    );
    const roadMat = new StandardMaterial("roadMat", this.scene);
    roadMat.diffuseColor = new Color3(0.08, 0.09, 0.12);
    roadMat.specularColor = new Color3(0.2, 0.22, 0.28);
    roadMat.specularPower = 32;
    road.material = roadMat;
    this.meshes.push(road);
    this.materials.push(roadMat);

    // Left Curb
    const leftCurb = MeshBuilder.CreateRibbon(
      "left_curb",
      { pathArray: [curbLeftPath, leftPath], closeArray: false },
      this.scene
    );
    const curbMat = new StandardMaterial("curbMat", this.scene);
    curbMat.diffuseColor = new Color3(0.85, 0.15, 0.15); // Racing red
    curbMat.specularColor = new Color3(0.1, 0.1, 0.1);
    leftCurb.material = curbMat;
    this.meshes.push(leftCurb);

    // Right Curb
    const rightCurb = MeshBuilder.CreateRibbon(
      "right_curb",
      { pathArray: [rightPath, curbRightPath], closeArray: false },
      this.scene
    );
    rightCurb.material = curbMat;
    this.meshes.push(rightCurb);
    this.materials.push(curbMat);

    // Barriers
    const leftBarrier = MeshBuilder.CreateRibbon(
      "left_barrier",
      {
        pathArray: [curbLeftPath, barrierLeftPath],
        closeArray: false,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      this.scene
    );
    const barrierMat = new StandardMaterial("barrierMat", this.scene);
    barrierMat.diffuseColor = new Color3(0.35, 0.38, 0.45);
    barrierMat.specularColor = new Color3(0.4, 0.4, 0.4);
    leftBarrier.material = barrierMat;
    this.meshes.push(leftBarrier);

    const rightBarrier = MeshBuilder.CreateRibbon(
      "right_barrier",
      {
        pathArray: [curbRightPath, barrierRightPath],
        closeArray: false,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      this.scene
    );
    rightBarrier.material = barrierMat;
    this.meshes.push(rightBarrier);
    this.materials.push(barrierMat);

    // Start / Finish Gantry
    this.buildStartGantry(samples[0], halfWidth);

    // Scenery Theme
    this.buildScenery(track);
  }

  private buildStartGantry(
    startSample: {
      position: { x: number; y: number; z: number };
      normal: { x: number; z: number };
    },
    halfWidth: number
  ): void {
    const p = startSample.position;
    const nx = startSample.normal.x;
    const nz = startSample.normal.z;

    const span = halfWidth + 2.5;
    const pLeft = new Vector3(p.x - nx * span, p.y, p.z - nz * span);
    const pRight = new Vector3(p.x + nx * span, p.y, p.z + nz * span);

    // Truss pillars
    const pillarL = MeshBuilder.CreateCylinder("pillarL", { height: 7, diameter: 0.6 }, this.scene);
    pillarL.position = new Vector3(pLeft.x, pLeft.y + 3.5, pLeft.z);
    this.meshes.push(pillarL);

    const pillarR = MeshBuilder.CreateCylinder("pillarR", { height: 7, diameter: 0.6 }, this.scene);
    pillarR.position = new Vector3(pRight.x, pRight.y + 3.5, pRight.z);
    this.meshes.push(pillarR);

    // Top Beam
    const beam = MeshBuilder.CreateBox(
      "beam",
      { width: 1.2, height: 1.2, depth: span * 2 + 1 },
      this.scene
    );
    beam.position = new Vector3((pLeft.x + pRight.x) * 0.5, p.y + 6.8, (pLeft.z + pRight.z) * 0.5);
    beam.rotation.y = Math.atan2(pRight.x - pLeft.x, pRight.z - pLeft.z);
    this.meshes.push(beam);

    const gantryMat = new StandardMaterial("gantryMat", this.scene);
    gantryMat.diffuseColor = new Color3(0.12, 0.15, 0.2);
    pillarL.material = gantryMat;
    pillarR.material = gantryMat;
    beam.material = gantryMat;
    this.materials.push(gantryMat);
  }

  private buildScenery(track: TrackSpline): void {
    const theme = track.data.theme;

    // Ground plane
    const ground = MeshBuilder.CreateGround("ground", { width: 900, height: 900 }, this.scene);
    ground.position.y = -0.05;
    const groundMat = new StandardMaterial("groundMat", this.scene);

    if (theme === "city_night") {
      groundMat.diffuseColor = new Color3(0.04, 0.05, 0.07);
      this.buildCityBuildings(track);
    } else if (theme === "coastal_sunset") {
      groundMat.diffuseColor = new Color3(0.12, 0.08, 0.07);
      this.buildCoastalIslands();
    } else {
      // desert_industrial
      groundMat.diffuseColor = new Color3(0.18, 0.11, 0.07);
      this.buildCanyonMesas(track);
    }

    ground.material = groundMat;
    this.meshes.push(ground);
    this.materials.push(groundMat);
  }

  private buildCityBuildings(track: TrackSpline): void {
    const buildingMat = new StandardMaterial("bldgMat", this.scene);
    buildingMat.diffuseColor = new Color3(0.06, 0.08, 0.12);
    buildingMat.emissiveColor = new Color3(0.03, 0.04, 0.08);
    this.materials.push(buildingMat);

    // Place skyline buildings around track perimeter
    for (let i = 0; i < track.samples.length; i += 8) {
      const s = track.samples[i];
      const offset = 45 + (i % 3) * 20;
      const side = i % 2 === 0 ? 1 : -1;

      const bx = s.position.x + s.normal.x * offset * side;
      const bz = s.position.z + s.normal.z * offset * side;
      const height = 30 + ((i * 17) % 60);
      const width = 16 + (i % 12);

      const bldg = MeshBuilder.CreateBox(`bldg_${i}`, { width, height, depth: width }, this.scene);
      bldg.position = new Vector3(bx, height * 0.5, bz);
      bldg.material = buildingMat;
      this.meshes.push(bldg);
    }
  }

  private buildCoastalIslands(): void {
    // Water plane
    const water = MeshBuilder.CreateGround("water", { width: 1200, height: 1200 }, this.scene);
    water.position.y = -1.2;
    const waterMat = new StandardMaterial("waterMat", this.scene);
    waterMat.diffuseColor = new Color3(0.05, 0.12, 0.22);
    waterMat.specularColor = new Color3(0.5, 0.4, 0.3); // sunset sheen
    water.material = waterMat;
    this.meshes.push(water);
    this.materials.push(waterMat);
  }

  private buildCanyonMesas(track: TrackSpline): void {
    const rockMat = new StandardMaterial("rockMat", this.scene);
    rockMat.diffuseColor = new Color3(0.28, 0.16, 0.1);
    this.materials.push(rockMat);

    for (let i = 0; i < track.samples.length; i += 6) {
      const s = track.samples[i];
      const offset = 35 + (i % 25);
      const side = i % 2 === 0 ? 1 : -1;

      const rx = s.position.x + s.normal.x * offset * side;
      const rz = s.position.z + s.normal.z * offset * side;
      const h = 20 + ((i * 13) % 40);

      const mesa = MeshBuilder.CreateCylinder(
        `mesa_${i}`,
        { height: h, diameterTop: 18, diameterBottom: 35 },
        this.scene
      );
      mesa.position = new Vector3(rx, h * 0.5 - 1, rz);
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
