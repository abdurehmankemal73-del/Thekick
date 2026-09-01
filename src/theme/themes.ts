export const THEMES = ["classic", "mint"] as const;
export type ThemeId = (typeof THEMES)[number];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && (THEMES as readonly string[]).includes(value);
}
