// Thin wrapper around the browser Notification API, SSR-guarded the same
// way lib/chime.ts and lib/document-title.ts are. The opt-in flag persists
// in localStorage so the footer toggle (components/os-notification-toggle.tsx)
// reflects the user's choice across reloads.

const OPT_IN_KEY = "pomodose:os-notifications";

export function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function isEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(OPT_IN_KEY) === "1" && getPermission() === "granted";
}

export function setEnabled(enabled: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(OPT_IN_KEY, enabled ? "1" : "0");
}

export function getPermission(): NotificationPermission {
  if (!isSupported()) return "denied";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isSupported()) return "denied";
  const permission = await Notification.requestPermission();
  return permission;
}

/** Fires a native OS notification. Caller is responsible for checking isEnabled(). */
export function showNotification(title: string, body: string): void {
  if (!isSupported() || getPermission() !== "granted") return;
  void new Notification(title, { body });
}
