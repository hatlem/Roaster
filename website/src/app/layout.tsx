import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { company } from "@/content";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${company.name} - ${company.tagline}`,
    template: `%s | ${company.name}`,
  },
  description: company.description,
  keywords: ["roster", "scheduling", "norwegian", "compliance", "arbeidsmiljøloven", "AML"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
