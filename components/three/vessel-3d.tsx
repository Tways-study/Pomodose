"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, invalidate, useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  CylinderGeometry,
  LatheGeometry,
  Object3D,
  Plane,
  RingGeometry,
  SphereGeometry,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  type BufferAttribute,
  type DataTexture,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshToonMaterial,
} from "three";
import {
  CYLINDER,
  CYLINDER_FOOT_PROFILE,
  FLASK,
  GLASS_INSET,
  SPLASH_SECONDS,
  VESSELS,
  bubblePose,
  cylinderTicks,
  dropletPose,
  levelY,
  makeBubbles,
  makeDroplets,
  radiusAt,
  surfaceHeight,
  swayPose,
  type VesselId,
} from "@/lib/three/vessel";
import { easeToward } from "@/lib/three/math";
import { PALETTE } from "@/lib/three/palette";
import { makeToonMaterial } from "@/lib/three/toon";
import { CANVAS_DPR, CANVAS_GL, FlatLights, useToonGradient } from "./scene-kit";
import { useActiveFrameloop } from "./use-frameloop";

export interface VesselProps {
  vessel: VesselId;
  /** Liquid level in [0, 1] (the same value the SVG vessel uses). */
  fraction: number;
  running: boolean;
  /** Increment on each session completion to play the splash. */
  splashKey: number;
  /** Accessible name for the whole vessel. */
  label: string;
  /** true once a frame has been drawn; false if the scene fails or the GPU context is lost. */
  onStatus: (ready: boolean) => void;
}

const now = () => performance.now() / 1000;

const SEGMENTS = 48;
const BUBBLE_COUNT = 14;
const DROPLET_COUNT = 10;
const LEVEL_RATE = 6;      // 1/s, easing of the displayed level toward the timer's
const ENERGY_RATE = 1.8;   // 1/s, how fast slosh settles
const RUN_ENERGY = 0.22;   // resting slosh while a session runs
const START_ENERGY = 1;    // swell on start/resume
const SPLASH_ENERGY = 1.6;

// --- Vessel dressing ---------------------------------------------------------

/** The flask's butter cap. */
function FlaskCap({ gradient }: { gradient: DataTexture }) {
  const geometry = useMemo(
    () => new CylinderGeometry(FLASK.CAP_RADIUS - 0.02, FLASK.CAP_RADIUS, FLASK.CAP_HEIGHT, 28),
    [],
  );
  const material = useMemo(() => makeToonMaterial(gradient, { color: PALETTE.butter }), [gradient]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} position={[0, FLASK.CAP_Y, 0]} />;
}

const LABEL_W = 192;
const LABEL_H = 96;

function drawLabel(canvas: HTMLCanvasElement, texture: CanvasTexture, text: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const family =
    getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() ||
    "ui-rounded, system-ui, sans-serif";
  ctx.clearRect(0, 0, LABEL_W, LABEL_H);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = `600 72px ${family}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 8, LABEL_H / 2 + 4);
  texture.needsUpdate = true;
}

interface TickLabel {
  text: string;
  y: number;
  canvas: HTMLCanvasElement;
  texture: CanvasTexture;
  material: SpriteMaterial;
}

/** The graduated cylinder's foot, rim collar, tick marks and mL labels. */
function CylinderDecor({ gradient }: { gradient: DataTexture }) {
  const ticks = useMemo(() => cylinderTicks(), []);
  const footGeometry = useMemo(
    () => new LatheGeometry(CYLINDER_FOOT_PROFILE.map((p) => new Vector2(p.r, p.y)), SEGMENTS),
    [],
  );
  const collarGeometry = useMemo(() => {
    const g = new TorusGeometry(CYLINDER.RIM_RADIUS, 0.08, 10, 36);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const tickGeometries = useMemo(
    () =>
      ticks.map((t) => {
        const fromX = t.major ? CYLINDER.TICK_MAJOR_FROM_X : CYLINDER.TICK_MINOR_FROM_X;
        const arc = Math.acos(fromX / CYLINDER.RADIUS);
        // An arc on the front-right of the glass, from `fromX` out to the silhouette.
        const g = new TorusGeometry(CYLINDER.RADIUS + 0.008, 0.026, 5, 14, arc);
        g.rotateZ(-arc);
        g.rotateX(-Math.PI / 2);
        g.translate(0, t.y, 0);
        return g;
      }),
    [ticks],
  );
  const footMaterial = useMemo(() => makeToonMaterial(gradient, { color: PALETTE.line }), [gradient]);
  const collarMaterial = useMemo(() => makeToonMaterial(gradient, { color: PALETTE.butter }), [gradient]);
  const tickMaterial = useMemo(() => makeToonMaterial(gradient, { color: PALETTE.inkSoft }), [gradient]);

  const labels = useMemo<TickLabel[]>(() => {
    const entries = [
      ...ticks.filter((t) => t.label !== null).map((t) => ({ text: t.label as string, y: t.y })),
      { text: "mL", y: CYLINDER.HEIGHT - 0.05 },
    ];
    return entries.map(({ text, y }) => {
      const canvas = document.createElement("canvas");
      canvas.width = LABEL_W;
      canvas.height = LABEL_H;
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      drawLabel(canvas, texture, text);
      return { text, y, canvas, texture, material };
    });
  }, [ticks]);

  // The display font may not be loaded when the labels are first drawn: redraw once it is.
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      for (const l of labels) drawLabel(l.canvas, l.texture, l.text);
      invalidate();
    });
    return () => {
      cancelled = true;
    };
  }, [labels]);

  useEffect(
    () => () => {
      footGeometry.dispose();
      collarGeometry.dispose();
      tickGeometries.forEach((g) => g.dispose());
    },
    [footGeometry, collarGeometry, tickGeometries],
  );
  useEffect(
    () => () => {
      footMaterial.dispose();
      collarMaterial.dispose();
      tickMaterial.dispose();
    },
    [footMaterial, collarMaterial, tickMaterial],
  );
  useEffect(
    () => () => {
      for (const l of labels) {
        l.texture.dispose();
        l.material.dispose();
      }
    },
    [labels],
  );

  return (
    <>
      <mesh geometry={footGeometry} material={footMaterial} />
      <mesh geometry={collarGeometry} material={collarMaterial} position={[0, CYLINDER.RIM_Y, 0]} />
      {tickGeometries.map((g, i) => (
        <mesh key={i} geometry={g} material={tickMaterial} />
      ))}
      {labels.map((l) => (
        <sprite
          key={l.text}
          material={l.material}
          position={[CYLINDER.RADIUS + 0.12 + LABEL_W / LABEL_H * 0.18, l.y, 0]}
          scale={[(LABEL_W / LABEL_H) * 0.36, 0.36, 1]}
        />
      ))}
    </>
  );
}

// --- Scene -------------------------------------------------------------------

function VesselScene({ vessel, fraction, running, splashKey, onStatus }: Omit<VesselProps, "label">) {
  const spec = VESSELS[vessel];
  const gradient = useToonGradient();
  const swayRef = useRef<Group>(null);
  const surfaceRef = useRef<Mesh>(null);
  const liquidRef = useRef<Mesh>(null);
  const bubblesRef = useRef<InstancedMesh>(null);
  const dropsRef = useRef<InstancedMesh>(null);

  const levelRef = useRef<number | null>(null);
  const energyRef = useRef(0);
  const presenceRef = useRef(0);
  const splashAtRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const readyRef = useRef(false);
  const prevRunningRef = useRef(running);
  const prevSplashRef = useRef(splashKey);

  const dummy = useMemo(() => new Object3D(), []);
  const bubbleSpecs = useMemo(() => makeBubbles(BUBBLE_COUNT), []);
  const dropSpecs = useMemo(() => makeDroplets(DROPLET_COUNT), []);

  const glassGeometry = useMemo(
    () => new LatheGeometry(spec.profile.map((p) => new Vector2(p.r, p.y)), SEGMENTS),
    [spec],
  );
  const surfaceGeometry = useMemo(() => {
    const g = new RingGeometry(0, 1, 40, 6);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const surfaceBase = useMemo(
    () => Float32Array.from(surfaceGeometry.getAttribute("position").array),
    [surfaceGeometry],
  );
  const orbGeometry = useMemo(() => new SphereGeometry(1, 12, 8), []);

  const glassMaterial = useMemo(
    () => {
      const m = makeToonMaterial(gradient, { color: PALETTE.lilac, opacity: 0.26 });
      m.depthWrite = false;
      return m;
    },
    [gradient],
  );
  const liquidMaterial = useMemo(
    () => {
      const m = makeToonMaterial(gradient, { color: PALETTE.liquid });
      // World-space plane: the liquid wall is clipped to y <= level, so it stays
      // level while the vessel sways. Its constant is moved each frame via liquidRef.
      m.clippingPlanes = [new Plane(new Vector3(0, -1, 0), spec.liquidTop)];
      return m;
    },
    [gradient, spec],
  );
  const lightLiquid = useMemo(
    () => new Color(PALETTE.liquid).lerp(new Color(PALETTE.cream), 0.45).getStyle(),
    [],
  );
  const surfaceMaterial = useMemo(() => makeToonMaterial(gradient, { color: lightLiquid }), [gradient, lightLiquid]);
  const dropMaterial = useMemo(() => makeToonMaterial(gradient, { color: lightLiquid }), [gradient, lightLiquid]);
  const bubbleMaterial = useMemo(
    () => {
      const m = makeToonMaterial(gradient, { color: PALETTE.cream, opacity: 0.55 });
      m.depthWrite = false;
      return m;
    },
    [gradient],
  );

  useEffect(
    () => () => {
      glassGeometry.dispose();
    },
    [glassGeometry],
  );
  useEffect(
    () => () => {
      surfaceGeometry.dispose();
      orbGeometry.dispose();
    },
    [surfaceGeometry, orbGeometry],
  );
  useEffect(
    () => () => {
      glassMaterial.dispose();
      liquidMaterial.dispose();
      surfaceMaterial.dispose();
      dropMaterial.dispose();
      bubbleMaterial.dispose();
    },
    [glassMaterial, liquidMaterial, surfaceMaterial, dropMaterial, bubbleMaterial],
  );

  // Starting or resuming swells the surface; a completion splashes it.
  useEffect(() => {
    if (running && !prevRunningRef.current) energyRef.current = Math.max(energyRef.current, START_ENERGY);
    prevRunningRef.current = running;
    invalidate();
  }, [running]);
  useEffect(() => {
    if (splashKey !== prevSplashRef.current) {
      prevSplashRef.current = splashKey;
      splashAtRef.current = now();
      energyRef.current = SPLASH_ENERGY;
    }
    invalidate();
  }, [splashKey]);
  useEffect(() => {
    invalidate();
  }, [fraction]);

  useFrame(() => {
    const t = now();
    const dt = lastRef.current === 0 ? 1 / 60 : Math.min(t - lastRef.current, 0.05);
    lastRef.current = t;

    const target = levelY(fraction, spec);
    const level = levelRef.current === null ? target : easeToward(levelRef.current, target, dt, LEVEL_RATE);
    levelRef.current = level;

    const floor = running ? RUN_ENERGY : 0;
    energyRef.current = easeToward(energyRef.current, floor, dt, ENERGY_RATE);
    const energy = energyRef.current;
    presenceRef.current = easeToward(presenceRef.current, running ? 1 : 0, dt, 2.5);
    const presence = presenceRef.current;

    const clip = (liquidRef.current?.material as MeshToonMaterial | undefined)?.clippingPlanes?.[0];
    if (clip) clip.constant = level;

    const sway = swayRef.current;
    if (sway) {
      const pose = swayPose(t, presence);
      sway.rotation.set(pose.rotX, 0, pose.rotZ);
      sway.position.y = pose.y;
    }

    const surface = surfaceRef.current;
    if (surface) {
      const r = radiusAt(level, spec.profile) * GLASS_INSET;
      surface.visible = level > spec.liquidBottom + 0.015;
      surface.position.y = level;
      surface.scale.set(r, 1, r);
      if (surface.visible && energy > 0.003) {
        const pos = surfaceGeometry.getAttribute("position") as BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = 0; i < pos.count; i++) {
          arr[i * 3 + 1] = surfaceHeight(surfaceBase[i * 3], surfaceBase[i * 3 + 2], t, energy);
        }
        pos.needsUpdate = true;
        surfaceGeometry.computeVertexNormals();
      }
    }

    const bubbles = bubblesRef.current;
    if (bubbles) {
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const b = bubblePose(bubbleSpecs[i], t, level, spec);
        dummy.position.set(b.x, b.y, b.z);
        dummy.scale.setScalar(b.scale * presence);
        dummy.updateMatrix();
        bubbles.setMatrixAt(i, dummy.matrix);
      }
      bubbles.instanceMatrix.needsUpdate = true;
    }

    const drops = dropsRef.current;
    const splashAt = splashAtRef.current;
    const since = splashAt === null ? -1 : t - splashAt;
    if (splashAt !== null && since > SPLASH_SECONDS) splashAtRef.current = null;
    if (drops) {
      for (let i = 0; i < DROPLET_COUNT; i++) {
        const d = since < 0 ? { x: 0, y: level, z: 0, scale: 0 } : dropletPose(dropSpecs[i], since, level, spec);
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        drops.setMatrixAt(i, dummy.matrix);
      }
      drops.instanceMatrix.needsUpdate = true;
    }

    if (!readyRef.current) {
      readyRef.current = true;
      onStatus(true);
    }

    // Keep frames coming only while something is moving.
    const busy =
      running ||
      energy > floor + 0.003 ||
      presence > 0.003 ||
      Math.abs(level - target) > 0.002 ||
      splashAtRef.current !== null;
    if (busy) invalidate();
  });

  return (
    <>
      <group ref={swayRef}>
        <mesh geometry={glassGeometry} material={glassMaterial} renderOrder={3} />
        <mesh
          ref={liquidRef}
          geometry={glassGeometry}
          material={liquidMaterial}
          scale={[GLASS_INSET, 1, GLASS_INSET]}
        />
        {vessel === "flask" ? <FlaskCap gradient={gradient} /> : <CylinderDecor gradient={gradient} />}
        <instancedMesh
          ref={bubblesRef}
          args={[orbGeometry, bubbleMaterial, BUBBLE_COUNT]}
          frustumCulled={false}
          renderOrder={2}
        />
        <instancedMesh ref={dropsRef} args={[orbGeometry, dropMaterial, DROPLET_COUNT]} frustumCulled={false} />
      </group>
      <mesh ref={surfaceRef} geometry={surfaceGeometry} material={surfaceMaterial} />
    </>
  );
}

/**
 * The timer vessel (flask or graduated cylinder) as a flat-toon 3D object: glass, clipped
 * liquid, bubbles, slosh, sway and a completion splash. Remount (key) to switch vessels.
 */
export default function Vessel3D({ vessel, fraction, running, splashKey, label, onStatus }: VesselProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const loop = useActiveFrameloop(wrapRef);
  const lookY = VESSELS[vessel].lookY;

  useEffect(() => {
    if (loop !== "never") invalidate();
  }, [loop]);

  return (
    <div ref={wrapRef} role="img" aria-label={label} className="pointer-events-none absolute inset-0">
      <Canvas
        flat
        camera={{ position: [0, lookY + 2.75, 11], fov: 29 }}
        dpr={CANVAS_DPR}
        gl={CANVAS_GL}
        frameloop={loop === "never" ? "never" : "demand"}
        style={{ pointerEvents: "none" }}
        onCreated={({ gl, camera }) => {
          camera.lookAt(0, lookY, 0);
          gl.localClippingEnabled = true;
          const el = gl.domElement;
          el.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onStatus(false);
          });
          el.addEventListener("webglcontextrestored", () => onStatus(true));
        }}
      >
        <FlatLights />
        <VesselScene vessel={vessel} fraction={fraction} running={running} splashKey={splashKey} onStatus={onStatus} />
      </Canvas>
    </div>
  );
}
