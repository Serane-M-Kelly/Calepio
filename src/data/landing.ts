/**
 * Contenus éditoriaux de la landing (textes AD v21 et compléments PA v4).
 * Données statiques lues au build : aucune saisie ni calcul ici.
 */

import type { PocheId } from '../lib/budget/poches';

export const site = {
  name: 'Calepio',
  title: 'Simulateur de budget par enveloppes | Calepio',
  description:
    'Prépare ton budget mensuel avec Calepio : réserve tes charges, puis répartis le reste entre cinq poches par tranches de 5 €. Simulateur sans connexion bancaire, avec un exemple fictif.',
  eyebrow: 'Simulateur de budget par enveloppes',
  headline: 'Ton mois prend forme.',
  intro: 'Réserve tes charges et répartis ton budget selon tes priorités.',
  cta: 'Simuler mon budget',
} as const;

/** Identifiant stable de la section du simulateur (ancre #simulateur). */
export const SIMULATOR_ID = 'simulateur';

/** Identifiants des poches : source unique dans le moteur (src/lib/budget/poches.ts). */
export type PocketId = PocheId;

export interface Pocket {
  id: PocketId;
  label: string;
  description: string;
}

/** Les cinq poches fixes, dans l’ordre d’affichage de la v21. */
export const pockets: readonly Pocket[] = [
  {
    id: 'besoins',
    label: 'Besoins',
    description:
      'Les dépenses courantes qui ne sont pas déjà réservées en charges. Par exemple : le loyer reste dans les charges, les courses vont dans Besoins. Une même dépense ne compte qu’une fois.',
  },
  {
    id: 'epargne',
    label: 'Épargne',
    description: 'Ce que tu choisis de mettre de côté ce mois-ci.',
  },
  {
    id: 'envies',
    label: 'Envies',
    description: 'Les sorties, loisirs et achats plaisir que tu t’autorises.',
  },
  {
    id: 'projets',
    label: 'Projets personnels',
    description: 'Un objectif que tu prépares, comme un voyage, une formation ou un équipement.',
  },
  {
    id: 'imprevus',
    label: 'Imprévus',
    description: 'Une marge pour les dépenses que tu n’avais pas prévues.',
  },
];

export const steps = [
  {
    number: '01',
    pocket: 'besoins',
    title: 'Réserve tes charges.',
    text: 'Mets à part ce qui doit couvrir tes dépenses fixes.',
  },
  {
    number: '02',
    pocket: 'epargne',
    title: 'Répartis le disponible.',
    text: 'Attribue un montant à chaque usage : besoins, envies, épargne ou projets.',
  },
  {
    number: '03',
    pocket: 'envies',
    title: 'Applique ta répartition.',
    text: 'Effectue ensuite les transferts dans ton application bancaire.',
    strong: 'Calepio ne déplace pas ton argent.',
  },
] as const;

export const control = [
  {
    title: 'Une proposition à ajuster.',
    text: 'La répartition sert de point de départ à tes décisions.',
  },
  {
    title: 'Des sommes bien distinguées.',
    text: 'Les charges, les poches, le surplus et le reste d’arrondi sont présentés séparément.',
  },
  {
    title: 'Tes décisions, dans ta banque.',
    text: 'Tu choisis comment appliquer les montants proposés.',
  },
] as const;

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/** Questions v21 (1, 3, 7, 8) et compléments proposés par PA (2, 4, 5, 6). */
export const faq: readonly FaqItem[] = [
  {
    id: 'banque',
    question: 'Calepio se connecte-t-il à ma banque ?',
    answer:
      'Non. Tu renseignes les montants nécessaires à la simulation et tu effectues toi-même les éventuels transferts dans ta banque.',
  },
  {
    id: 'enveloppe',
    question: 'Quelle différence entre l’enveloppe et mes revenus ?',
    answer:
      'Tes revenus sont ce que tu reçois ce mois-ci. L’enveloppe est un plafond que tu choisis, charges comprises. Si elle est inférieure à tes revenus, la différence n’est pas répartie : elle reste à part, comme surplus. Sans enveloppe, tout le revenu est réparti.',
  },
  {
    id: 'tranches',
    question: 'Pourquoi répartir par tranches de 5 € ?',
    answer:
      'Pour proposer des montants simples à appliquer. Les charges gardent leur montant exact. Le disponible est réparti entre les poches par tranches de 5 €, et le reste inférieur à 5 € est affiché séparément.',
  },
  {
    id: 'reste',
    question: 'Que devient le reste d’arrondi ?',
    answer:
      'C’est la part du disponible, inférieure à 5 €, qui n’entre dans aucune poche. Il est affiché séparément du surplus. Calepio ne le met pas de côté à ta place : c’est à toi de le conserver.',
  },
  {
    id: 'surplus',
    question: 'Que faire du surplus ?',
    answer:
      'Le surplus correspond aux revenus laissés hors de l’enveloppe. Tu peux l’affecter toi-même à ton épargne ou à un objectif. Calepio n’effectue ni transfert ni suivi.',
  },
  {
    id: 'manque',
    question: 'Et si mes charges dépassent mon budget ?',
    answer:
      'Aucune répartition n’est proposée. Le montant manquant est indiqué, sans présenter les charges non couvertes comme financées.',
  },
  {
    id: 'deja-depense',
    question: 'Et si j’ai déjà commencé à dépenser ce mois-ci ?',
    answer:
      'Cette simulation prépare un mois avant ses premières dépenses. Elle ne prend pas encore en compte les factures déjà payées, les avances ou les reports du mois précédent.',
  },
  {
    id: 'installer',
    question: 'Puis-je installer l’application ?',
    answer:
      'Pas pour le moment. L’application est en préparation. Cette page en présente une première étape : la simulation de répartition du budget.',
  },
];
