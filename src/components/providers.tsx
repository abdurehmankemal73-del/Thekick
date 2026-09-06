"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { Pwa } from "@/components/pwa";
import { LanguageProvider } from "@/i18n/provider";
import { ThemeProvider } from "@/theme/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          {children}
          <Pwa />
          <Toaster richColors position="top-right" />
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
