import { ImageResponse } from "next/og";

/**
 * The link preview card, for when someone shares the instance.
 *
 * Generated rather than committed so it cannot drift from the app's own name and
 * tagline. Satori lays the text out with the font Next bundles for
 * `ImageResponse`, which is why no font is loaded here.
 */

export const alt = "Evermind — never miss a deadline again";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TEAL = "#0d9488";
const INK = "#12222b";

export default function OpengraphImage() {
  const bar = (left: number, top: number, width: number, height: number) => ({
    position: "absolute" as const,
    left,
    top,
    width,
    height,
    borderRadius: 6,
    background: "#ffffff",
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        background: "#f7f9f9",
      }}
    >
      <div
        style={{ position: "relative", width: 132, height: 132, borderRadius: 29, background: TEAL, display: "flex" }}
      >
        <div style={bar(41, 33, 13, 66)} />
        <div style={bar(41, 33, 50, 13)} />
        <div style={bar(41, 59, 37, 13)} />
        <div style={bar(41, 86, 50, 13)} />
      </div>

      <div style={{ display: "flex", fontSize: 92, fontWeight: 700, color: INK, marginTop: 48, letterSpacing: -2 }}>
        Evermind
      </div>
      <div style={{ display: "flex", fontSize: 40, color: "#4c6068", marginTop: 12 }}>Never miss a deadline again.</div>
      <div style={{ display: "flex", fontSize: 28, color: "#7c8f96", marginTop: 40 }}>
        An assignment tracker for students.
      </div>
    </div>,
    size,
  );
}
