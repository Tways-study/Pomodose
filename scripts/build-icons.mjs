// Regenerates the app icons from scripts/icon-source.svg:
//   app/icon.png        512x512 rounded tile
//   app/apple-icon.png  180x180 full-bleed square (iOS rounds it itself)
//   app/favicon.ico     16/32/48 PNGs in an ICO container
//   app/opengraph-image.png + app/twitter-image.png   1200x630 link-preview card (scripts/og-source.svg)
// Run: node scripts/build-icons.mjs
// Uses `sharp`, which ships with Next.js as a transitive dependency, so nothing
// is added to package.json. The ICO container is written by hand (PNG-in-ICO).
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = await readFile(path.join(root, "scripts/icon-source.svg"), "utf8");

const rounded = Buffer.from(template.replaceAll("__TILE_RX__", "112"));
const square = Buffer.from(template.replaceAll("__TILE_RX__", "0"));

const png = (svg, size) => sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

await writeFile(path.join(root, "app/icon.png"), await png(rounded, 512));
await writeFile(path.join(root, "app/apple-icon.png"), await png(square, 180));

// ICO: 6-byte header, one 16-byte directory entry per image, then the PNG blobs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(rounded, s)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = images.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0); // width
  e.writeUInt8(sizes[i], 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.length;
  return e;
});
await writeFile(path.join(root, "app/favicon.ico"), Buffer.concat([header, ...entries, ...images]));

// Link-preview card (same art as the icon, wider canvas).
const og = await readFile(path.join(root, "scripts/og-source.svg"));
const ogPng = await sharp(og, { density: 144 }).resize(1200, 630).png({ compressionLevel: 9 }).toBuffer();
await writeFile(path.join(root, "app/opengraph-image.png"), ogPng);
await writeFile(path.join(root, "app/twitter-image.png"), ogPng);

console.log("wrote app/icon.png, app/apple-icon.png, app/favicon.ico, app/opengraph-image.png, app/twitter-image.png");
