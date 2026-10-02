/**
 * Rendu serveur de l'îlot (ce que contient le HTML statique avant hydratation).
 * Le comportement interactif est couvert par etat.test.ts et par les contrôles navigateur.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Simulateur from './Simulateur';

const html = renderToStaticMarkup(<Simulateur />);

describe('Simulateur : rendu avant hydratation', () => {
  it('formulaire désactivé tant que React n’a pas pris la main', () => {
    expect(html).toMatch(/<fieldset class="sim-formulaire__cadre" disabled="">/);
    expect(html).toContain('data-pret="non"');
  });

  it('exemple fictif calculé par le moteur', () => {
    expect(html).toContain('data-etat="exemple"');
    expect(html).toContain('Résultat · exemple fictif');
    expect(html).toContain('Exemple fictif');
    for (const centimes of [32_500, 13_000, 6_500, 5_000, 3_000, 7_500, 60_000]) {
      expect(html).toContain(`data-centimes="${centimes}"`);
    }
  });

  it('champs étiquetés, plafond affiché en mode enveloppe, aucune erreur initiale', () => {
    for (const id of ['sim-revenus', 'sim-enveloppe', 'sim-charges', 'sim-poids-besoins', 'sim-poids-imprevus']) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).not.toContain('aria-invalid');
    expect(html).toContain('value="1 000"');
  });

  it('panneaux repliés, région live présente et vide', () => {
    expect(html).toMatch(/aria-controls="sim-panneau-poids" aria-expanded="false"|aria-expanded="false" aria-controls="sim-panneau-poids"/);
    expect(html).toMatch(/id="sim-panneau-poids" hidden=""/);
    expect(html).toMatch(/<p class="sr-only" aria-live="polite" id="sim-annonce"><\/p>/);
  });

  it('aide Besoins reliée au champ', () => {
    expect(html).toMatch(/id="sim-poids-besoins"[^>]*aria-describedby="sim-aide-besoins sim-poids-total"/);
  });
});
