const STORAGE_KEY = "pomodose:remembered-email";

/**
 * The email remembered for this device, or null when none is stored or storage is
 * unavailable (private windows can throw). Only ever the email — never a password
 * or token; browser password managers handle those.
 */
export function readRememberedEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(STORAGE_KEY)?.trim();
    return value ? value : null;
  } catch (error) {
    console.warn("Pomodose: could not read the remembered email", error);
    return null;
  }
}

export function saveRememberedEmail(email: string): void {
  if (typeof window === "undefined") return;
  const value = email.trim();
  if (!value) return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    console.warn("Pomodose: could not save the remembered email", error);
  }
}

export function clearRememberedEmail(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Pomodose: could not clear the remembered email", error);
  }
}
