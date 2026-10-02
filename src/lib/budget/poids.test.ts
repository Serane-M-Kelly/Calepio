import { describe, expect, it } from 'vitest';
import { lirePoids, totalPoids } from './poids';

describe('lirePoids', () => {
  it.each([
    ['0', 0],
    ['40', 40],
    ['100', 100],
    [' 15 ', 15],
    ['15 %', 15],
    ['15%', 15],
    ['007', 7],
  ])('« %s » → %i points', (saisie, points) => {
    expect(lirePoids(saisie)).toEqual({ ok: true, points });
  });

  it.each([
    ['', 'vide'],
    ['  ', 'vide'],
    ['abc', 'format'],
    ['1e2', 'format'],
    ['%', 'format'],
    ['-5', 'negatif'],
    ['−5', 'negatif'],
    ['12,5', 'non_entier'],
    ['12.5', 'non_entier'],
    ['101', 'max'],
    ['1000', 'max'],
  ])('« %s » → %s', (saisie, erreur) => {
    expect(lirePoids(saisie)).toEqual({ ok: false, erreur });
  });
});

describe('totalPoids (sans normalisation)', () => {
  const base = { besoins: '40', epargne: '20', envies: '15', projets: '15', imprevus: '10' };

  it('total exact de 100', () => {
    expect(totalPoids(base)).toEqual({ lisible: true, total: 100, ecart: 0 });
  });

  it('total 95 : écart −5', () => {
    expect(totalPoids({ ...base, imprevus: '5' })).toEqual({ lisible: true, total: 95, ecart: -5 });
  });

  it('total 105 : écart +5', () => {
    expect(totalPoids({ ...base, imprevus: '15' })).toEqual({ lisible: true, total: 105, ecart: 5 });
  });

  it('un pourcentage invalide rend le total illisible', () => {
    expect(totalPoids({ ...base, envies: '' })).toEqual({ lisible: false });
  });
});
