/**
 * Les cinq poches fixes, dans l'ordre stable d'affichage (UX_FLOWS PA v4).
 * Cet ordre départage aussi les égalités de restes lors de l'attribution des tranches.
 */

export const POCHES = ['besoins', 'epargne', 'envies', 'projets', 'imprevus'] as const;

export type PocheId = (typeof POCHES)[number];

export const LIBELLES_POCHES: Readonly<Record<PocheId, string>> = {
  besoins: 'Besoins',
  epargne: 'Épargne',
  envies: 'Envies',
  projets: 'Projets personnels',
  imprevus: 'Imprévus',
};

/** Associe une valeur à chaque poche, dans l'ordre stable. */
export type ParPoche<T> = Readonly<Record<PocheId, T>>;

export function parPoche<T>(fabrique: (poche: PocheId, index: number) => T): Record<PocheId, T> {
  const resultat = {} as Record<PocheId, T>;
  POCHES.forEach((poche, index) => {
    resultat[poche] = fabrique(poche, index);
  });
  return resultat;
}
