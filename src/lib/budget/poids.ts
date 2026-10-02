/**
 * Lecture des pourcentages des poches : points entiers de 0 à 100 (décision de Kelly).
 * Aucune normalisation : le total doit valoir exactement 100, sinon c'est une erreur.
 */

import { POCHES, type ParPoche } from './poches';

export const TOTAL_POIDS = 100;

export type CodeErreurPoids = 'vide' | 'format' | 'negatif' | 'non_entier' | 'max';

export type LecturePoids =
  | { readonly ok: true; readonly points: number }
  | { readonly ok: false; readonly erreur: CodeErreurPoids };

export function lirePoids(saisie: string): LecturePoids {
  let texte = saisie.trim();
  if (texte === '') return { ok: false, erreur: 'vide' };
  if (texte.endsWith('%')) texte = texte.slice(0, -1).trim();

  const negatif = /^[-−–]/.test(texte);
  const corps = negatif ? texte.slice(1).trim() : texte;
  const entier = /^\d+$/.test(corps);
  const decimal = /^\d+[,.]\d+$/.test(corps);
  if (!entier && !decimal) return { ok: false, erreur: 'format' };
  if (negatif) return { ok: false, erreur: 'negatif' };
  if (decimal) return { ok: false, erreur: 'non_entier' };

  const significatif = corps.replace(/^0+(?=\d)/, '');
  if (significatif.length > 3) return { ok: false, erreur: 'max' };
  const points = Number(significatif);
  if (points > TOTAL_POIDS) return { ok: false, erreur: 'max' };
  return { ok: true, points };
}

export type EtatTotal =
  /** Tous les pourcentages sont lisibles : total et écart à 100 (positif = en trop). */
  | { readonly lisible: true; readonly total: number; readonly ecart: number }
  /** Au moins un pourcentage est vide ou invalide : pas de total affichable. */
  | { readonly lisible: false };

/** Total courant des pourcentages saisis, sans aucune correction. */
export function totalPoids(saisies: ParPoche<string>): EtatTotal {
  let total = 0;
  for (const poche of POCHES) {
    const lecture = lirePoids(saisies[poche]);
    if (!lecture.ok) return { lisible: false };
    total += lecture.points;
  }
  return { lisible: true, total, ecart: total - TOTAL_POIDS };
}
