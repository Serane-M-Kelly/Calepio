/**
 * Moteur de répartition (UX_FLOWS PA v4), en centimes entiers.
 *
 * R = revenus, E = plafond de l'enveloppe, C = charges.
 * Budget B = min(R, E) en mode enveloppe, sinon B = R ; surplus S = R − B.
 * Si C > B : manque = C − B, aucune allocation.
 * Sinon disponible D = B − C, réparti par tranches de 5 € (500 centimes) :
 * plancher de chaque part théorique D × poids / 100 au multiple de 500 inférieur,
 * puis les tranches restantes vont aux plus grands restes théoriques (ordre stable
 * des poches en cas d'égalité). Reliquat = D mod 500, distinct du surplus.
 * Invariant : C + Σ allocations + reliquat + S = R.
 *
 * Bornes : montants ≤ 99 999 999 centimes et poids ≤ 100, donc D × poids ≤ 1e10,
 * bien en deçà de Number.MAX_SAFE_INTEGER : l'arithmétique entière JS est exacte.
 */

import { MONTANT_MAX_CENTIMES } from './montant';
import { POCHES, parPoche, type ParPoche, type PocheId } from './poches';
import { TOTAL_POIDS } from './poids';

export const TRANCHE_CENTIMES = 500;

export type ModeBudget = 'revenu' | 'enveloppe';

export interface EntreeBudget {
  readonly revenus: number;
  readonly mode: ModeBudget;
  /** Plafond de l'enveloppe, charges comprises ; ignoré (null) en mode « tout le revenu ». */
  readonly enveloppe: number | null;
  readonly charges: number;
  /** Points entiers, total exactement 100. */
  readonly poids: ParPoche<number>;
}

interface BaseResultat {
  readonly revenus: number;
  readonly mode: ModeBudget;
  readonly enveloppe: number | null;
  /** B : budget retenu. */
  readonly budget: number;
  readonly charges: number;
  /** S : revenus laissés hors de l'enveloppe. */
  readonly surplus: number;
  readonly poids: ParPoche<number>;
}

export interface ResultatFinancable extends BaseResultat {
  readonly type: 'financable';
  /** D : disponible pour les poches. */
  readonly disponible: number;
  readonly allocations: ParPoche<number>;
  readonly totalReparti: number;
  /** Reste d'arrondi, inférieur à 500 centimes. */
  readonly reliquat: number;
}

export interface ResultatManque extends BaseResultat {
  readonly type: 'manque';
  /** C − B : montant des charges non couvert par le budget. */
  readonly manque: number;
}

export type ResultatBudget = ResultatFinancable | ResultatManque;

export class EntreeInvalide extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntreeInvalide';
  }
}

function verifierMontant(nom: string, valeur: number): void {
  if (!Number.isSafeInteger(valeur) || valeur < 0 || valeur > MONTANT_MAX_CENTIMES) {
    throw new EntreeInvalide(`${nom} doit être un nombre entier de centimes entre 0 et ${MONTANT_MAX_CENTIMES}.`);
  }
}

function verifierEntree(entree: EntreeBudget): void {
  verifierMontant('revenus', entree.revenus);
  verifierMontant('charges', entree.charges);
  if (entree.mode === 'enveloppe') {
    if (entree.enveloppe === null) throw new EntreeInvalide('enveloppe manquante en mode enveloppe.');
    verifierMontant('enveloppe', entree.enveloppe);
  }
  let total = 0;
  for (const poche of POCHES) {
    const points = entree.poids[poche];
    if (!Number.isSafeInteger(points) || points < 0 || points > TOTAL_POIDS) {
      throw new EntreeInvalide(`poids ${poche} doit être un entier entre 0 et ${TOTAL_POIDS}.`);
    }
    total += points;
  }
  if (total !== TOTAL_POIDS) throw new EntreeInvalide(`total des poids ${total}, attendu ${TOTAL_POIDS}.`);
}

/**
 * Répartit le disponible D (centimes) selon les poids (total 100).
 * Exporté pour les tests ; l'interface passe par calculerRepartition.
 */
export function repartirDisponible(disponible: number, poids: ParPoche<number>): { allocations: Record<PocheId, number>; reliquat: number } {
  const diviseur = TOTAL_POIDS * TRANCHE_CENTIMES; // 50 000 : part théorique / 500
  const tranchesParPoche = parPoche((poche) => Math.floor((disponible * poids[poche]) / diviseur));
  // Reste théorique, comparé en entiers (unités de 1/100 de centime).
  const restes = parPoche((poche) => (disponible * poids[poche]) % diviseur);

  const tranchesTotales = Math.floor(disponible / TRANCHE_CENTIMES);
  const tranchesPlanchers = POCHES.reduce((somme, poche) => somme + tranchesParPoche[poche], 0);
  let tranchesRestantes = tranchesTotales - tranchesPlanchers;

  // Plus grands restes d'abord ; tri stable, donc l'ordre des poches départage les égalités.
  // Une poche de poids nul a un reste nul et n'est jamais candidate.
  const candidates = POCHES.filter((poche) => poids[poche] > 0 && restes[poche] > 0).sort(
    (a, b) => restes[b] - restes[a],
  );
  if (tranchesRestantes < 0 || tranchesRestantes > candidates.length) {
    throw new Error('Invariant de répartition rompu.');
  }
  for (const poche of candidates) {
    if (tranchesRestantes === 0) break;
    tranchesParPoche[poche] += 1;
    tranchesRestantes -= 1;
  }

  const allocations = parPoche((poche) => tranchesParPoche[poche] * TRANCHE_CENTIMES);
  return { allocations, reliquat: disponible % TRANCHE_CENTIMES };
}

export function calculerRepartition(entree: EntreeBudget): ResultatBudget {
  verifierEntree(entree);
  const { revenus, mode, charges } = entree;
  const enveloppe = mode === 'enveloppe' ? entree.enveloppe : null;
  const budget = enveloppe === null ? revenus : Math.min(revenus, enveloppe);
  const surplus = revenus - budget;
  const poids = parPoche((poche) => entree.poids[poche]);
  const base = { revenus, mode, enveloppe, budget, charges, surplus, poids };

  if (charges > budget) {
    return { ...base, type: 'manque', manque: charges - budget };
  }

  const disponible = budget - charges;
  const { allocations, reliquat } = repartirDisponible(disponible, poids);
  const totalReparti = POCHES.reduce((somme, poche) => somme + allocations[poche], 0);

  if (charges + totalReparti + reliquat + surplus !== revenus) {
    throw new Error('Invariant de conservation rompu.');
  }
  return { ...base, type: 'financable', disponible, allocations, totalReparti, reliquat };
}
