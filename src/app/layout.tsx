import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Oswald, Noto_Sans_Ethiopic } from "next/font/google";
import { Providers } from "@/components/providers";
import { CLUB } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "600", "700"],
  variable: "--font-ethiopic",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
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
