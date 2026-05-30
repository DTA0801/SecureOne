import { buildThemeInitScript } from "@/lib/theme/prefs";

/** Applies saved theme from localStorage before React hydrates (avoids flash + wrong mode). */
export function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: buildThemeInitScript() }} />;
}
