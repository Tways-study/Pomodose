/** Signals a browser may expose about the device; all optional (Safari exposes none). */
export interface DeviceHints {
  saveData?: boolean;
  /** GB, as reported by navigator.deviceMemory (coarse: 0.25 to 8). */
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

/** True for devices where decorative WebGL is not worth its download, memory and battery. */
export function isLowEndDevice(hints: DeviceHints): boolean {
  if (hints.saveData) return true;
  if (hints.deviceMemory !== undefined && hints.deviceMemory <= 2) return true;
  if (hints.hardwareConcurrency !== undefined && hints.hardwareConcurrency <= 2) return true;
  return false;
}

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export function readDeviceHints(): DeviceHints {
  const nav = navigator as NavigatorWithHints;
  return {
    saveData: nav.connection?.saveData,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
  };
}
