/**
 * Validation de la saisie brute (chaînes) vers une entrée de calcul typée.
 * Les erreurs sont rattachées à leur champ ; rien n'est corrigé ni normalisé.
 */

import type { EntreeBudget, ModeBudget } from './calcul';
import { lireMontant, type CodeErreurMontant } from './montant';
import { lirePoids, totalPoids, type CodeErreurPoids } from './poids';
import { POCHES, parPoche, type ParPoche, type PocheId } from './poches';

export interface SaisieBudget {
  readonly revenus: string;
  readonly mode: ModeBudget;
  readonly enveloppe: string;
  readonly charges: string;
  readonly poids: ParPoche<string>;
}

export type ChampMontant = 'revenus' | 'enveloppe' | 'charges';

export interface ErreurTotal {
  readonly code: 'total';
  readonly total: number;
  /** total − 100 : positif si trop, négatif s'il manque des points. */
  readonly ecart: number;
}

export interface ErreursSaisie {
  readonly montants: Partial<Record<ChampMontant, CodeErreurMontant>>;
  readonly poids: Partial<Record<PocheId, CodeErreurPoids>>;
  /** Présente seulement si les cinq pourcentages sont lisibles mais ne totalisent pas 100. */
  readonly total: ErreurTotal | null;
}

export type Validation =
  | { readonly ok: true; readonly entree: EntreeBudget }
  | { readonly ok: false; readonly erreurs: ErreursSaisie };

export function validerSaisie(saisie: SaisieBudget): Validation {
  const montants: Partial<Record<ChampMontant, CodeErreurMontant>> = {};
  const champs: ChampMontant[] = saisie.mode === 'enveloppe' ? ['revenus', 'enveloppe', 'charges'] : ['revenus', 'charges'];
  const valeurs: Partial<Record<ChampMontant, number>> = {};
  for (const champ of champs) {
    const lecture = lireMontant(saisie[champ]);
    if (lecture.ok) valeurs[champ] = lecture.centimes;
    else montants[champ] = lecture.erreur;
  }

  const erreursPoids: Partial<Record<PocheId, CodeErreurPoids>> = {};
  for (const poche of POCHES) {
    const lecture = lirePoids(saisie.poids[poche]);
    if (!lecture.ok) erreursPoids[poche] = lecture.erreur;
  }
  const etatTotal = totalPoids(saisie.poids);
  const total: ErreurTotal | null =
    etatTotal.lisible && etatTotal.ecart !== 0 ? { code: 'total', total: etatTotal.total, ecart: etatTotal.ecart } : null;

  const aDesErreurs = Object.keys(montants).length > 0 || Object.keys(erreursPoids).length > 0 || total !== null;
  if (aDesErreurs || valeurs.revenus === undefined || valeurs.charges === undefined) {
    return { ok: false, erreurs: { montants, poids: erreursPoids, total } };
  }

  const poids = parPoche((poche) => {
    const lecture = lirePoids(saisie.poids[poche]);
    if (!lecture.ok) throw new Error('Poids non validé.');
    return lecture.points;
  });
  return {
    ok: true,
    entree: {
      revenus: valeurs.revenus,
      mode: saisie.mode,
      enveloppe: saisie.mode === 'enveloppe' ? (valeurs.enveloppe ?? null) : null,
      charges: valeurs.charges,
      poids,
    },
  };
}

/** Nombre de champs à corriger (le total compte pour un). */
export function nombreErreurs(erreurs: ErreursSaisie): number {
  return Object.keys(erreurs.montants).length + Object.keys(erreurs.poids).length + (erreurs.total ? 1 : 0);
}
