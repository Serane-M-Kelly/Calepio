/**
 * Formatage fr-FR des montants et pourcentages pour l'affichage.
 * Implémentation explicite (pas d'Intl) pour un rendu identique au build et
 * dans tous les navigateurs : milliers séparés par une espace fine insécable,
 * espace insécable avant « € » et « % », centimes affichés seulement s'ils existent.
 */

export const ESPACE_INSECABLE = ' ';
export const ESPACE_FINE_INSECABLE = ' ';

function grouperMilliers(entier: number): string {
  return String(entier).replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE_INSECABLE);
}

/** 32 500 → « 325 € » ; 240 → « 2,40 € » ; 59 760 → « 597,60 € ». */
export function formaterEuros(centimes: number): string {
  if (!Number.isSafeInteger(centimes)) throw new RangeError('Montant en centimes entier attendu.');
  const signe = centimes < 0 ? '−' : '';
  const absolu = Math.abs(centimes);
  const euros = Math.floor(absolu / 100);
  const reste = absolu % 100;
  const decimales = reste === 0 ? '' : `,${String(reste).padStart(2, '0')}`;
  return `${signe}${grouperMilliers(euros)}${decimales}${ESPACE_INSECABLE}€`;
}

/** 40 → « 40 % ». */
export function formaterPourcentage(points: number): string {
  return `${points}${ESPACE_INSECABLE}%`;
}
