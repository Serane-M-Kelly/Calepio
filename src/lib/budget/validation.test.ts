import { describe, expect, it } from 'vitest';
import { formaterEuros, formaterPourcentage } from './format';
import { descriptionEcart, messageErreurMontant, messageErreurTotal } from './messages';
import { LIBELLES_POCHES, POCHES } from './poches';
import { nombreErreurs, validerSaisie, type SaisieBudget } from './validation';
import { pockets } from '../../data/landing';

const SAISIE: SaisieBudget = {
  revenus: '1 000',
  mode: 'enveloppe',
  enveloppe: '402,40',
  charges: '75',
  poids: { besoins: '40', epargne: '20', envies: '15', projets: '15', imprevus: '10' },
};

describe('validerSaisie', () => {
  it('saisie valide → entrée en centimes, poids entiers', () => {
    const v = validerSaisie(SAISIE);
    expect(v).toEqual({
      ok: true,
      entree: {
        revenus: 100_000,
        mode: 'enveloppe',
        enveloppe: 40_240,
        charges: 7_500,
        poids: { besoins: 40, epargne: 20, envies: 15, projets: 15, imprevus: 10 },
      },
    });
  });

  it('mode « tout le revenu » : le plafond n’est ni lu ni validé', () => {
    const v = validerSaisie({ ...SAISIE, mode: 'revenu', enveloppe: 'n’importe quoi' });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.entree.enveloppe).toBeNull();
  });

  it('mode enveloppe : plafond vide refusé', () => {
    const v = validerSaisie({ ...SAISIE, enveloppe: '' });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.erreurs.montants).toEqual({ enveloppe: 'vide' });
  });

  it('erreurs rattachées à chaque champ', () => {
    const v = validerSaisie({
      ...SAISIE,
      revenus: '',
      enveloppe: '-3',
      charges: '1 000 000',
      poids: { ...SAISIE.poids, envies: '12,5', imprevus: 'x' },
    });
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.erreurs.montants).toEqual({ revenus: 'vide', enveloppe: 'negatif', charges: 'max' });
    expect(v.erreurs.poids).toEqual({ envies: 'non_entier', imprevus: 'format' });
    expect(v.erreurs.total).toBeNull(); // total non calculable tant qu'un poids est illisible
    expect(nombreErreurs(v.erreurs)).toBe(5);
  });

  it.each([
    ['5', 95, -5],
    ['15', 105, 5],
  ])('total %s → %i : erreur d’écart, pas d’entrée de calcul', (imprevus, total, ecart) => {
    const v = validerSaisie({ ...SAISIE, poids: { ...SAISIE.poids, imprevus } });
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.erreurs.total).toEqual({ code: 'total', total, ecart });
    expect(v.erreurs.poids).toEqual({});
    expect(nombreErreurs(v.erreurs)).toBe(1);
  });

  it('aucune normalisation : 33/33/33/0/0 reste refusé (99)', () => {
    const v = validerSaisie({ ...SAISIE, poids: { besoins: '33', epargne: '33', envies: '33', projets: '0', imprevus: '0' } });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.erreurs.total?.ecart).toBe(-1);
  });

  it('borne exacte 999 999,99 acceptée dans les trois champs', () => {
    const v = validerSaisie({ ...SAISIE, revenus: '999 999,99', enveloppe: '999 999,99', charges: '999 999,99' });
    expect(v.ok).toBe(true);
  });

  it('trop de décimales refusé', () => {
    const v = validerSaisie({ ...SAISIE, charges: '75,001' });
    expect(!v.ok && v.erreurs.montants.charges).toBe('decimales');
  });
});

describe('formatage et messages', () => {
  it('euros fr-FR, centimes seulement s’ils existent', () => {
    expect(formaterEuros(32_500)).toBe('325 €');
    expect(formaterEuros(240)).toBe('2,40 €');
    expect(formaterEuros(59_760)).toBe('597,60 €');
    expect(formaterEuros(5)).toBe('0,05 €');
    expect(formaterEuros(0)).toBe('0 €');
    expect(formaterEuros(100_000)).toBe('1 000 €');
    expect(formaterEuros(99_999_999)).toBe('999 999,99 €');
    expect(() => formaterEuros(1.5)).toThrow(RangeError);
  });

  it('pourcentages', () => {
    expect(formaterPourcentage(40)).toBe('40 %');
  });

  it('messages d’écart sans correction automatique', () => {
    expect(descriptionEcart(-5)).toBe('Il manque 5 points.');
    expect(descriptionEcart(1)).toBe('1 point en trop.');
    expect(messageErreurTotal({ code: 'total', total: 105, ecart: 5 })).toContain('105 %');
    expect(messageErreurMontant('max')).toContain('999 999,99');
  });

  it('les poches du moteur suivent l’ordre et les libellés de la landing', () => {
    expect(pockets.map((p) => p.id)).toEqual([...POCHES]);
    expect(pockets.map((p) => p.label)).toEqual(POCHES.map((p) => LIBELLES_POCHES[p]));
  });
});
