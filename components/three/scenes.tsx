"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { SilentBoundary } from "@/components/silent-boundary";
import type { FlaskProps } from "./flask-3d";
import { useNearViewport, useThreeEnabled } from "./use-three-enabled";

// Every Canvas is a separate lazy chunk (ssr: false) so three never reaches a page's
// first-load JS. Each slot renders nothing under reduced motion or without WebGL2.
const LoginCapsules = dynamic(() => import("./login-capsules"), { ssr: false });
const DoseJar = dynamic(() => import("./dose-jar"), { ssr: false });
const DoseyDiorama = dynamic(() => import("./dosey-diorama"), { ssr: false });

const Flask3D = dynamic(() => import("./flask-3d"), { ssr: false });

/** Tells the owner to keep the SVG flask if the 3D scene throws after it was shown. */
function FlaskFailed({ onStatus }: { onStatus: (ready: boolean) => void }) {
  useEffect(() => {
    onStatus(false);
  }, [onStatus]);
  return null;
}

/** The 3D flask. Never calls `onStatus(true)` when disabled, so the SVG flask stays. */
export function FlaskSlot(props: FlaskProps) {
  const enabled = useThreeEnabled();
  if (!enabled) return null;
  return (
    <SilentBoundary fallback={<FlaskFailed onStatus={props.onStatus} />}>
      <Flask3D {...props} />
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
