import localFont from "next/font/local";

export const dmSans = localFont({
  src: [
    { path: "./dm-sans-italic-100-1000-33e31135.woff2", weight: "100 1000", style: "italic" },
    { path: "./dm-sans-normal-100-1000-358ec78c.woff2", weight: "100 1000", style: "normal" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

export const instrumentSerif = localFont({
  src: [
    { path: "./instrument-serif-italic-400-e52bb2fb.woff2", weight: "400", style: "italic" },
    { path: "./instrument-serif-normal-400-0eb17cc4.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
