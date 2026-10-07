"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { SilentBoundary } from "@/components/silent-boundary";
import type { VesselProps } from "./vessel-3d";
import { useNearViewport, useThreeEnabled } from "./use-three-enabled";

// Every Canvas is a separate lazy chunk (ssr: false) so three never reaches a page's
// first-load JS. Each slot renders nothing under reduced motion or without WebGL2.
const LoginCapsules = dynamic(() => import("./login-capsules"), { ssr: false });
const DoseJar = dynamic(() => import("./dose-jar"), { ssr: false });
const DoseyDiorama = dynamic(() => import("./dosey-diorama"), { ssr: false });

const Vessel3D = dynamic(() => import("./vessel-3d"), { ssr: false });

/** Tells the owner to keep the SVG vessel if the 3D scene throws after it was shown. */
function VesselFailed({ onStatus }: { onStatus: (ready: boolean) => void }) {
  useEffect(() => {
    onStatus(false);
  }, [onStatus]);
  return null;
}

/** The 3D vessel. Never calls `onStatus(true)` when disabled, so the SVG vessel stays. */
export function VesselSlot(props: VesselProps) {
  const enabled = useThreeEnabled();
  if (!enabled) return null;
  return (
    <SilentBoundary fallback={<VesselFailed onStatus={props.onStatus} />}>
      <Vessel3D key={props.vessel} {...props} />
    </SilentBoundary>
  );
}

export function LoginCapsulesSlot() {
  const enabled = useThreeEnabled();
  if (!enabled) return null;
  return (
    <SilentBoundary fallback={null}>
      <LoginCapsules />
    </SilentBoundary>
  );
}

export function DoseJarSlot({ dailyDoses }: { dailyDoses: number }) {
  const enabled = useThreeEnabled();
  if (!enabled || dailyDoses <= 0) return null;
  return (
    <SilentBoundary fallback={null}>
      <DoseJar dailyDoses={dailyDoses} dropOnMount={dailyDoses === 1} />
    </SilentBoundary>
  );
}

/** Mounts the diorama (and its WebGL context) only once it is near the viewport. */
export function DoseyDioramaSlot() {
  const enabled = useThreeEnabled();
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref, enabled);
  if (!enabled) return null;
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {near && (
        <SilentBoundary fallback={null}>
          <DoseyDiorama />
        </SilentBoundary>
      )}
    </div>
  );
}
