let cached: boolean | null = null;

/** True when a WebGL2 context can be created. Checked once per page, client only. */
export function hasWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  if (cached === null) {
    try {
      cached = !!document.createElement("canvas").getContext("webgl2");
    } catch (error) {
      console.warn("Pomodose: WebGL2 check failed, skipping 3D scenes", error);
      cached = false;
    }
  }
  return cached;
}
