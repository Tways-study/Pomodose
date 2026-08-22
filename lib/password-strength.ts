export type PasswordStrengthLevel = "weak" | "fair" | "good" | "strong";

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  /** 0–4, how many of the meter's segments should fill. */
  score: number;
  /** Themed label shown next to the meter; empty string for an empty password. */
  label: string;
}

const STRENGTH_LABEL: Record<PasswordStrengthLevel, string> = {
  weak: "Under-dosed",
  fair: "Light dose",
  good: "Well measured",
  strong: "Full strength",
};

// Keyboard rows and alphabet/digit runs long enough to be a lazy password
// ("abcdefgh", "12345678", "qwertyui") rather than a real one. Checked both
// forward and reversed.
const SEQUENTIAL_RUNS = [
  "0123456789",
  "abcdefghijklmnopqrstuvwxyz",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];
const SEQUENTIAL_RUN_LENGTH = 4;

function hasLongSequentialRun(lower: string): boolean {
  for (const seq of SEQUENTIAL_RUNS) {
    for (let i = 0; i <= seq.length - SEQUENTIAL_RUN_LENGTH; i++) {
      const forward = seq.slice(i, i + SEQUENTIAL_RUN_LENGTH);
      const backward = [...forward].reverse().join("");
      if (lower.includes(forward) || lower.includes(backward)) return true;
    }
  }
  return false;
}

function levelForScore(score: number): PasswordStrengthLevel {
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3) return "good";
  return "strong";
}

/**
 * Dependency-free password strength heuristic, scoped to this app's threat
 * model (a personal single-user gift app, not an enterprise auth system):
 * length and character variety, with a penalty that catches the two most
 * common "technically long enough" weak passwords — a repeated character and
 * a keyboard/alphabet run. Pure and deterministic, so it unit-tests cleanly.
 */
export function assessPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { level: "weak", score: 0, label: "" };

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const varietyCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (varietyCount >= 3) score += 1;

  const lower = password.toLowerCase();
  const isRepeatedChar = /^(.)\1*$/.test(password);
  if (isRepeatedChar || hasLongSequentialRun(lower)) {
    score = Math.min(score, 1);
  }

  const level = levelForScore(score);
  return { level, score, label: STRENGTH_LABEL[level] };
}
