const MIN = 100000;
const RANGE = 900000; // 100000..999999 inclusive
const MAX_UINT32 = 0xffffffff;
// Reject draws that would bias the modulo toward the low end of the range.
const REJECTION_LIMIT = MAX_UINT32 - (MAX_UINT32 % RANGE);

// Verification/reset codes are security tokens, not general-purpose random
// values — Math.random() is not a CSPRNG and must not back them. Web
// Crypto's getRandomValues() is available in Convex's default (non-Node)
// action runtime, the same runtime @convex-dev/auth's own token generator
// uses internally.
export function generateOtpCode(): string {
  const buffer = new Uint32Array(1);
  let draw: number;
  do {
    crypto.getRandomValues(buffer);
    draw = buffer[0];
  } while (draw >= REJECTION_LIMIT);
  return (MIN + (draw % RANGE)).toString();
}
