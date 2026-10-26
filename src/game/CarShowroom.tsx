import { useEffect, useRef } from "react";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

type Props = { color: string; accent: string; shape: string; label?: string };

export default function CarShowroom({ color, accent, shape, label = "3D VEHICLE PREVIEW" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, powerPreference: "high-performance" }, false);
    engine.setHardwareScalingLevel(window.matchMedia("(max-width: 700px)").matches ? 1.35 : 1);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.025, 0.045, 0.075, 0);
    scene.skipPointerMovePicking = true;
    const camera = new ArcRotateCamera("showroom-camera", 1.05, 1.12, 7.2, new Vector3(0, 0.55, 0), scene);
    camera.lowerRadiusLimit = 5.2;
    camera.upperRadiusLimit = 9;
    camera.lowerBetaLimit = 0.7;
    camera.upperBetaLimit = 1.45;
    camera.wheelPrecision = 45;
    camera.panningSensibility = 0;
    camera.attachControl(canvas, true);

    const ambient = new HemisphericLight("showroom-ambient", new Vector3(0, 1, 0), scene);
    ambient.intensity = 0.85;
    ambient.groundColor = new Color3(0.06, 0.08, 0.12);
    const key = new DirectionalLight("showroom-key", new Vector3(-0.5, -1, 0.6), scene);
    key.position = new Vector3(-4, 8, 5);
    key.intensity = 1.15;
    const rimLight = new DirectionalLight("showroom-rim", new Vector3(0.65, -0.4, -1), scene);
    rimLight.position = new Vector3(4, 5, -5);
    rimLight.intensity = 0.75;

    const material = (name: string, base: Color3, specular = 0.65, emissive?: Color3) => {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = base;
      m.specularColor = new Color3(specular, specular, specular);
      m.specularPower = 96;
      if (emissive) m.emissiveColor = emissive;
      return m;
    };
    const paint = material("showroom-paint", Color3.FromHexString(color), 0.95);
    const carbon = material("showroom-carbon", new Color3(0.025, 0.035, 0.05), 0.3);
    const glass = material("showroom-glass", new Color3(0.025, 0.085, 0.12), 0.95, new Color3(0.006, 0.02, 0.03));
    const alloy = material("showroom-alloy", new Color3(0.42, 0.5, 0.58), 1);
    const rubber = material("showroom-rubber", new Color3(0.018, 0.022, 0.03), 0.12);
    const glow = material("showroom-accent", Color3.FromHexString(accent), 0.6, Color3.FromHexString(accent).scale(0.5));
    const headlamp = material("showroom-headlights", new Color3(0.7, 0.9, 1), 0.1, new Color3(0.55, 0.85, 1));
    const taillamp = material("showroom-taillights", new Color3(1, 0.02, 0.04), 0.1, new Color3(1, 0.01, 0.025));

    const platform = MeshBuilder.CreateCylinder("showroom-platform", { diameter: 6.8, height: 0.18, tessellation: 64 }, scene);
    platform.position.y = -0.08;
    platform.material = material("showroom-platform-material", new Color3(0.035, 0.055, 0.085), 0.8);
    const ring = MeshBuilder.CreateTorus("showroom-platform-ring", { diameter: 6.55, thickness: 0.035, tessellation: 96 }, scene);
    ring.position.y = 0.025;
    ring.material = glow;
    const floor = MeshBuilder.CreateGround("showroom-floor", { width: 200, height: 200 }, scene);
    floor.position.y = -0.19;
    floor.material = material("showroom-floor-material", new Color3(0.018, 0.027, 0.045), 0.2);

    const isMuscle = shape === "muscle";
    const isHyper = shape === "hyper";
    const width = isMuscle ? 2.08 : isHyper ? 1.88 : 1.94;
    const length = isHyper ? 4.05 : isMuscle ? 3.75 : shape === "sport" ? 3.65 : 3.85;
    const root = MeshBuilder.CreateBox("showroom-car", { width, height: isMuscle ? 0.5 : 0.4, depth: length }, scene);
    root.position.y = 0.48;
    root.material = paint;

    const box = (name: string, size: { width: number; height: number; depth: number }, x: number, y: number, z: number, mat: StandardMaterial, parent = root) => {
      const mesh = MeshBuilder.CreateBox(name, size, scene);
      mesh.position.set(x, y, z);
      mesh.material = mat;
      mesh.parent = parent;
      mesh.isPickable = false;
      return mesh;
    };
    box("showroom-undertray", { width: width * 0.92, height: 0.17, depth: length * 0.9 }, 0, -0.19, 0, carbon);
    box("showroom-hood", { width: width * 0.84, height: 0.12, depth: length * 0.38 }, 0, 0.18, length * 0.26, paint);
    box("showroom-rear-deck", { width: width * 0.84, height: 0.13, depth: length * 0.22 }, 0, 0.16, -length * 0.32, paint);
    box("showroom-front-splitter", { width: width * 1.04, height: 0.06, depth: 0.34 }, 0, -0.19, length * 0.49, carbon);
    box("showroom-grille", { width: width * 0.42, height: 0.12, depth: 0.045 }, 0, -0.015, length * 0.505, carbon);
    box("showroom-grille-highlight", { width: width * 0.25, height: 0.025, depth: 0.05 }, 0, -0.01, length * 0.52, glow);
    box("showroom-tailbar", { width: width * 0.72, height: 0.055, depth: 0.05 }, 0, 0.06, -length * 0.51, taillamp);
    box("showroom-roof", { width: width * 0.56, height: 0.09, depth: length * 0.19 }, 0, 0.55, -0.08, paint);
    const cabin = MeshBuilder.CreateBox("showroom-cabin", { width: width * 0.68, height: 0.34, depth: length * 0.37 }, scene);
    cabin.position.set(0, 0.39, -0.05);
    cabin.material = glass;
    cabin.parent = root;
    box("showroom-windshield", { width: width * 0.58, height: 0.035, depth: length * 0.1 }, 0, 0.43, length * 0.15, glass);
    box("showroom-rear-glass", { width: width * 0.55, height: 0.03, depth: length * 0.09 }, 0, 0.43, -length * 0.19, glass);
    for (const x of [-0.64, 0.64]) {
      box("showroom-headlight", { width: 0.36, height: 0.07, depth: 0.05 }, x, 0.06, length * 0.505, headlamp);
      box("showroom-mirror", { width: 0.2, height: 0.08, depth: 0.15 }, x * 1.2, 0.18, 0.32, paint);
    }
    box("showroom-wing-support-l", { width: 0.07, height: 0.23, depth: 0.07 }, -0.47, 0.28, -length * 0.43, carbon);
    box("showroom-wing-support-r", { width: 0.07, height: 0.23, depth: 0.07 }, 0.47, 0.28, -length * 0.43, carbon);
    box("showroom-wing", { width: width * 0.94, height: 0.08, depth: 0.28 }, 0, 0.39, -length * 0.44, paint);
    for (const x of [-width * 0.49, width * 0.49]) {
      for (const z of [-length * 0.31, length * 0.31]) {
        const wheel = MeshBuilder.CreateCylinder("showroom-tire", { diameter: 0.74, height: 0.28, tessellation: 20 }, scene);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, -0.2, z);
        wheel.material = rubber;
        wheel.parent = root;
        const rim = MeshBuilder.CreateCylinder("showroom-rim", { diameter: 0.5, height: 0.035, tessellation: 20 }, scene);
        rim.rotation.z = Math.PI / 2;
        rim.position.set(x + Math.sign(x) * 0.145, -0.2, z);
        rim.material = alloy;
        rim.parent = root;
        const hub = MeshBuilder.CreateCylinder("showroom-hub", { diameter: 0.15, height: 0.05, tessellation: 12 }, scene);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(x + Math.sign(x) * 0.17, -0.2, z);
        hub.material = glow;
        hub.parent = root;
        for (let spoke = 0; spoke < 5; spoke++) {
          const angle = spoke / 5 * Math.PI * 2;
          box("showroom-spoke", { width: 0.03, height: 0.18, depth: 0.035 }, x + Math.sign(x) * 0.17, -0.2 + Math.sin(angle) * 0.12, z + Math.cos(angle) * 0.12, carbon);
        }
      }
    }

    let last = performance.now();
    engine.runRenderLoop(() => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      root.rotation.y += dt * 0.12;
      scene.render();
    });
    const resize = () => engine.resize();
    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      camera.detachControl();
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, [color, accent, shape]);

  return <div className="car-showroom" aria-label={label}>
    <canvas ref={canvasRef} className="car-showroom-canvas" aria-label="Interactive three-dimensional car preview" />
    <span className="showroom-hint">DRAG TO INSPECT · 3D</span>
  </div>;
}
