import { ImageResponse } from "next/og";

/**
 * The 180×180 touch icon, generated at build time rather than committed as a
 * binary — so the mark lives in one place (`app/icon.svg`) and this stays in
 * step with it by construction.
 *
 * No rounded corners: iOS applies its own mask, and a radius here would be
 * clipped twice and read as a visible inset.
 *
 * Drawn from rectangles for the same reason the SVG is. Satori needs a font
 * loaded before it will lay out text, and there is no text here to need one.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const TEAL = "#0d9488";

export default function AppleIcon() {
  const bar = (left: number, top: number, width: number, height: number) => ({
    position: "absolute" as const,
    left,
    top,
    width,
    height,
    borderRadius: 7,
    background: "#ffffff",
  });

  return new ImageResponse(
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", background: TEAL }}>
      <div style={bar(56, 45, 18, 90)} />
      <div style={bar(56, 45, 68, 18)} />
      <div style={bar(56, 81, 51, 18)} />
      <div style={bar(56, 117, 68, 18)} />
    </div>,
    size,
  );
}
