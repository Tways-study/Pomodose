"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";
import { initParticles, isDone, particleScale, stepParticle, type Particle } from "@/lib/three/burst";
import { THREE_FX } from "@/lib/three/fx";
import type { Tone } from "@/lib/three/palette";
import { makeGelcapGeometry, makeToonMaterial } from "@/lib/three/toon";
import { CANVAS_DPR, CANVAS_GL, FlatLights, useToonGradient } from "./scene-kit";

interface Props {
  tone: Tone;
  onDone: () => void;
}

interface Origin {
  x: number;
  y: number;
}

/** Viewport-pixel center of the vial, or the middle of the viewport as a fallback. */
function readOrigin(): Origin {
  const anchor = document.querySelector("[data-vial-anchor]");
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function BurstScene({ tone, origin, onDone }: Props & { origin: Origin }) {
  const meshRef = useRef<InstancedMesh>(null);
  const particlesRef = useRef<Particle[] | null>(null);
  const doneRef = useRef(false);
  const dummy = useMemo(() => new Object3D(), []);
  const size = useThree((s) => s.size);
  const gradient = useToonGradient();

  const geometry = useMemo(
    () => makeGelcapGeometry(THREE_FX.BURST_CAPSULE_RADIUS, THREE_FX.BURST_CAPSULE_LENGTH, tone),
    [tone],
  );
  const material = useMemo(() => makeToonMaterial(gradient, { vertexColors: true }), [gradient]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Orthographic camera, 1 unit = 1 px, origin at the viewport center, y up.
    const ox = origin.x - size.width / 2;
    const oy = size.height / 2 - origin.y;
    if (!particlesRef.current) particlesRef.current = initParticles(THREE_FX.BURST_COUNT, Math.random);

    const dt = Math.min(delta, 0.05);
    const next = particlesRef.current.map((p) => stepParticle(p, dt));
    particlesRef.current = next;

    next.forEach((p, i) => {
      dummy.position.set(ox + p.x, oy + p.y, 0);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.setScalar(particleScale(p));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;

    if (!doneRef.current && next.every(isDone)) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, THREE_FX.BURST_COUNT]}
      frustumCulled={false}
    />
  );
}

/** Full-viewport, click-through overlay of two-tone gelcaps that fall out of view. */
export default function GelcapBurst({ tone, onDone }: Props) {
  const [origin] = useState(readOrigin);

  // Safety net: never leave a Canvas mounted if frames stop (e.g. tab hidden mid-burst).
  useEffect(() => {
    const id = setTimeout(onDone, THREE_FX.BURST_DURATION * 1000 + 1500);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-overlay">
      <Canvas
        flat
        orthographic
        camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 1000 }}
        dpr={CANVAS_DPR}
        gl={CANVAS_GL}
        frameloop="always"
        style={{ pointerEvents: "none" }}
      >
        <FlatLights />
        <BurstScene tone={tone} origin={origin} onDone={onDone} />
      </Canvas>
    </div>
  );
}
