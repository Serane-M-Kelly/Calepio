/** Textes d'erreur affichés près des champs (le code reste la source de vérité). */

import type { CodeErreurMontant } from './montant';
import type { CodeErreurPoids } from './poids';
import type { ErreurTotal } from './validation';

export function messageErreurMontant(code: CodeErreurMontant): string {
  switch (code) {
    case 'vide':
      return 'Indique un montant, même 0.';
    case 'format':
      return 'Montant illisible. Écris par exemple 1 000 ou 402,40.';
    case 'negatif':
      return 'Le montant ne peut pas être négatif.';
    case 'decimales':
      return 'Deux chiffres au plus après la virgule, par exemple 402,40. Pour les milliers, utilise une espace : 1 000.';
    case 'max':
      return 'Le montant ne peut pas dépasser 999 999,99 €.';
  }
}

export function messageErreurPoids(code: CodeErreurPoids): string {
  switch (code) {
    case 'vide':
      return 'Indique un pourcentage, même 0.';
    case 'format':
      return 'Pourcentage illisible. Écris un nombre entier, par exemple 15.';
    case 'negatif':
      return 'Le pourcentage ne peut pas être négatif.';
    case 'non_entier':
      return 'Utilise un nombre entier de points, sans virgule.';
    case 'max':
      return 'Le pourcentage ne peut pas dépasser 100.';
  }
}

function points(n: number): string {
  return `${n} point${n > 1 ? 's' : ''}`;
}

/** Écart à 100 décrit en mots, sans proposer de correction automatique. */
export function descriptionEcart(ecart: number): string {
  if (ecart === 0) return 'Le total fait exactement 100 %.';
  return ecart > 0 ? `${points(ecart)} en trop.` : `Il manque ${points(-ecart)}.`;
}

export function messageErreurTotal(erreur: ErreurTotal): string {
  return `Le total fait ${erreur.total} % au lieu de 100 % : ${descriptionEcart(erreur.ecart).toLowerCase()} Ajuste les pourcentages toi-même.`;
}
