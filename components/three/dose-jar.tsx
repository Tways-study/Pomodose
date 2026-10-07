"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, invalidate, useFrame } from "@react-three/fiber";
import { Object3D, type Group, type InstancedMesh, type Mesh } from "three";
import { THREE_FX } from "@/lib/three/fx";
import { JAR, completesCycle, dropOffset, jarSlots, jarWobble, lidLift, lidPop } from "@/lib/three/jar";
import { PALETTE } from "@/lib/three/palette";
import { makeGelcapGeometry, makeToonMaterial } from "@/lib/three/toon";
import { CANVAS_DPR, CANVAS_GL, FlatLights, useToonGradient } from "./scene-kit";

interface Props {
  dailyDoses: number;
  /** Animate the (only) capsule in on mount; used when the jar first appears at one dose. */
  dropOnMount?: boolean;
}

interface Anim {
  start: number;       // seconds, performance.now() based
  index: number;       // slot of the capsule that drops in
  dropping: boolean;   // false when the count is past the visible maximum
  cycle: boolean;      // follow the drop with a wobble and lid pop
}

const now = () => performance.now() / 1000;
const LID_REST_Y = JAR.HEIGHT / 2 + 0.17;

function JarScene({ dailyDoses, dropOnMount }: Props) {
  const capsulesRef = useRef<InstancedMesh>(null);
  const groupRef = useRef<Group>(null);
  const lidRef = useRef<Mesh>(null);
  const animRef = useRef<Anim | null>(null);
  const prevRef = useRef(dropOnMount ? dailyDoses - 1 : dailyDoses);
  const dummy = useMemo(() => new Object3D(), []);
  const slots = useMemo(() => jarSlots(THREE_FX.JAR_MAX_VISIBLE), []);
  const gradient = useToonGradient();

  const capsuleGeometry = useMemo(
    () => makeGelcapGeometry(JAR.CAPSULE_RADIUS, JAR.CAPSULE_LENGTH, "sky"),
    [],
  );
  const capsuleMaterial = useMemo(() => makeToonMaterial(gradient, { vertexColors: true }), [gradient]);
  const glassMaterial = useMemo(
    () => makeToonMaterial(gradient, { color: PALETTE.lilac, opacity: 0.35 }),
    [gradient],
  );
  const baseMaterial = useMemo(() => makeToonMaterial(gradient, { color: PALETTE.lilac, opacity: 0.7 }), [gradient]);
  const lidMaterial = useMemo(() => makeToonMaterial(gradient, { color: PALETTE.butter }), [gradient]);
  useEffect(() => () => capsuleGeometry.dispose(), [capsuleGeometry]);
  useEffect(
    () => () => {
      capsuleMaterial.dispose();
      glassMaterial.dispose();
      baseMaterial.dispose();
      lidMaterial.dispose();
    },
    [capsuleMaterial, glassMaterial, baseMaterial, lidMaterial],
  );

  // A new dose animates only the new capsule; the rest sit still.
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = dailyDoses;
    if (dailyDoses === prev + 1) {
      animRef.current = {
        start: now(),
        index: dailyDoses - 1,
        dropping: dailyDoses <= THREE_FX.JAR_MAX_VISIBLE,
        cycle: completesCycle(dailyDoses),
      };
    }
    invalidate();
  }, [dailyDoses]);

  useFrame(() => {
    const mesh = capsulesRef.current;
    if (!mesh) return;
    const t = now();
    const a = animRef.current;
    let dropIndex = -1;
    let offset = 0;
    let lid = 0;
    let wobble = 0;

    if (a) {
      const td = (t - a.start) / THREE_FX.JAR_DROP_SECONDS;
      const popStart = a.start + THREE_FX.JAR_DROP_SECONDS;
      const tp = (t - popStart) / THREE_FX.JAR_POP_SECONDS;
      if (td < 1) {
        if (a.dropping) {
          dropIndex = a.index;
          offset = dropOffset(td);
        }
        lid += lidLift(td);
      }
      if (a.cycle && tp >= 0 && tp < 1) {
        lid += lidPop(tp);
        wobble = jarWobble(tp);
      }
      const end = a.cycle ? popStart + THREE_FX.JAR_POP_SECONDS : popStart;
      if (t >= end) animRef.current = null;
    }

    const shown = Math.min(dailyDoses, THREE_FX.JAR_MAX_VISIBLE);
    mesh.count = shown;
    for (let i = 0; i < shown; i++) {
      const s = slots[i];
      const falling = i === dropIndex;
      dummy.position.set(s.x, s.y + (falling ? offset * THREE_FX.JAR_DROP_HEIGHT : 0), s.z);
      dummy.rotation.set(s.rx, s.ry + (falling ? offset * Math.PI : 0), s.rz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (lidRef.current) lidRef.current.position.y = LID_REST_Y + lid;
    if (groupRef.current) groupRef.current.rotation.z = wobble;

    // Keep frames coming only while something is moving.
    if (animRef.current) invalidate();
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh material={glassMaterial}>
        <cylinderGeometry args={[JAR.RADIUS, JAR.RADIUS, JAR.HEIGHT, 28, 1, true]} />
      </mesh>
      <mesh position={[0, -JAR.HEIGHT / 2 - 0.05, 0]} material={baseMaterial}>
        <cylinderGeometry args={[JAR.RADIUS, JAR.RADIUS, 0.1, 28]} />
      </mesh>
      <mesh ref={lidRef} position={[0, LID_REST_Y, 0]} material={lidMaterial}>
        <cylinderGeometry args={[JAR.RADIUS + 0.07, JAR.RADIUS + 0.07, 0.34, 28]} />
      </mesh>
      <instancedMesh
        ref={capsulesRef}
        args={[capsuleGeometry, capsuleMaterial, THREE_FX.JAR_MAX_VISIBLE]}
        frustumCulled={false}
      />
    </group>
  );
}

/** A small flat-toon jar that fills with sky gelcaps, one per dose today. */
export default function DoseJar({ dailyDoses, dropOnMount }: Props) {
  return (
    <div aria-hidden="true" className="pointer-events-none h-[140px] w-[120px] shrink-0">
      <Canvas
        flat
        camera={{ position: [0, 0.3, 9], fov: 34 }}
        dpr={CANVAS_DPR}
        gl={CANVAS_GL}
        frameloop="demand"
        style={{ pointerEvents: "none" }}
      >
        <FlatLights />
        <JarScene dailyDoses={dailyDoses} dropOnMount={dropOnMount} />
      </Canvas>
    </div>
  );
}
