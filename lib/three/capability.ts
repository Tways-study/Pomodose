/** Signals a browser may expose about the device; all optional. */
export interface DeviceHints {
  saveData?: boolean;
}

/**
 * True when the user asked the browser to save data. That is the only signal used on
 * purpose: `navigator.hardwareConcurrency` and `navigator.deviceMemory` are randomised
 * ("farbled") by privacy browsers such as Brave, so gating on them made the 3D scenes
 * appear on some loads and not others on a perfectly capable machine.
 */
export function isLowEndDevice(hints: DeviceHints): boolean {
  return hints.saveData === true;
}

interface NavigatorWithHints extends Navigator {
  connection?: { saveData?: boolean };
}

export function readDeviceHints(): DeviceHints {
  const nav = navigator as NavigatorWithHints;
  return { saveData: nav.connection?.saveData };
}
