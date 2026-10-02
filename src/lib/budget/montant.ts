/**
 * Lecture des montants saisis au format français, convertis en centimes entiers.
 *
 * Format accepté (décision documentée dans le README) :
 * - chiffres, avec au plus deux décimales : « 75 », « 402,40 », « 0,5 » (= 0,50 €) ;
 * - séparateur décimal : la virgule ; le point est accepté comme équivalent
 *   (« 402.40 »), car certains claviers numériques n'offrent que lui ;
 * - séparateur de milliers : une espace (normale, insécable, fine ou fine insécable),
 *   uniquement entre des groupes de trois chiffres : « 1 000 », « 12 345,67 » ;
 * - espaces en début et fin ignorées ; symbole « € » final toléré.
 * Refusé : vide, signe moins, plus de deux décimales (« 1.000 » est donc refusé
 * plutôt que lu comme mille ou comme un), séparateur sans chiffres de part et d'autre,
 * mélange virgule/point, groupes de milliers irréguliers, tout autre caractère,
 * et toute valeur au-delà de 999 999,99 €.
 */

/** Montant maximal par champ : 999 999,99 €, soit 99 999 999 centimes (décision de Kelly). */
export const MONTANT_MAX_CENTIMES = 99_999_999;

export type CodeErreurMontant = 'vide' | 'format' | 'negatif' | 'decimales' | 'max';

export type LectureMontant =
  | { readonly ok: true; readonly centimes: number }
  | { readonly ok: false; readonly erreur: CodeErreurMontant };

const SIGNE_MOINS = /^[-−–]/;
const ESPACES = /\s+/g;
// Partie entière : soit des chiffres contigus, soit des groupes de trois après le premier.
const NOMBRE = /^(\d{1,3}(?: \d{3})+|\d+)(?:([,.])(\d+))?$/;

function lireSansSigne(texte: string): LectureMontant {
  const correspondance = NOMBRE.exec(texte);
  if (!correspondance) return { ok: false, erreur: 'format' };
  const entier = (correspondance[1] ?? '').replace(/ /g, '');
  const decimales = correspondance[3] ?? '';
  if (decimales.length > 2) return { ok: false, erreur: 'decimales' };

  // Longueur bornée avant conversion : aucune perte de précision possible.
  const entierSignificatif = entier.replace(/^0+(?=\d)/, '');
  if (entierSignificatif.length > 6) return { ok: false, erreur: 'max' };

  const centimes = Number(entierSignificatif) * 100 + Number(decimales.padEnd(2, '0'));
  if (centimes > MONTANT_MAX_CENTIMES) return { ok: false, erreur: 'max' };
  return { ok: true, centimes };
}

export function lireMontant(saisie: string): LectureMontant {
  let texte = saisie.trim();
  if (texte === '') return { ok: false, erreur: 'vide' };
  if (texte.endsWith('€')) texte = texte.slice(0, -1).trim();
  if (texte === '') return { ok: false, erreur: 'format' };
  texte = texte.replace(ESPACES, ' ');

  if (SIGNE_MOINS.test(texte)) {
    // Tout signe moins est refusé (même « -0 ») ; s'il précède un nombre lisible,
    // l'erreur précise est « négatif », sinon c'est une erreur de format.
    const reste = lireSansSigne(texte.slice(1).trim());
    return !reste.ok && reste.erreur === 'format' ? reste : { ok: false, erreur: 'negatif' };
  }
  return lireSansSigne(texte);
}
