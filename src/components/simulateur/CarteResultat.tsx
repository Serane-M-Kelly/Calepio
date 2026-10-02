/**
 * Carte de résultat : affiche le dernier calcul du moteur, sans jamais recalculer.
 * data-etat = exemple | valide | perime | erreur | deficit (sélecteur stable pour les tests navigateur).
 */

import {
  formaterEuros,
  formaterPourcentage,
  LIBELLES_POCHES,
  POCHES,
  type ResultatFinancable,
  type ResultatManque,
} from '../../lib/budget';
import type { EtatCarte, ResultatAffiche } from './etat';

interface Props {
  readonly resultat: ResultatAffiche | null;
  readonly etat: EtatCarte;
  readonly version: number;
  readonly detailOuvert: boolean;
  readonly onBasculerDetail: () => void;
  readonly pret: boolean;
  /** Des champs sont-ils actuellement signalés en erreur dans le formulaire ? */
  readonly erreursVisibles: boolean;
}

function Montant({ centimes, prefixe = '' }: { centimes: number; prefixe?: string }) {
  return <span data-centimes={centimes}>{prefixe + formaterEuros(centimes)}</span>;
}

function Ligne({ ligne, libelle, note, centimes, prefixe }: { ligne: string; libelle: string; note?: string; centimes: number; prefixe?: string }) {
  return (
    <div className="sim-ligne" data-ligne={ligne}>
      <dt className="sim-ligne__libelle">
        <span className="sim-ligne__nom">{libelle}</span>
        {note && <span className="sim-ligne__note">{note}</span>}
      </dt>
      <dd className="sim-ligne__montant">
        <Montant centimes={centimes} prefixe={prefixe} />
      </dd>
    </div>
  );
}

function noteSurplus(r: ResultatFinancable | ResultatManque): string {
  if (r.mode === 'revenu') return 'Tout le revenu est réparti : pas de surplus.';
  if (r.surplus === 0) return 'Tes revenus ne dépassent pas l’enveloppe.';
  return 'Revenus non inclus dans cette enveloppe, à affecter toi-même (épargne, objectif…).';
}

function Detail({ r, ouvert, onBasculer, pret }: { r: ResultatFinancable; ouvert: boolean; onBasculer: () => void; pret: boolean }) {
  const revenusSousEnveloppe = r.mode === 'enveloppe' && r.enveloppe !== null && r.revenus < r.enveloppe;
  return (
    <div className="sim-detail">
      <button
        type="button"
        className="sim-bascule"
        id="sim-detail-bouton"
        aria-expanded={ouvert}
        aria-controls="sim-detail"
        onClick={onBasculer}
        disabled={!pret}
      >
        <span>{ouvert ? 'Masquer le détail du calcul' : 'Voir le détail du calcul'}</span>
        <span className="sim-chevron" aria-hidden="true" />
      </button>
      <div id="sim-detail" className="sim-detail__panneau" hidden={!ouvert}>
        <dl className="sim-lignes">
          <Ligne ligne="detail-revenus" libelle="Revenus du mois" centimes={r.revenus} />
          {r.mode === 'enveloppe' ? (
            <Ligne
              ligne="detail-budget"
              libelle="Budget retenu"
              note={
                revenusSousEnveloppe
                  ? `Tes revenus sont inférieurs à l’enveloppe (${formaterEuros(r.enveloppe ?? 0)}) : seuls tes revenus sont répartis.`
                  : 'Le montant de l’enveloppe, charges comprises.'
              }
              centimes={r.budget}
            />
          ) : (
            <Ligne ligne="detail-budget" libelle="Budget retenu" note="Tout le revenu." centimes={r.budget} />
          )}
          <Ligne ligne="detail-charges" libelle="Charges réservées" centimes={r.charges} prefixe={"\u2212\u00A0"} />
          <Ligne ligne="detail-disponible" libelle="Disponible pour les poches" centimes={r.disponible} />
          <Ligne ligne="detail-reparti" libelle="Répartis dans les poches" note="Par multiples de 5 €." centimes={r.totalReparti} prefixe={"\u2212\u00A0"} />
          <Ligne ligne="detail-reliquat" libelle="Reste d’arrondi" centimes={r.reliquat} />
          {r.mode === 'enveloppe' && <Ligne ligne="detail-surplus" libelle="Surplus hors enveloppe" centimes={r.surplus} />}
        </dl>
        <p className="sim-verification" data-ligne="verification">
          Vérification : {formaterEuros(r.charges)} de charges + {formaterEuros(r.totalReparti)} répartis +{' '}
          {formaterEuros(r.reliquat)} de reste d’arrondi + {formaterEuros(r.surplus)} de surplus ={' '}
          {formaterEuros(r.revenus)} de revenus.
        </p>
      </div>
    </div>
  );
}

function ContenuFinancable({ r, detailOuvert, onBasculerDetail, pret }: { r: ResultatFinancable; detailOuvert: boolean; onBasculerDetail: () => void; pret: boolean }) {
  return (
    <>
      <h3 className="sim-resultat__titre" id="sim-resultat-titre">
        Voici ta répartition proposée.
      </h3>
      <p className="sim-total" data-ligne="total">
        <span className="sim-total__montant">
          <Montant centimes={r.totalReparti} />
        </span>
        <span className="sim-total__texte">répartis dans tes poches</span>
      </p>
      <ul className="sim-poches">
        {POCHES.map((poche) => (
          <li className="sim-poche" key={poche} data-poche={poche}>
            <span className={`compartiment c-${poche}`} aria-hidden="true" />
            <span className="sim-poche__nom">
              <span>{LIBELLES_POCHES[poche]}</span>
              <span className="sim-poche__pct">{formaterPourcentage(r.poids[poche])}</span>
            </span>
            <span className="sim-poche__montant">
              <Montant centimes={r.allocations[poche]} />
            </span>
          </li>
        ))}
      </ul>
      <dl className="sim-lignes">
        <Ligne ligne="charges" libelle="Charges réservées" note="Montant exact, sans arrondi." centimes={r.charges} />
        <Ligne
          ligne="surplus"
          libelle={r.mode === 'revenu' ? 'Surplus' : 'Surplus hors enveloppe'}
          note={noteSurplus(r)}
          centimes={r.surplus}
        />
        <Ligne
          ligne="reliquat"
          libelle="Reste d’arrondi"
          note={r.reliquat === 0 ? 'Aucun reste d’arrondi.' : 'Moins de 5 € non répartis, à conserver toi-même.'}
          centimes={r.reliquat}
        />
      </dl>
      <Detail r={r} ouvert={detailOuvert} onBasculer={onBasculerDetail} pret={pret} />
    </>
  );
}

function ContenuManque({ r }: { r: ResultatManque }) {
  return (
    <>
      <h3 className="sim-resultat__titre" id="sim-resultat-titre">
        Tes charges dépassent ton budget.
      </h3>
      <p className="sim-total" data-ligne="manque">
        <span className="sim-total__texte">Il manque</span>
        <span className="sim-total__montant">
          <Montant centimes={r.manque} />
        </span>
      </p>
      <p className="sim-resultat__texte">
        Aucune répartition n’est proposée : ton budget ne couvre pas toutes tes charges, les poches restent vides.
      </p>
      <dl className="sim-lignes">
        <Ligne
          ligne="budget"
          libelle="Budget retenu"
          note={r.mode === 'enveloppe' ? 'Le plus petit montant entre tes revenus et l’enveloppe.' : 'Tout le revenu.'}
          centimes={r.budget}
        />
        <Ligne ligne="charges" libelle="Charges à réserver" note="Pas entièrement couvertes." centimes={r.charges} />
        <Ligne ligne="manque" libelle="Montant manquant" centimes={r.manque} />
        {r.mode === 'enveloppe' && <Ligne ligne="surplus" libelle="Surplus hors enveloppe" note={noteSurplus(r)} centimes={r.surplus} />}
      </dl>
    </>
  );
}

export default function CarteResultat({ resultat, etat, version, detailOuvert, onBasculerDetail, pret, erreursVisibles }: Props) {
  const surtitre =
    etat === 'erreur'
      ? 'Résultat'
      : resultat?.perime
        ? 'Résultat précédent'
        : resultat?.provenance === 'exemple'
          ? 'Résultat · exemple fictif'
          : 'Résultat';

  return (
    <section className="sim-resultat" id="sim-resultat" data-etat={etat} aria-labelledby="sim-resultat-titre">
      <p className="sim-resultat__surtitre">{surtitre}</p>
      {resultat?.perime && (
        <p className="sim-perime" id="sim-perime">
          <span className="sim-pastille">À actualiser</span>
          <span>
            Tu as modifié ta saisie : ce résultat correspond aux valeurs précédentes. Clique sur « Simuler mon budget »
            pour l’actualiser.
          </span>
        </p>
      )}
      {resultat === null ? (
        <>
          <h3 className="sim-resultat__titre" id="sim-resultat-titre">
            Pas de résultat pour le moment.
          </h3>
          <p className="sim-resultat__texte">
            {erreursVisibles
              ? 'Corrige les champs signalés dans le formulaire, puis clique sur « Simuler mon budget ».'
              : 'Clique sur « Simuler mon budget » pour obtenir ta répartition.'}
          </p>
        </>
      ) : (
        <div className="sim-resultat__contenu" key={version}>
          {resultat.valeur.type === 'financable' ? (
            <ContenuFinancable r={resultat.valeur} detailOuvert={detailOuvert} onBasculerDetail={onBasculerDetail} pret={pret} />
          ) : (
            <ContenuManque r={resultat.valeur} />
          )}
        </div>
      )}
      <p className="sim-resultat__note">Tu effectues ensuite les transferts dans ton application bancaire.</p>
    </section>
  );
}
