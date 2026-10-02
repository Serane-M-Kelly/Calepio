import { describe, expect, it } from 'vitest';
import { erreursAffichees, etatCarte, etatInitial, reduire, SAISIE_EXEMPLE, type Action, type EtatSimulateur } from './etat';

function appliquer(etat: EtatSimulateur, ...actions: Action[]): EtatSimulateur {
  return actions.reduce(reduire, etat);
}

describe('états du simulateur', () => {
  it('état initial : exemple fictif calculé par le moteur', () => {
    const etat = etatInitial();
    expect(etatCarte(etat)).toBe('exemple');
    expect(etat.provenance).toBe('exemple');
    const r = etat.resultat?.valeur;
    expect(r?.type).toBe('financable');
    if (r?.type !== 'financable') return;
    expect(r.allocations).toEqual({ besoins: 13_000, epargne: 6_500, envies: 5_000, projets: 5_000, imprevus: 3_000 });
    expect(r.surplus).toBe(60_000);
  });

  it('aucun recalcul avant simuler : une édition marque le résultat « à actualiser »', () => {
    const avant = etatInitial();
    const apres = reduire(avant, { type: 'montant', champ: 'charges', valeur: '100' });
    expect(apres.resultat?.valeur).toBe(avant.resultat?.valeur); // même objet : pas de calcul
    expect(apres.resultat?.perime).toBe(true);
    expect(apres.provenance).toBe('saisie');
    expect(etatCarte(apres)).toBe('perime');
  });

  it('changer de mode ou de pourcentage marque aussi le résultat à actualiser', () => {
    expect(etatCarte(reduire(etatInitial(), { type: 'mode', mode: 'revenu' }))).toBe('perime');
    expect(etatCarte(reduire(etatInitial(), { type: 'poids', poche: 'envies', valeur: '16' }))).toBe('perime');
  });

  it('une valeur identique ne change rien', () => {
    const etat = etatInitial();
    expect(reduire(etat, { type: 'montant', champ: 'revenus', valeur: SAISIE_EXEMPLE.revenus })).toBe(etat);
    expect(reduire(etat, { type: 'mode', mode: 'enveloppe' })).toBe(etat);
  });

  it('simuler après édition : résultat valide, plus attribué à l’exemple', () => {
    const etat = appliquer(etatInitial(), { type: 'mode', mode: 'revenu' }, { type: 'simuler' });
    expect(etatCarte(etat)).toBe('valide');
    expect(etat.resultat?.provenance).toBe('saisie');
    const r = etat.resultat?.valeur;
    expect(r?.type === 'financable' && r.totalReparti).toBe(92_500);
    expect(etat.version).toBe(1);
  });

  it('simuler sans édition : le résultat reste l’exemple fictif', () => {
    expect(etatCarte(reduire(etatInitial(), { type: 'simuler' }))).toBe('exemple');
  });

  it('validation échouée : pas de résultat courant, erreurs par champ', () => {
    const etat = appliquer(etatInitial(), { type: 'montant', champ: 'revenus', valeur: '1,234' }, { type: 'simuler' });
    expect(etat.resultat).toBeNull();
    expect(etat.erreurs?.montants).toEqual({ revenus: 'decimales' });
    expect(etatCarte(etat)).toBe('erreur');
  });

  it('total 95 : erreur d’écart, pas de résultat courant', () => {
    const etat = appliquer(etatInitial(), { type: 'poids', poche: 'imprevus', valeur: '5' }, { type: 'simuler' });
    expect(etat.resultat).toBeNull();
    expect(etat.erreurs?.total?.ecart).toBe(-5);
  });

  it('déficit : manque affiché, aucune allocation', () => {
    const etat = appliquer(etatInitial(), { type: 'montant', champ: 'revenus', valeur: '50' }, { type: 'simuler' });
    expect(etatCarte(etat)).toBe('deficit');
    expect(etat.resultat?.valeur.type).toBe('manque');
  });

  it('une édition après une erreur garde l’état d’erreur jusqu’à la prochaine simulation', () => {
    const etat = appliquer(
      etatInitial(),
      { type: 'montant', champ: 'revenus', valeur: '' },
      { type: 'simuler' },
      { type: 'montant', champ: 'revenus', valeur: '900' },
    );
    expect(etatCarte(etat)).toBe('erreur');
    expect(etatCarte(reduire(etat, { type: 'simuler' }))).toBe('valide');
  });

  it('réinitialiser restaure chiffres et états de démonstration', () => {
    const modifie = appliquer(
      etatInitial(),
      { type: 'mode', mode: 'revenu' },
      { type: 'poids', poche: 'besoins', valeur: '' },
      { type: 'simuler' },
    );
    const remis = reduire(modifie, { type: 'reinitialiser' });
    expect(remis.saisie).toEqual(SAISIE_EXEMPLE);
    expect(remis.provenance).toBe('exemple');
    expect(remis.erreurs).toBeNull();
    expect(etatCarte(remis)).toBe('exemple');
    expect(remis.resultat?.valeur).toEqual(etatInitial().resultat?.valeur);
  });
});

describe('erreurs affichées après correction (sans nouveau calcul)', () => {
  it('erreur de total masquée dès que le total revient à 100, toujours sans résultat courant', () => {
    const echec = appliquer(etatInitial(), { type: 'poids', poche: 'imprevus', valeur: '5' }, { type: 'simuler' });
    expect(echec.erreurs?.total).not.toBeNull();
    expect(erreursAffichees(echec.erreurs, echec.saisie)?.total).toBeTruthy();
    const corrige = reduire(echec, { type: 'poids', poche: 'imprevus', valeur: '10' });
    expect(erreursAffichees(corrige.erreurs, corrige.saisie)).toBeNull();
    expect(corrige.resultat).toBeNull();
    expect(etatCarte(corrige)).toBe('erreur');
  });

  it('erreur de plafond masquée en mode « tout le revenu », les autres erreurs restent', () => {
    const echec = appliquer(
      etatInitial(),
      { type: 'montant', champ: 'enveloppe', valeur: '' },
      { type: 'montant', champ: 'charges', valeur: 'abc' },
      { type: 'simuler' },
    );
    expect(Object.keys(echec.erreurs?.montants ?? {}).sort()).toEqual(['charges', 'enveloppe']);
    const revenu = reduire(echec, { type: 'mode', mode: 'revenu' });
    expect(Object.keys(erreursAffichees(revenu.erreurs, revenu.saisie)?.montants ?? {})).toEqual(['charges']);
    const retour = reduire(revenu, { type: 'mode', mode: 'enveloppe' });
    expect(Object.keys(erreursAffichees(retour.erreurs, retour.saisie)?.montants ?? {}).sort()).toEqual(['charges', 'enveloppe']);
  });
});

describe('message de total toujours fondé sur la saisie actuelle', () => {
  it('95 puis 90 avant clic : le message reprend 90, jamais l’ancien chiffre', () => {
    const echec = appliquer(etatInitial(), { type: 'poids', poche: 'imprevus', valeur: '5' }, { type: 'simuler' });
    expect(echec.erreurs?.total).toEqual({ code: 'total', total: 95, ecart: -5 });
    const autre = reduire(echec, { type: 'poids', poche: 'imprevus', valeur: '0' });
    expect(erreursAffichees(autre.erreurs, autre.saisie)?.total).toEqual({ code: 'total', total: 90, ecart: -10 });
  });

  it('pourcentage devenu illisible : plus de message de total figé', () => {
    const echec = appliquer(etatInitial(), { type: 'poids', poche: 'imprevus', valeur: '5' }, { type: 'simuler' });
    const illisible = reduire(echec, { type: 'poids', poche: 'imprevus', valeur: 'x' });
    expect(erreursAffichees(illisible.erreurs, illisible.saisie)?.total ?? null).toBeNull();
  });
});
