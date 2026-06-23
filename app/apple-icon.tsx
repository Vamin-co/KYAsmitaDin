import { ImageResponse } from "next/og";
import { flagDataUrl, PAPER } from "@/lib/iconFlag";

// Apple touch / home-screen icon. iOS rounds the corners and never shows a
// transparent icon as transparent, so the tile is a solid paper square with the
// flag centered — clean on any wallpaper.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          width={180}
          height={180}
          style={{ width: "86%", height: "86%", objectFit: "contain" }}
        />
      </div>
    ),
    { ...size },
  );
}
