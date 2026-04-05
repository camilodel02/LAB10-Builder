/** Utilidad pura: fácil de cubrir con tests unitarios. */
export function formatTitle(raw: string): string {
  const t = raw.trim();
  return t.length > 0 ? t : "LAB10";
}
