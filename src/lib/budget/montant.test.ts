import { describe, expect, it } from 'vitest';
import { lireMontant, MONTANT_MAX_CENTIMES } from './montant';

const ok = (centimes: number) => ({ ok: true, centimes });
const ko = (erreur: string) => ({ ok: false, erreur });

describe('lireMontant : formats acceptés', () => {
  it.each([
    ['0', 0],
    ['75', 7_500],
    ['1000', 100_000],
    ['1 000', 100_000],
    ['1 000', 100_000], // espace insécable
    ['1 000', 100_000], // espace fine insécable
    ['1 000', 100_000], // espace fine
    ['1 000,50', 100_050],
    ['402,40', 40_240],
    ['402,4', 40_240],
    ['402.40', 40_240],
    ['0,5', 50],
    ['0,05', 5],
    ['  75  ', 7_500],
    ['75 €', 7_500],
    ['75€', 7_500],
    ['007', 700],
    ['345 678', 34_567_800],
    ['12 345,67', 1_234_567],
    ['999 999,99', 99_999_999],
    ['999999,99', 99_999_999],
  ])('« %s » → %i centimes', (saisie, centimes) => {
    expect(lireMontant(saisie)).toEqual(ok(centimes));
  });

  it('la borne exacte vaut 999 999,99 €', () => {
    expect(MONTANT_MAX_CENTIMES).toBe(99_999_999);
    expect(Number.isSafeInteger(MONTANT_MAX_CENTIMES * 100)).toBe(true);
  });
});

describe('lireMontant : saisies refusées', () => {
  it.each([
    ['', 'vide'],
    ['   ', 'vide'],
    [' ', 'vide'],
    ['€', 'format'],
    ['abc', 'format'],
    ['12a', 'format'],
    ['1e3', 'format'],
    ['+12', 'format'],
    [',50', 'format'],
    ['12,', 'format'],
    ['12.', 'format'],
    ['1 000.000,5', 'format'],
    ['1.000,50', 'format'],
    ['1,000,50', 'format'],
    ['10 00', 'format'],
    ['1 0000', 'format'],
    ['Infinity', 'format'],
    ['NaN', 'format'],
    ['-5', 'negatif'],
    ['−5', 'negatif'],
    ['- 12,50', 'negatif'],
    ['-0', 'negatif'],
    ['-abc', 'format'],
    ['1,234', 'decimales'],
    ['1.000', 'decimales'],
    ['0,001', 'decimales'],
    ['1 000 000', 'max'],
    ['1000000', 'max'],
    ['999 999,999', 'decimales'],
    ['00000001000000', 'max'],
    ['99999999999999999999', 'max'],
  ])('« %s » → %s', (saisie, erreur) => {
    expect(lireMontant(saisie)).toEqual(ko(erreur));
  });

  it('refuse un centime au-delà de la borne', () => {
    expect(lireMontant('1 000 000,00')).toEqual(ko('max'));
  });
});
