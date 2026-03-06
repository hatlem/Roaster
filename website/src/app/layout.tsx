import type { Metadata } from "next";
import { Agentation } from "agentation";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: {
      default: `Roaster - ${dict.content.companyTagline}`,
      template: '%s | Roaster',
    },
    description: dict.metadata.description,
    keywords: [dict.nav.features, dict.nav.pricing, dict.nav.industries],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Roaster" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

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
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === "development" && <Agentation endpoint="http://localhost:4747" />}
      </body>
    </html>
  );
}
