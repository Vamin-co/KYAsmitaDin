// Preprocess the flow-map SVGs for the app:
//  1) Recompress the embedded floor-plan raster (huge PNG) to a downsized WebP.
//  2) Tag the wing-colored flow elements so the app can show only the delegate's wing.
//  3) Tag the stroked arrows + markers so the app can animate the route draw-on.
//  4) Mask the baked-in two-row legend (the app renders its own single-wing legend).
//  5) Strip the fixed width/height so the SVG scales responsively.
//
// Output: public/flowmaps/<key>.svg  (bound by ky_schedule.json flow_maps, not filename).
//
//   node scripts/optimize-flowmaps.mjs

import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "flowmaps");

// source filename -> output key (Round 5 intentionally dropped: no movement, no map)
const MAP = [
  { src: "Asmita Talks - Round 1.svg", out: "talks_round_1_214" }, // dest Room 214 (Track A)
  { src: "Asmita Talks - Round 1.5.svg", out: "talks_round_1_212" }, // dest Room 212 (Track B)
  { src: "Asmita Talks - Round 2 - 4.svg", out: "talks_round_2_4" },
  { src: "Program 1 Exit Flow.svg", out: "program2_to_lunch" }, // Program 2 -> Lunch
];

const BLUE = "067BC2"; // eSide
const RED = "D56062"; // iSide

function imageDisplayWidths(svg) {
  // pattern id -> image id
  const p2i = {};
  const patRe = /<pattern id="([^"]+)"[^>]*>\s*<use[^>]*xlink:href="#([^"]+)"/g;
  let m;
  while ((m = patRe.exec(svg))) p2i[m[1]] = m[2];

  // image id -> display width (from the rect that paints with its pattern)
  const i2w = {};
  const rectRe = /<rect\b([^>]*)\bfill="url\(#([^)]+)\)"([^>]*)>/g;
  while ((m = rectRe.exec(svg))) {
    const attrs = m[1] + m[3];
    const wMatch = attrs.match(/\bwidth="(\d+(?:\.\d+)?)"/);
    const pat = m[2];
    const img = p2i[pat];
    if (img && wMatch) i2w[img] = Math.max(i2w[img] ?? 0, Math.round(Number(wMatch[1])));
  }
  return i2w;
}

async function recompressImages(svg) {
  const widths = imageDisplayWidths(svg);
  const imgRe =
    /<image\b([^>]*?)xlink:href="data:image\/png;base64,([A-Za-z0-9+/=]+)"([^>]*?)\/>/g;
  const matches = [...svg.matchAll(imgRe)];
  let result = svg;
  let savedBytes = 0;

  for (const match of matches) {
    const [full, pre, b64, post] = match;
    const idMatch = (pre + post).match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : "";
    const nativeWMatch = (pre + post).match(/\bwidth="(\d+)"/);
    const nativeW = nativeWMatch ? Number(nativeWMatch[1]) : 4096;

    const displayW = widths[id] ?? 1400;
    // 2x display for crispness, clamped, never upscaling past native.
    const targetW = Math.min(nativeW, Math.max(320, Math.min(1600, Math.round(displayW * 2))));

    const inputBuf = Buffer.from(b64, "base64");
    const webp = await sharp(inputBuf)
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality: 76, effort: 5 })
      .toBuffer();
    savedBytes += inputBuf.length - webp.length;

    const newImg = `<image${pre}xlink:href="data:image/webp;base64,${webp.toString(
      "base64",
    )}"${post}/>`;
    result = result.replace(full, newImg);
  }
  return { svg: result, savedBytes };
}

function tagWing(svg, hex, wing) {
  // Tag any vector element painted with this wing color.
  const tagRe = new RegExp(
    `<(path|line|polyline|polygon|circle|rect|ellipse)\\b([^>]*#${hex}[^>]*?)(/?)>`,
    "gi",
  );
  return svg.replace(tagRe, (full, tag, attrs, slash) => {
    const isArrow = new RegExp(`stroke="#${hex}"`, "i").test(attrs);
    const cls = isArrow ? `flow-el wing-${wing} flow-arrow` : `flow-el wing-${wing} flow-marker`;
    const dataAttr = isArrow
      ? ` data-flow-arrow data-wing="${wing}"`
      : ` data-flow-marker data-wing="${wing}"`;
    return `<${tag} class="${cls}"${dataAttr}${attrs}${slash}>`;
  });
}

function processOne(src, out) {
  const raw = readFileSync(join(ROOT, src), "utf8");
  const rawSize = Buffer.byteLength(raw);
  return recompressImages(raw).then(({ svg, savedBytes }) => {
    // tag wings
    svg = tagWing(svg, BLUE, "e");
    svg = tagWing(svg, RED, "i");

    // strip fixed dimensions so it scales to container (keep viewBox)
    svg = svg.replace(/<svg\b([^>]*)>/, (full, attrs) => {
      const cleaned = attrs.replace(/\swidth="\d+"/, "").replace(/\sheight="\d+"/, "");
      return `<svg${cleaned} class="flowmap-svg" preserveAspectRatio="xMidYMid meet">`;
    });

    // mask the baked-in two-row legend (top-left). The app draws its own single-wing legend.
    const mask = `<rect class="legend-mask" x="95" y="58" width="780" height="116" fill="#F9F7F1"/>`;
    svg = svg.replace(/<\/svg>\s*$/, `${mask}</svg>`);

    mkdirSync(OUT, { recursive: true });
    const outPath = join(OUT, `${out}.svg`);
    writeFileSync(outPath, svg);
    const newSize = statSync(outPath).size;
    console.log(
      `${src}\n  -> public/flowmaps/${out}.svg  ${(rawSize / 1024).toFixed(0)}KB -> ${(
        newSize / 1024
      ).toFixed(0)}KB`,
    );
  });
}

for (const { src, out } of MAP) {
  await processOne(src, out);
}
console.log("flow maps optimized.");
