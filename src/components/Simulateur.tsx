/**
 * Simulateur Calepio (îlot React, hydraté par `client:load` dans SectionSimulateur.astro).
 *
 * - Rendu au build avec l'exemple fictif déjà calculé par le moteur ; tant que
 *   React n'a pas pris la main (ou sans JavaScript), le formulaire est désactivé.
 * - Le calcul n'a lieu qu'à la soumission (bouton « Simuler mon budget » ou Entrée).
 * - Aucun stockage, aucune requête réseau, aucun journal : l'état vit en mémoire.
 */

import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import {
  descriptionEcart,
  formaterEuros,
  LIBELLES_POCHES,
  messageErreurMontant,
  messageErreurPoids,
  messageErreurTotal,
  nombreErreurs,
  POCHES,
  totalPoids,
  type CodeErreurMontant,
  type ErreursSaisie,
  type PocheId,
  type ResultatBudget,
} from '../lib/budget';
import CarteResultat from './simulateur/CarteResultat';
import {
  erreursAffichees,
  etatCarte,
  etatInitial,
  reduire,
  type Action,
  type ChampTexte,
  type EtatSimulateur,
} from './simulateur/etat';
import './simulateur/simulateur.css';

const ID_CHAMP: Record<ChampTexte, string> = {
  revenus: 'sim-revenus',
  enveloppe: 'sim-enveloppe',
  charges: 'sim-charges',
};

const idPoids = (poche: PocheId) => `sim-poids-${poche}`;
const ID_TOTAL = 'sim-poids-total';
const ID_AIDE_BESOINS = 'sim-aide-besoins';

function decrit(...ids: (string | false | null | undefined)[]): string | undefined {
  const liste = ids.filter((id): id is string => typeof id === 'string');
  return liste.length > 0 ? liste.join(' ') : undefined;
}

function premierChampInvalide(erreurs: ErreursSaisie): string | null {
  for (const champ of ['revenus', 'enveloppe', 'charges'] as const) {
    if (erreurs.montants[champ]) return ID_CHAMP[champ];
  }
  const poche = POCHES.find((p) => erreurs.poids[p]);
  if (poche) return idPoids(poche);
  return erreurs.total ? idPoids(POCHES[0]) : null;
}

function annonceResultat(r: ResultatBudget): string {
  if (r.type === 'manque') {
    return `Simulation terminée : tes charges dépassent ton budget de ${formaterEuros(r.manque)}. Aucune répartition proposée.`;
  }
  return (
    `Simulation terminée : ${formaterEuros(r.totalReparti)} répartis dans tes poches. ` +
    `Charges réservées ${formaterEuros(r.charges)}, surplus ${formaterEuros(r.surplus)}, reste d’arrondi ${formaterEuros(r.reliquat)}.`
  );
}

interface ChampMontantProps {
  readonly champ: ChampTexte;
  readonly libelle: string;
  readonly complement?: string;
  readonly valeur: string;
  readonly erreur: CodeErreurMontant | undefined;
  readonly onChange: (valeur: string) => void;
}

function ChampMontant({ champ, libelle, complement, valeur, erreur, onChange }: ChampMontantProps) {
  const id = ID_CHAMP[champ];
  const idErreur = `${id}-erreur`;
  return (
    <div className="sim-champ" data-champ={champ}>
      <label className="sim-champ__libelle" htmlFor={id}>
        {libelle}
        {complement && <span className="sim-champ__complement"> · {complement}</span>}
      </label>
      <div className="sim-saisie">
        <input
          id={id}
          name={champ}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          className="sim-saisie__champ"
          value={valeur}
          onChange={(e) => onChange(e.currentTarget.value)}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={decrit(erreur && idErreur)}
        />
        <span className="sim-saisie__unite" aria-hidden="true">
          €
        </span>
      </div>
      {erreur && (
        <p className="sim-erreur" id={idErreur}>
          <span className="sim-erreur__signe" aria-hidden="true">!</span>
          <span>
            <span className="sr-only">Erreur : </span>
            {messageErreurMontant(erreur)}
          </span>
        </p>
      )}
    </div>
  );
}

export default function Simulateur() {
  const [etat, setEtat] = useState<EtatSimulateur>(etatInitial);
  const [pret, setPret] = useState(false);
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const [annonce, setAnnonce] = useState('');
  const focusApres = useRef<string | null>(null);
  const defilerApres = useRef(false);
  const minuterieAnnonce = useRef<number | undefined>(undefined);
  const carteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPret(true);
    return () => window.clearTimeout(minuterieAnnonce.current);
  }, []);

  // Après rendu : focus sur le premier champ en erreur, ou résultat amené à l'écran.
  useEffect(() => {
    if (focusApres.current) {
      document.getElementById(focusApres.current)?.focus();
      focusApres.current = null;
    }
    if (defilerApres.current && carteRef.current) {
      defilerApres.current = false;
      const zone = carteRef.current.getBoundingClientRect();
      if (zone.top > window.innerHeight * 0.85 || zone.bottom < 0) {
        const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        carteRef.current.scrollIntoView({ block: 'start', behavior: reduit ? 'auto' : 'smooth' });
      }
    }
  });

  /** Région live polie : vidée puis remplie, pour que deux annonces identiques soient lues. */
  function annoncer(message: string) {
    window.clearTimeout(minuterieAnnonce.current);
    setAnnonce('');
    minuterieAnnonce.current = window.setTimeout(() => setAnnonce(message), 120);
  }

  function modifier(action: Action) {
    const suivant = reduire(etat, action);
    if (suivant === etat) return;
    if (etat.resultat && !etat.resultat.perime && suivant.resultat?.perime) {
      annoncer('Résultat à actualiser : relance la simulation pour tenir compte de ta modification.');
    }
    setEtat(suivant);
  }

  function simuler(evenement: SubmitEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const suivant = reduire(etat, { type: 'simuler' });
    setEtat(suivant);
    if (suivant.erreurs) {
      const erreurPoids = Object.keys(suivant.erreurs.poids).length > 0 || suivant.erreurs.total !== null;
      if (erreurPoids) setPanneauOuvert(true);
      focusApres.current = premierChampInvalide(suivant.erreurs);
      annoncer('');
    } else if (suivant.resultat) {
      setDetailOuvert(false);
      defilerApres.current = true;
      annoncer(annonceResultat(suivant.resultat.valeur));
    }
  }

  function reinitialiser() {
    setEtat(reduire(etat, { type: 'reinitialiser' }));
    setPanneauOuvert(false);
    setDetailOuvert(false);
    annoncer('Exemple fictif restauré : montants, mode et pourcentages de démonstration.');
  }

  const { saisie } = etat;
  const erreurs = erreursAffichees(etat.erreurs, saisie);
  const total = totalPoids(saisie.poids);
  const erreurTotal = erreurs?.total ?? null;
  const etatTotal = !total.lisible ? 'illisible' : total.ecart === 0 ? 'exact' : 'ecart';
  const nbErreurs = erreurs ? nombreErreurs(erreurs) : 0;

  return (
    <div className="sim" data-pret={pret ? 'oui' : 'non'}>
      <form className="sim-formulaire" id="sim-formulaire" noValidate onSubmit={simuler} aria-label="Simulation de budget">
        <fieldset className="sim-formulaire__cadre" disabled={!pret}>
          <div className="sim-entete">
            {etat.provenance === 'exemple' && (
              <span className="sim-etiquette" id="sim-etiquette-exemple">
                Exemple fictif
              </span>
            )}
            <button type="button" className="sim-lien" id="sim-reinitialiser" onClick={reinitialiser}>
              Réinitialiser l’exemple
            </button>
          </div>

          <ChampMontant
            champ="revenus"
            libelle="Revenus du mois"
            valeur={saisie.revenus}
            erreur={erreurs?.montants.revenus}
            onChange={(valeur) => modifier({ type: 'montant', champ: 'revenus', valeur })}
          />

          <fieldset className="sim-mode">
            <legend className="sim-champ__libelle">Budget à répartir</legend>
            <div className="sim-mode__options">
              <label className="sim-option" htmlFor="sim-mode-revenu">
                <input
                  type="radio"
                  className="sim-option__radio"
                  id="sim-mode-revenu"
                  name="sim-mode"
                  value="revenu"
                  checked={saisie.mode === 'revenu'}
                  onChange={() => modifier({ type: 'mode', mode: 'revenu' })}
                />
                <span className="sim-option__texte">
                  <span className="sim-option__titre">Tout mon revenu</span>
                  <span className="sim-option__aide">Le revenu entier est réparti.</span>
                </span>
              </label>
              <label className="sim-option" htmlFor="sim-mode-enveloppe">
                <input
                  type="radio"
                  className="sim-option__radio"
                  id="sim-mode-enveloppe"
                  name="sim-mode"
                  value="enveloppe"
                  checked={saisie.mode === 'enveloppe'}
                  onChange={() => modifier({ type: 'mode', mode: 'enveloppe' })}
                />
                <span className="sim-option__texte">
                  <span className="sim-option__titre">Une enveloppe mensuelle</span>
                  <span className="sim-option__aide">Un plafond ; le reste devient surplus.</span>
                </span>
              </label>
            </div>
          </fieldset>

          {saisie.mode === 'enveloppe' && (
            <ChampMontant
              champ="enveloppe"
              libelle="Montant de l’enveloppe"
              complement="charges comprises"
              valeur={saisie.enveloppe}
              erreur={erreurs?.montants.enveloppe}
              onChange={(valeur) => modifier({ type: 'montant', champ: 'enveloppe', valeur })}
            />
          )}

          <ChampMontant
            champ="charges"
            libelle="Charges à réserver"
            valeur={saisie.charges}
            erreur={erreurs?.montants.charges}
            onChange={(valeur) => modifier({ type: 'montant', champ: 'charges', valeur })}
          />

          <div className="sim-repartition">
            <button
              type="button"
              className="sim-bascule"
              id="sim-personnaliser"
              aria-expanded={panneauOuvert}
              aria-controls="sim-panneau-poids"
              onClick={() => setPanneauOuvert((ouvert) => !ouvert)}
            >
              <span>Personnaliser ma répartition</span>
              <span className="sim-chevron" aria-hidden="true" />
            </button>
            {!panneauOuvert && etatTotal !== 'exact' && (
              <p className="sim-poids-resume">
                <span className="sim-erreur__signe" aria-hidden="true">!</span>
                {total.lisible
                  ? `Total actuel : ${total.total}\u00A0% — ${descriptionEcart(total.ecart)}`
                  : 'Un pourcentage est vide ou invalide.'}
              </p>
            )}
            <div className="sim-panneau" id="sim-panneau-poids" hidden={!panneauOuvert}>
              <fieldset className="sim-poids">
                <legend className="sim-poids__legende">Pourcentage du disponible attribué à chaque poche</legend>
                {POCHES.map((poche) => {
                  const id = idPoids(poche);
                  const erreur = erreurs?.poids[poche];
                  const idErreur = `${id}-erreur`;
                  return (
                    <div className="sim-poids__ligne" key={poche} data-poche={poche}>
                      <span className={`compartiment c-${poche}`} aria-hidden="true" />
                      <span className="sim-poids__libelle">
                        <label htmlFor={id}>{LIBELLES_POCHES[poche]}</label>
                        {poche === 'besoins' && (
                          <span className="sim-poids__aide" id={ID_AIDE_BESOINS}>
                            Dépenses courantes non déjà réservées en charges : le loyer reste dans les charges, les
                            courses vont dans Besoins.
                          </span>
                        )}
                      </span>
                      <span className="sim-saisie sim-saisie--poids">
                        <input
                          id={id}
                          name={`poids-${poche}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          spellCheck={false}
                          className="sim-saisie__champ"
                          value={saisie.poids[poche]}
                          onChange={(e) => modifier({ type: 'poids', poche, valeur: e.currentTarget.value })}
                          aria-invalid={erreur || erreurTotal ? true : undefined}
                          aria-describedby={decrit(erreur && idErreur, poche === 'besoins' && ID_AIDE_BESOINS, ID_TOTAL)}
                        />
                        <span className="sim-saisie__unite" aria-hidden="true">
                          %
                        </span>
                      </span>
                      {erreur && (
                        <p className="sim-erreur sim-poids__erreur" id={idErreur}>
                          <span className="sim-erreur__signe" aria-hidden="true">!</span>
                          <span>
                            <span className="sr-only">Erreur : </span>
                            {messageErreurPoids(erreur)}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
                <div className="sim-poids__total" id={ID_TOTAL} data-total={etatTotal}>
                  <p className="sim-poids__total-ligne">
                    <span>Total</span>
                    <span className="sim-poids__total-valeur">{total.lisible ? `${total.total} %` : '—'}</span>
                  </p>
                  {erreurTotal ? (
                    <p className="sim-erreur">
                      <span className="sim-erreur__signe" aria-hidden="true">!</span>
                      <span>
                        <span className="sr-only">Erreur : </span>
                        {messageErreurTotal(erreurTotal)}
                      </span>
                    </p>
                  ) : (
                    etatTotal !== 'exact' && (
                      <p className="sim-poids__ecart">
                        {total.lisible ? descriptionEcart(total.ecart) : 'Un pourcentage est vide ou invalide.'}
                      </p>
                    )
                  )}
                </div>
                <p className="sim-poids__note">
                  Les pourcentages ne sont jamais ajustés automatiquement : le total doit faire exactement 100&nbsp;%.
                </p>
              </fieldset>
            </div>
          </div>

          <p className="sim-limite">
            Cette simulation prépare un mois avant ses premières dépenses. Elle ne tient pas compte des factures déjà
            payées, des avances ou des reports du mois précédent. Calepio ne déplace pas d’argent.
          </p>

          {erreurs && (
            <p className="sim-alerte" id="sim-erreurs">
              <span className="sim-erreur__signe" aria-hidden="true">!</span>
              <span>
                Simulation impossible : {nbErreurs} {nbErreurs > 1 ? 'champs à corriger' : 'champ à corriger'}. Les
                explications sont affichées sous chaque champ concerné.
              </span>
            </p>
          )}

          <button type="submit" className="bouton-principal sim-simuler" id="sim-simuler">
            Simuler mon budget <span aria-hidden="true">→</span>
          </button>
        </fieldset>
      </form>

      <div className="sim-colonne-resultat" ref={carteRef}>
        <CarteResultat
          resultat={etat.resultat}
          etat={etatCarte(etat)}
          version={etat.version}
          detailOuvert={detailOuvert}
          onBasculerDetail={() => setDetailOuvert((ouvert) => !ouvert)}
          pret={pret}
          erreursVisibles={erreurs !== null}
        />
      </div>

      <p className="sr-only" aria-live="polite" id="sim-annonce">
        {annonce}
      </p>
    </div>
  );
}
