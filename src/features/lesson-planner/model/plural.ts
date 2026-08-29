// Polish plural selection for the rodzaj niemęskoosobowy count pattern used
// across the planner's copy: n === 1 takes the singular; a last digit of
// 2–4 (but not 12–14) takes the paucal ("few"); everything else takes the
// genitive plural ("many"). Pure — no DOM, no React.

export interface PluralForms {
  /** n === 1 — „1 minuta" */
  one: string
  /** n ending in 2–4, excluding 12–14 — „3 minuty", „22 minuty" */
  few: string
  /** everything else — „5 minut", „12 minut" */
  many: string
}

/** True for counts that take the paucal form: 2–4, 22–24… but not 12–14. */
export function isPaucal(n: number): boolean {
  const abs = Math.abs(Math.trunc(n))
  const units = abs % 10
  const tens = abs % 100
  return units >= 2 && units <= 4 && (tens < 12 || tens > 14)
}

export function plural(n: number, forms: PluralForms): string {
  if (Math.abs(Math.trunc(n)) === 1) return forms.one
  return isPaucal(n) ? forms.few : forms.many
}

/** `${n} <noun>` with the noun agreeing with n. */
export function pluralize(n: number, forms: PluralForms): string {
  return `${n} ${plural(n, forms)}`
}

/** Nominative: „1 minuta / 3 minuty / 5 minut". */
export const minutesNom = (n: number): string =>
  plural(n, { one: "minuta", few: "minuty", many: "minut" })

/** Accusative, after „o": „o 1 minutę / o 3 minuty / o 5 minut". */
export const minutesAcc = (n: number): string =>
  plural(n, { one: "minutę", few: "minuty", many: "minut" })

/** „1 blok / 2 bloki / 5 bloków". */
export const blocksNom = (n: number): string =>
  plural(n, { one: "blok", few: "bloki", many: "bloków" })

/** „1 materiał / 2 materiały / 5 materiałów". */
export const materialsNom = (n: number): string =>
  plural(n, { one: "materiał", few: "materiały", many: "materiałów" })

/** „1 zadanie / 2 zadania / 5 zadań". */
export const tasksNom = (n: number): string =>
  plural(n, { one: "zadanie", few: "zadania", many: "zadań" })

/** „o 1 minutę / o 3 minuty / o 6 minut" (biernik) — count included. */
export const formatMinutes = (n: number): string => `${n} ${minutesAcc(n)}`

/** „1 blok / 2 bloki / 5 bloków" — count included. */
export const formatBlocks = (n: number): string => `${n} ${blocksNom(n)}`

/** „1 materiał / 2 materiały / 5 materiałów" — count included. */
export const formatMaterials = (n: number): string => `${n} ${materialsNom(n)}`
