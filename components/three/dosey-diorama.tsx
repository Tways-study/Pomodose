"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { SphereGeometry, type BufferGeometry, type Group, type Material } from "three";
import { THREE_FX } from "@/lib/three/fx";
import { easeToward } from "@/lib/three/math";
import { PALETTE } from "@/lib/three/palette";
import {
  DIORAMA_ITEMS,
  DIORAMA_LAYER_OPACITY,
  dioramaPose,
  type DioramaItem,
} from "@/lib/three/scene-layout";
import { makeGelcapGeometry, makeToonMaterial } from "@/lib/three/toon";
import { CANVAS_DPR, CANVAS_GL, FlatLights, useToonGradient } from "./scene-kit";
import { useActiveFrameloop } from "./use-frameloop";

const CAMERA_Z = 10;
const CAMERA_FOV = 40;

interface PointerRef {
  current: { x: number; y: number };
}

interface Built {
  geometries: BufferGeometry[];
  materials: Material[];
  byItem: { item: DioramaItem; geometry: BufferGeometry; material: Material; flat: boolean }[];
}

function DioramaScene({ pointer }: { pointer: PointerRef }) {
  const size = useThree((s) => s.size);
  const groupRefs = useRef<(Group | null)[]>([]);
  const gradient = useToonGradient();
  const halfH = CAMERA_Z * Math.tan((CAMERA_FOV * Math.PI) / 360);
  const halfW = halfH * (size.width / Math.max(1, size.height));

  const built = useMemo<Built>(() => {
    const pillGeos = new Map<string, BufferGeometry>();
    const leafGeo = new SphereGeometry(0.34, 14, 10);
    const tomatoGeo = new SphereGeometry(0.28, 14, 10);
    const geometries: BufferGeometry[] = [leafGeo, tomatoGeo];
    const materials: Material[] = [];
    const byItem: Built["byItem"] = DIORAMA_ITEMS.map((item) => {
      const opacity = DIORAMA_LAYER_OPACITY[item.layer];
      if (item.kind === "pill") {
        let geo = pillGeos.get(item.tone);
        if (!geo) {
          geo = makeGelcapGeometry(0.2, 0.42, item.tone);
          pillGeos.set(item.tone, geo);
          geometries.push(geo);
        }
        const material = makeToonMaterial(gradient, { vertexColors: true, opacity });
        materials.push(material);
        return { item, geometry: geo, material, flat: false };
      }
      const material = makeToonMaterial(gradient, { color: PALETTE[item.tone], opacity });
      materials.push(material);
      return { item, geometry: item.kind === "leaf" ? leafGeo : tomatoGeo, material, flat: item.kind === "leaf" };
    });
    return { geometries, materials, byItem };
  }, [gradient]);

  useEffect(
    () => () => {
      built.geometries.forEach((g) => g.dispose());
      built.materials.forEach((m) => m.dispose());
    },
    [built],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    // Parallax: the camera drifts a little toward the pointer; far layers shift more on screen.
    state.camera.position.x = easeToward(state.camera.position.x, pointer.current.x * THREE_FX.DIORAMA_PARALLAX, dt, THREE_FX.DIORAMA_RATE);
    state.camera.position.y = easeToward(state.camera.position.y, -pointer.current.y * THREE_FX.DIORAMA_PARALLAX, dt, THREE_FX.DIORAMA_RATE);
    built.byItem.forEach(({ item }, i) => {
      const g = groupRefs.current[i];
      if (!g) return;
      const pose = dioramaPose(item, t, halfW, halfH);
      g.position.set(pose.x, pose.y, pose.z);
      g.rotation.set(pose.rx, pose.ry, pose.rz);
    });
  });

  return (
    <>
      {built.byItem.map(({ item, geometry, material, flat }, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          scale={item.scale}
        >
          <mesh geometry={geometry} material={material} scale={flat ? [1.35, 0.4, 0.9] : 1} />
        </group>
      ))}
    </>
  );
}

/** Drifting pills, sprout leaves and tomatoes behind Dosey; only renders while in view. */
export default function DoseyDiorama() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const frameloop = useActiveFrameloop(wrapRef);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      pointer.current = {
        x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)),
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Canvas
        flat
        camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
        dpr={CANVAS_DPR}
        gl={CANVAS_GL}
        frameloop={frameloop}
        style={{ pointerEvents: "none" }}
      >
        <FlatLights />
        <DioramaScene pointer={pointer} />
      </Canvas>
    </div>
  );
}
