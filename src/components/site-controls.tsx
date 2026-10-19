"use client";

import { ColorSwitcher } from "@/components/color-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";

export function SiteControls({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <ColorSwitcher light={light} className="h-11 w-11" />
      <LanguageSwitcher light={light} />
    </div>
  );
}
