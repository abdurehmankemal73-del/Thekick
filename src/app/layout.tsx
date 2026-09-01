import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { CLUB } from "@/lib/constants";
import { getMetadataBase } from "@/lib/site-url";
import "./globals.css";

const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const oswald = localFont({
  src: "../fonts/oswald-latin.woff2",
  variable: "--font-oswald",
  display: "swap",
  weight: "200 700",
});

const notoEthiopic = localFont({
  src: [
    { path: "../fonts/noto-ethiopic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-ethiopic-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/noto-ethiopic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ethiopic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: `${CLUB.shortName} | ${CLUB.fullName}`,
    template: `%s | ${CLUB.shortName}`,
  },
  description: `${CLUB.fullName} — ${CLUB.federation}. Discipline, strength, respect.`,
  openGraph: {
    title: `${CLUB.shortName} | ${CLUB.fullName}`,
    description: `${CLUB.federation} club management and training.`,
    type: "website",
    images: [{ url: "/logo.jpg", width: 512, height: 512, alt: CLUB.fullName }],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${oswald.variable} ${notoEthiopic.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("the-kick-theme");if(t==="classic"||t==="mint")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full bg-surface text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
