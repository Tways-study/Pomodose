import { afterEach, describe, expect, it, vi } from "vitest";

interface MockOscillator {
  type: string;
  frequency: { value: number };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function createMockAudioContext() {
  let constructCount = 0;
  const oscillators: MockOscillator[] = [];

  class MockAudioContext {
    state = "running";
    currentTime = 0;
    destination = {};

    constructor() {
      constructCount++;
    }

    createOscillator(): MockOscillator {
      const oscillator: MockOscillator = {
        type: "sine",
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(oscillator);
      return oscillator;
    }

    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
    }

    resume = vi.fn();
  }

  return { MockAudioContext, oscillators, getConstructCount: () => constructCount };
}

function setWindowAudioContext(value: typeof AudioContext | undefined) {
  (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext = value;
}

describe("chime", () => {
  const originalAudioContext = window.AudioContext;

  afterEach(() => {
    setWindowAudioContext(originalAudioContext);
    vi.resetModules();
  });

  it("does not throw when AudioContext is unsupported", async () => {
    setWindowAudioContext(undefined);
    vi.resetModules();
    const { playChime } = await import("./chime");
    expect(() => playChime()).not.toThrow();
  });

  it("reuses a single AudioContext across calls", async () => {
    const { MockAudioContext, getConstructCount } = createMockAudioContext();
    setWindowAudioContext(MockAudioContext as unknown as typeof AudioContext);
    vi.resetModules();
    const { playChime } = await import("./chime");

    playChime();
    playChime();

    expect(getConstructCount()).toBe(1);
  });

  it("plays two tones per call", async () => {
    const { MockAudioContext, oscillators } = createMockAudioContext();
    setWindowAudioContext(MockAudioContext as unknown as typeof AudioContext);
    vi.resetModules();
    const { playChime } = await import("./chime");

    playChime();

    expect(oscillators).toHaveLength(2);
    expect(oscillators[0].start).toHaveBeenCalled();
    expect(oscillators[1].start).toHaveBeenCalled();
  });
});
