// Polish plural helpers for the plan screen's copy.

export function pluralPl(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** „o 1 minutę / o 3 minuty / o 6 minut" (biernik). */
export function formatMinutes(n: number): string {
  return `${n} ${pluralPl(n, "minutę", "minuty", "minut")}`
}

/** „1 blok / 2 bloki / 5 bloków". */
export function formatBlocks(n: number): string {
  return `${n} ${pluralPl(n, "blok", "bloki", "bloków")}`
}

/** „1 materiał / 2 materiały / 5 materiałów". */
export function formatMaterials(n: number): string {
  return `${n} ${pluralPl(n, "materiał", "materiały", "materiałów")}`
}
