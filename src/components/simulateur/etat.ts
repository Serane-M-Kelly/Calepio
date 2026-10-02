/**
 * États du simulateur, sous forme de fonctions pures (testables sans React).
 *
 * - La saisie est conservée en texte, telle que tapée : rien n'est reformaté.
 * - Le calcul n'a lieu qu'à l'action « simuler » (clic ou Entrée dans le formulaire).
 * - Toute modification après un résultat le marque « périmé » (à actualiser)
 *   et retire l'attribution « exemple fictif » aux saisies.
 * - Une validation échouée retire le résultat courant et expose les erreurs par champ.
 */

import {
  calculerRepartition,
  nombreErreurs,
  totalPoids,
  validerSaisie,
  type ErreursSaisie,
  type ModeBudget,
  type PocheId,
  type ResultatBudget,
  type SaisieBudget,
} from '../../lib/budget';

/** Exemple fictif initial (UX_FLOWS PA v4). */
export const SAISIE_EXEMPLE: SaisieBudget = {
  revenus: '1 000',
  mode: 'enveloppe',
  enveloppe: '400',
  charges: '75',
  poids: { besoins: '40', epargne: '20', envies: '15', projets: '15', imprevus: '10' },
};

export type Provenance = 'exemple' | 'saisie';

export interface ResultatAffiche {
  readonly valeur: ResultatBudget;
  /** Le résultat a-t-il été calculé à partir des valeurs d'exemple non modifiées ? */
  readonly provenance: Provenance;
  /** Une saisie a changé depuis ce calcul : le résultat est « à actualiser ». */
  readonly perime: boolean;
}

export interface EtatSimulateur {
  readonly saisie: SaisieBudget;
  /** Les saisies courantes sont-elles encore celles de l'exemple ? */
  readonly provenance: Provenance;
  readonly resultat: ResultatAffiche | null;
  /** Erreurs de la dernière tentative de simulation (null si elle a réussi). */
  readonly erreurs: ErreursSaisie | null;
  /** Incrémenté à chaque simulation réussie (animation, annonce). */
  readonly version: number;
}

export type ChampTexte = 'revenus' | 'enveloppe' | 'charges';

export type Action =
  | { readonly type: 'montant'; readonly champ: ChampTexte; readonly valeur: string }
  | { readonly type: 'mode'; readonly mode: ModeBudget }
  | { readonly type: 'poids'; readonly poche: PocheId; readonly valeur: string }
  | { readonly type: 'simuler' }
  | { readonly type: 'reinitialiser' };

/** Valeur de data-etat sur la carte de résultat. */
export type EtatCarte = 'exemple' | 'valide' | 'perime' | 'erreur' | 'deficit';

export function etatInitial(): EtatSimulateur {
  const validation = validerSaisie(SAISIE_EXEMPLE);
  if (!validation.ok) throw new Error("L'exemple fictif doit être valide.");
  return {
    saisie: SAISIE_EXEMPLE,
    provenance: 'exemple',
    resultat: { valeur: calculerRepartition(validation.entree), provenance: 'exemple', perime: false },
    erreurs: null,
    version: 0,
  };
}

function apresModification(etat: EtatSimulateur, saisie: SaisieBudget): EtatSimulateur {
  return {
    ...etat,
    saisie,
    provenance: 'saisie',
    resultat: etat.resultat ? { ...etat.resultat, perime: true } : null,
  };
}

export function reduire(etat: EtatSimulateur, action: Action): EtatSimulateur {
  switch (action.type) {
    case 'montant':
      if (etat.saisie[action.champ] === action.valeur) return etat;
      return apresModification(etat, { ...etat.saisie, [action.champ]: action.valeur });
    case 'mode':
      if (etat.saisie.mode === action.mode) return etat;
      return apresModification(etat, { ...etat.saisie, mode: action.mode });
    case 'poids':
      if (etat.saisie.poids[action.poche] === action.valeur) return etat;
      return apresModification(etat, {
        ...etat.saisie,
        poids: { ...etat.saisie.poids, [action.poche]: action.valeur },
      });
    case 'simuler': {
      const validation = validerSaisie(etat.saisie);
      if (!validation.ok) return { ...etat, resultat: null, erreurs: validation.erreurs };
      return {
        ...etat,
        resultat: { valeur: calculerRepartition(validation.entree), provenance: etat.provenance, perime: false },
        erreurs: null,
        version: etat.version + 1,
      };
    }
    case 'reinitialiser':
      return { ...etatInitial(), version: etat.version + 1 };
  }
}

export function etatCarte(etat: EtatSimulateur): EtatCarte {
  const { resultat } = etat;
  if (!resultat) return 'erreur';
  if (resultat.perime) return 'perime';
  if (resultat.valeur.type === 'manque') return 'deficit';
  return resultat.provenance === 'exemple' ? 'exemple' : 'valide';
}

/**
 * Erreurs à afficher : celles de la dernière simulation, sans celles que la saisie actuelle
 * a rendues sans objet (plafond en mode « tout le revenu », total revenu à 100). Une erreur de
 * total encore valable reprend le total courant (jamais un ancien chiffre) ; si un pourcentage
 * est illisible, l'indication en direct du panneau prend le relais. Le résultat courant reste
 * absent jusqu'au prochain clic ; seules les indications deviennent cohérentes.
 */
export function erreursAffichees(erreurs: ErreursSaisie | null, saisie: SaisieBudget): ErreursSaisie | null {
  if (!erreurs) return null;
  const montants = { ...erreurs.montants };
  if (saisie.mode === 'revenu') delete montants.enveloppe;
  const total = totalPoids(saisie.poids);
  const visibles: ErreursSaisie = {
    montants,
    poids: erreurs.poids,
    total:
      erreurs.total && total.lisible && total.ecart !== 0
        ? { code: 'total', total: total.total, ecart: total.ecart }
        : null,
  };
  return nombreErreurs(visibles) > 0 ? visibles : null;
}
