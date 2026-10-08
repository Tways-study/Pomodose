"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Object3D, type Group, type InstancedMesh } from "three";
import { THREE_FX } from "@/lib/three/fx";
import { easeToward } from "@/lib/three/math";
import type { Tone } from "@/lib/three/palette";
import { loginLayout, loginPose, type LoginCapsule } from "@/lib/three/scene-layout";
import { makeGelcapGeometry, makeToonMaterial } from "@/lib/three/toon";
import { CANVAS_DPR, CANVAS_GL, FlatLights, useToonGradient } from "./scene-kit";
import { useActiveFrameloop } from "./use-frameloop";

const CAMERA_Z = 14;
const CAMERA_FOV = 35;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_LENGTH = 0.7;

interface PointerRef {
  current: { x: number; y: number };
}

function ToneGroup({
  tone,
  items,
  halfW,
  halfH,
}: {
  tone: Tone;
  items: LoginCapsule[];
  halfW: number;
  halfH: number;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const gradient = useToonGradient();
  const geometry = useMemo(() => makeGelcapGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, tone), [tone]);
  const material = useMemo(() => makeToonMaterial(gradient, { vertexColors: true }), [gradient]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    items.forEach((c, i) => {
      const pose = loginPose(c, t, halfW, halfH);
      dummy.position.set(pose.x, pose.y, pose.z);
      dummy.rotation.set(pose.rx, pose.ry, pose.rz);
      dummy.scale.setScalar(c.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh key={items.length} ref={meshRef} args={[geometry, material, items.length]} frustumCulled={false} />;
}

function LoginScene({ pointer }: { pointer: PointerRef }) {
  const groupRef = useRef<Group>(null);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const halfH = CAMERA_Z * Math.tan((CAMERA_FOV * Math.PI) / 360);
  const halfW = halfH * aspect;
  const layout = useMemo(() => loginLayout(aspect), [aspect]);

  const byTone = useMemo(() => {
    const map = new Map<Tone, LoginCapsule[]>();
    for (const c of layout) map.set(c.tone, [...(map.get(c.tone) ?? []), c]);
    return [...map.entries()];
  }, [layout]);

  // The whole group tilts a few degrees toward the pointer with an eased lerp.
  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    g.rotation.y = easeToward(g.rotation.y, pointer.current.x * THREE_FX.LOGIN_TILT_RAD, dt, THREE_FX.LOGIN_TILT_RATE);
    g.rotation.x = easeToward(g.rotation.x, -pointer.current.y * THREE_FX.LOGIN_TILT_RAD, dt, THREE_FX.LOGIN_TILT_RATE);
  });

  return (
    <group ref={groupRef}>
      {byTone.map(([tone, items]) => (
        <ToneGroup key={tone} tone={tone} items={items} halfW={halfW} halfH={halfH} />
      ))}
    </group>
  );
}

/** Slowly tumbling gelcaps behind the login card, tilting toward the pointer. */
export default function LoginCapsules() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const frameloop = useActiveFrameloop(wrapRef);
  // Fade in once the scene exists so the capsules ease in instead of popping.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-base transition-opacity duration-700 ${shown ? "opacity-100" : "opacity-0"}`}
    >
      <Canvas
        flat
        camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
        dpr={CANVAS_DPR}
        gl={CANVAS_GL}
        frameloop={frameloop}
        style={{ pointerEvents: "none" }}
        onCreated={() => setShown(true)}
      >
        <FlatLights />
        <LoginScene pointer={pointer} />
      </Canvas>
    </div>
  );
}
