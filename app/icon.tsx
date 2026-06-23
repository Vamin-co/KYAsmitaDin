import { ImageResponse } from "next/og";
import { flagDataUrl, PAPER } from "@/lib/iconFlag";

// Favicon + PWA raster icons, generated from the single transparent flag source.
// The paper background is applied here (in the icon config), not baked into the
// source. The 192/512 entries double as the web manifest's PWA icons.
export const contentType = "image/png";

const SIZES = [16, 32, 48, 192, 512] as const;

export function generateImageMetadata() {
  return SIZES.map((s) => ({
    id: String(s),
    size: { width: s, height: s },
    contentType: "image/png",
  }));
}

export default function Icon({ id }: { id: string }) {
  const s = Number(id);
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: PAPER,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagDataUrl}
          alt=""
          width={s}
          height={s}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    ),
    { width: s, height: s },
  );
}
