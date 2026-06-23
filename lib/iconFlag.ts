import { readFileSync } from "node:fs";
import { join } from "node:path";

// The nishan dhaja (app/_assets/nishan-flag.png), cropped from the source icon and
// padded into a transparent square with light margin. The image itself stays
// transparent; each icon route applies the paper background in config, so the flag
// sits cleanly on any surface (browser tab, iOS home screen, PWA tile).
//
// Read once at module load (build time) and embedded as a data URL because the OG
// ImageResponse renderer cannot resolve a bare filesystem path.
const flag = readFileSync(join(process.cwd(), "app/_assets/nishan-flag.png"));

export const flagDataUrl = `data:image/png;base64,${flag.toString("base64")}`;

// Paper background from content.md — kept here so every icon surface matches.
export const PAPER = "#faf7f2";
