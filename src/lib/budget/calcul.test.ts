import { describe, expect, it } from 'vitest';
import {
  calculerRepartition,
  EntreeInvalide,
  repartirDisponible,
  TRANCHE_CENTIMES,
  type EntreeBudget,
  type ResultatBudget,
  type ResultatFinancable,
} from './calcul';
import { MONTANT_MAX_CENTIMES } from './montant';
import { POCHES, parPoche, type ParPoche } from './poches';

/** Euros (nombre décimal du test) → centimes entiers. */
const c = (euros: number) => Math.round(euros * 100);

const POIDS_EXEMPLE: ParPoche<number> = { besoins: 40, epargne: 20, envies: 15, projets: 15, imprevus: 10 };

function poids(...valeurs: number[]): ParPoche<number> {
  return parPoche((_, i) => valeurs[i] ?? 0);
}

function enveloppe(r: number, e: number, ch: number, p = POIDS_EXEMPLE): EntreeBudget {
  return { revenus: c(r), mode: 'enveloppe', enveloppe: c(e), charges: c(ch), poids: p };
}

function toutLeRevenu(r: number, ch: number, p = POIDS_EXEMPLE): EntreeBudget {
  return { revenus: c(r), mode: 'revenu', enveloppe: null, charges: c(ch), poids: p };
}

function financable(resultat: ResultatBudget): ResultatFinancable {
  if (resultat.type !== 'financable') throw new Error(`Résultat finançable attendu, reçu ${resultat.type}`);
  return resultat;
}

function allocationsEuros(resultat: ResultatFinancable): number[] {
  return POCHES.map((poche) => resultat.allocations[poche] / 100);
}

function conservation(r: ResultatFinancable): number {
  return r.charges + r.totalReparti + r.reliquat + r.surplus;
}

describe('exemples obligatoires UX_FLOWS (poids 40/20/15/15/10)', () => {
  it('R=1000, E=400, C=75 : 130/65/50/50/30, reliquat 0, surplus 600', () => {
    const r = financable(calculerRepartition(enveloppe(1000, 400, 75)));
    expect(r.budget).toBe(c(400));
    expect(r.disponible).toBe(c(325));
    expect(allocationsEuros(r)).toEqual([130, 65, 50, 50, 30]);
    expect(r.totalReparti).toBe(c(325));
    expect(r.reliquat).toBe(0);
    expect(r.surplus).toBe(c(600));
    expect(conservation(r)).toBe(r.revenus);
  });

  it('R=1000, E=402,40, C=75 : mêmes poches, reliquat 2,40, surplus 597,60', () => {
    const r = financable(calculerRepartition(enveloppe(1000, 402.4, 75)));
    expect(r.disponible).toBe(32_740);
    expect(allocationsEuros(r)).toEqual([130, 65, 50, 50, 30]);
    expect(r.reliquat).toBe(240);
    expect(r.surplus).toBe(59_760);
    expect(conservation(r)).toBe(r.revenus);
  });

  it('R=1000, tout le revenu, C=75 : 370/185/140/140/90, surplus et reliquat 0', () => {
    const r = financable(calculerRepartition(toutLeRevenu(1000, 75)));
    expect(r.budget).toBe(c(1000));
    expect(r.disponible).toBe(c(925));
    expect(allocationsEuros(r)).toEqual([370, 185, 140, 140, 90]);
    expect(r.surplus).toBe(0);
    expect(r.reliquat).toBe(0);
  });

  it('R=300, E=400, C=75 : B=300, 90/45/35/35/20, surplus et reliquat 0', () => {
    const r = financable(calculerRepartition(enveloppe(300, 400, 75)));
    expect(r.budget).toBe(c(300));
    expect(allocationsEuros(r)).toEqual([90, 45, 35, 35, 20]);
    expect(r.surplus).toBe(0);
    expect(r.reliquat).toBe(0);
  });

  it('R=50, E=400, C=75 : manque 25, aucune allocation', () => {
    const r = calculerRepartition(enveloppe(50, 400, 75));
    expect(r.type).toBe('manque');
    if (r.type !== 'manque') return;
    expect(r.manque).toBe(c(25));
    expect(r.budget).toBe(c(50));
    expect(r.surplus).toBe(0);
    expect('allocations' in r).toBe(false);
    expect('reliquat' in r).toBe(false);
  });

  it('R=0, C=0 : tout à zéro (deux modes)', () => {
    for (const entree of [toutLeRevenu(0, 0), enveloppe(0, 0, 0), enveloppe(0, 400, 0)]) {
      const r = financable(calculerRepartition(entree));
      expect(allocationsEuros(r)).toEqual([0, 0, 0, 0, 0]);
      expect([r.budget, r.disponible, r.totalReparti, r.reliquat, r.surplus, r.charges]).toEqual([0, 0, 0, 0, 0, 0]);
    }
  });

  it('0 < D < 5 € : allocations nulles, D entièrement en reliquat', () => {
    for (const d of [1, 240, 499]) {
      const r = financable(calculerRepartition({ ...toutLeRevenu(0, 75), revenus: c(75) + d }));
      expect(r.disponible).toBe(d);
      expect(allocationsEuros(r)).toEqual([0, 0, 0, 0, 0]);
      expect(r.reliquat).toBe(d);
      expect(r.surplus).toBe(0);
    }
  });

  it('poids totalisant 95 ou 105 : refusés par le moteur (aucun résultat)', () => {
    expect(() => calculerRepartition(toutLeRevenu(1000, 75, poids(40, 20, 15, 15, 5)))).toThrow(EntreeInvalide);
    expect(() => calculerRepartition(toutLeRevenu(1000, 75, poids(40, 20, 15, 15, 15)))).toThrow(EntreeInvalide);
  });
});

describe('cas limites', () => {
  it('charges égales au budget : disponible nul, pas de manque', () => {
    const r = financable(calculerRepartition(enveloppe(1000, 400, 400)));
    expect(r.disponible).toBe(0);
    expect(r.totalReparti).toBe(0);
    expect(r.surplus).toBe(c(600));
  });

  it('manque avec surplus : le surplus reste exact et distinct', () => {
    const r = calculerRepartition(enveloppe(1000, 50, 75));
    expect(r.type).toBe('manque');
    if (r.type !== 'manque') return;
    expect(r.manque).toBe(c(25));
    expect(r.surplus).toBe(c(950));
  });

  it('manque d’un centime', () => {
    const r = calculerRepartition({ ...toutLeRevenu(0, 0), revenus: 7_499, charges: 7_500 });
    expect(r.type === 'manque' && r.manque).toBe(1);
  });

  it('centimes conservés : charges et surplus non arrondis', () => {
    const r = financable(calculerRepartition(enveloppe(1234.56, 999.99, 123.45)));
    expect(r.charges).toBe(12_345);
    expect(r.surplus).toBe(23_457);
    expect(r.disponible).toBe(87_654);
    expect(r.reliquat).toBe(87_654 % 500);
    expect(conservation(r)).toBe(r.revenus);
  });

  it('poids nul : jamais de tranche', () => {
    const r = financable(calculerRepartition(toutLeRevenu(1000, 0, poids(0, 0, 0, 0, 100))));
    expect(allocationsEuros(r)).toEqual([0, 0, 0, 0, 1000]);
    const r2 = financable(calculerRepartition(toutLeRevenu(9.99, 0, poids(50, 0, 50, 0, 0))));
    expect(allocationsEuros(r2)).toEqual([5, 0, 0, 0, 0]);
    expect(r2.reliquat).toBe(499);
  });

  it('égalité de restes : ordre stable Besoins, Épargne, Envies, Projets, Imprévus', () => {
    const egal = poids(20, 20, 20, 20, 20);
    expect(allocationsEuros(financable(calculerRepartition(toutLeRevenu(5, 0, egal))))).toEqual([5, 0, 0, 0, 0]);
    expect(allocationsEuros(financable(calculerRepartition(toutLeRevenu(10, 0, egal))))).toEqual([5, 5, 0, 0, 0]);
    expect(allocationsEuros(financable(calculerRepartition(toutLeRevenu(20, 0, egal))))).toEqual([5, 5, 5, 5, 0]);
    // Égalité entre Projets et Imprévus seulement : Projets d'abord.
    expect(allocationsEuros(financable(calculerRepartition(toutLeRevenu(10, 0, poids(0, 0, 0, 50, 50)))))).toEqual([0, 0, 0, 5, 5]);
    expect(allocationsEuros(financable(calculerRepartition(toutLeRevenu(5, 0, poids(0, 0, 0, 50, 50)))))).toEqual([0, 0, 0, 5, 0]);
    expect(allocationsEuros(financable(calculerRepartition(toutLeRevenu(5, 0, poids(0, 0, 0, 0, 100)))))).toEqual([0, 0, 0, 0, 5]);
  });

  it('plus grand reste prioritaire même s’il vient plus loin dans l’ordre', () => {
    // D = 10 €, 2 tranches : parts théoriques 3 / 1 / 1 / 1 / 4 € → Imprévus puis Besoins.
    const r = financable(calculerRepartition(toutLeRevenu(10, 0, poids(30, 10, 10, 10, 40))));
    expect(allocationsEuros(r)).toEqual([5, 0, 0, 0, 5]);
  });

  it('les pourcentages du résultat sont ceux saisis, jamais modifiés', () => {
    const p = poids(33, 33, 33, 1, 0);
    const r = calculerRepartition(toutLeRevenu(1000, 75, p));
    expect(r.poids).toEqual(p);
  });

  it('bornes maximales : arithmétique entière exacte', () => {
    expect(Number.isSafeInteger(MONTANT_MAX_CENTIMES * 100)).toBe(true);
    const r = financable(
      calculerRepartition({ revenus: MONTANT_MAX_CENTIMES, mode: 'revenu', enveloppe: null, charges: 0, poids: poids(33, 33, 33, 1, 0) }),
    );
    expect(conservation(r)).toBe(MONTANT_MAX_CENTIMES);
    expect(r.reliquat).toBe(MONTANT_MAX_CENTIMES % 500);
  });

  it('refuse les entrées hors contrat', () => {
    const base = toutLeRevenu(100, 0);
    expect(() => calculerRepartition({ ...base, revenus: -1 })).toThrow(EntreeInvalide);
    expect(() => calculerRepartition({ ...base, revenus: 1.5 })).toThrow(EntreeInvalide);
    expect(() => calculerRepartition({ ...base, revenus: MONTANT_MAX_CENTIMES + 1 })).toThrow(EntreeInvalide);
    expect(() => calculerRepartition({ ...base, charges: Number.NaN })).toThrow(EntreeInvalide);
    expect(() => calculerRepartition({ ...base, mode: 'enveloppe', enveloppe: null })).toThrow(EntreeInvalide);
    expect(() => calculerRepartition({ ...base, poids: poids(40.5, 19.5, 15, 15, 10) })).toThrow(EntreeInvalide);
    expect(() => calculerRepartition({ ...base, poids: poids(-10, 30, 40, 30, 10) })).toThrow(EntreeInvalide);
  });

  it('en mode « tout le revenu », une enveloppe transmise est ignorée', () => {
    const r = financable(calculerRepartition({ ...toutLeRevenu(1000, 75), enveloppe: c(400) }));
    expect(r.budget).toBe(c(1000));
    expect(r.enveloppe).toBeNull();
  });
});

/** Générateur pseudo-aléatoire déterministe (LCG 32 bits, graine fixe). */
function generateur(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (Math.imul(etat, 1_664_525) + 1_013_904_223) >>> 0;
    return etat / 2 ** 32;
  };
}

function poidsAleatoires(alea: () => number): ParPoche<number> {
  // Quatre coupures dans [0, 100] → cinq entiers ≥ 0 de total 100 (zéros fréquents).
  const coupures = [0, 100, ...Array.from({ length: 4 }, () => Math.floor(alea() * 101))].sort((a, b) => a - b);
  const valeurs = coupures.slice(1).map((v, i) => v - (coupures[i] ?? 0));
  return poids(...valeurs);
}

function verifierProprietes(disponible: number, p: ParPoche<number>): void {
  const { allocations, reliquat } = repartirDisponible(disponible, p);
  const somme = POCHES.reduce((s, poche) => s + allocations[poche], 0);
  expect(reliquat).toBe(disponible % TRANCHE_CENTIMES);
  expect(somme + reliquat).toBe(disponible);
  for (const poche of POCHES) {
    const a = allocations[poche];
    expect(a % TRANCHE_CENTIMES).toBe(0);
    if (p[poche] === 0) expect(a).toBe(0);
    // À moins d'une tranche de la part théorique (comparaison entière × 100).
    expect(Math.abs(a * 100 - disponible * p[poche])).toBeLessThan(TRANCHE_CENTIMES * 100);
    // Jamais en dessous du plancher théorique.
    expect(a).toBeGreaterThanOrEqual(Math.floor((disponible * p[poche]) / 50_000) * 500);
  }
  // Plus grands restes : toute poche servie en plus a un reste ≥ celui de toute poche non servie.
  const reste = (poche: (typeof POCHES)[number]) => (disponible * p[poche]) % 50_000;
  const servies = POCHES.filter((poche) => allocations[poche] > Math.floor((disponible * p[poche]) / 50_000) * 500);
  const nonServies = POCHES.filter((poche) => p[poche] > 0 && !servies.includes(poche));
  for (const s of servies) for (const n of nonServies) expect(reste(s)).toBeGreaterThanOrEqual(reste(n));
}

describe('invariants', () => {
  it('exhaustif : tout disponible de 0 à 60 € au centime, plusieurs jeux de poids', () => {
    const jeux = [POIDS_EXEMPLE, poids(20, 20, 20, 20, 20), poids(33, 33, 33, 1, 0), poids(0, 0, 0, 0, 100), poids(1, 2, 3, 4, 90)];
    for (const p of jeux) for (let d = 0; d <= 6_000; d += 1) verifierProprietes(d, p);
  });

  it('pseudo-aléatoire déterministe : 20 000 entrées complètes, conservation exacte', () => {
    const alea = generateur(20_261_002);
    const tirage = () => {
      // Mélange de petites et grandes valeurs, bornes comprises.
      const forme = alea();
      if (forme < 0.05) return 0;
      if (forme < 0.1) return MONTANT_MAX_CENTIMES;
      if (forme < 0.5) return Math.floor(alea() * 300_000);
      return Math.floor(alea() * (MONTANT_MAX_CENTIMES + 1));
    };
    let financables = 0;
    let manques = 0;
    for (let i = 0; i < 20_000; i += 1) {
      const mode = alea() < 0.5 ? 'revenu' : 'enveloppe';
      const entree: EntreeBudget = {
        revenus: tirage(),
        mode,
        enveloppe: mode === 'enveloppe' ? tirage() : null,
        charges: alea() < 0.5 ? Math.floor(alea() * 200_000) : tirage(),
        poids: poidsAleatoires(alea),
      };
      const r = calculerRepartition(entree);
      const budget = entree.enveloppe === null ? entree.revenus : Math.min(entree.revenus, entree.enveloppe);
      expect(r.budget).toBe(budget);
      expect(r.surplus).toBe(entree.revenus - budget);
      expect(r.charges).toBe(entree.charges);
      if (r.type === 'financable') {
        financables += 1;
        expect(conservation(r)).toBe(entree.revenus);
        verifierProprietes(r.disponible, entree.poids);
      } else {
        manques += 1;
        expect(r.manque).toBe(entree.charges - budget);
        expect(r.manque).toBeGreaterThan(0);
      }
    }
    expect(financables).toBeGreaterThan(1_000);
    expect(manques).toBeGreaterThan(1_000);
  });
});
