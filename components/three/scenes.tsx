"use client";

import dynamic from "next/dynamic";
import { SilentBoundary } from "@/components/silent-boundary";
import { useThreeEnabled } from "./use-three-enabled";

// Every Canvas is a separate lazy chunk (ssr: false) so three never reaches a page's
// first-load JS. Each slot renders nothing under reduced motion or without WebGL2.
const LoginCapsules = dynamic(() => import("./login-capsules"), { ssr: false });
const DoseJar = dynamic(() => import("./dose-jar"), { ssr: false });
const DoseyDiorama = dynamic(() => import("./dosey-diorama"), { ssr: false });

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

export function DoseyDioramaSlot() {
  const enabled = useThreeEnabled();
  if (!enabled) return null;
  return (
    <SilentBoundary fallback={null}>
      <DoseyDiorama />
    </SilentBoundary>
  );
}
