import {
  CapsuleGeometry,
  Color,
  DataTexture,
  Float32BufferAttribute,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  type BufferGeometry,
} from "three";
import { PALETTE, type Tone } from "./palette";

/** A 3-step ramp with nearest filtering: flat, banded "gumdrop" shading with no gloss. */
export function makeToonGradient(): DataTexture {
  const texture = new DataTexture(new Uint8Array([175, 225, 255]), 3, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

interface ToonOptions {
  color?: string;
  vertexColors?: boolean;
  opacity?: number;
}

export function makeToonMaterial(gradient: DataTexture, options: ToonOptions = {}): MeshToonMaterial {
  const { color = "white", vertexColors = false, opacity = 1 } = options;
  return new MeshToonMaterial({
    color,
    gradientMap: gradient,
    vertexColors,
    transparent: opacity < 1,
    opacity,
  });
}

/**
 * A two-tone gelcap: a capsule along Y whose upper half is `tone` and lower half is cream.
 * Colors are written per triangle (non-indexed) so the split at y=0 is a hard edge.
 */
export function makeGelcapGeometry(radius: number, length: number, tone: Tone): BufferGeometry {
  const indexed = new CapsuleGeometry(radius, length, 4, 12, 2);
  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  const position = geometry.getAttribute("position");
  const upper = new Color(PALETTE[tone]);
  const lower = new Color(PALETTE.cream);
  const colors: number[] = [];
  for (let tri = 0; tri < position.count; tri += 3) {
    const centroidY = (position.getY(tri) + position.getY(tri + 1) + position.getY(tri + 2)) / 3;
    const c = centroidY > 0 ? upper : lower;
    for (let v = 0; v < 3; v++) colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}
