# Calepio

Calepio est une page web en français qui aide à préparer un budget mensuel par enveloppes : on réserve d’abord ses charges, puis on répartit le reste entre cinq poches selon ses propres priorités.

**Statut : première version locale.** Le site fonctionne en local et n’est pas publié. C’est un outil personnel et un projet de portfolio, sans compte, sans connexion bancaire et sans enregistrement des données.

## Fonctionnalités

- Page de présentation : méthode en trois gestes, limites de la simulation, questions fréquentes.
- Simulateur de répartition :
  - revenus du mois, puis choix entre « Tout mon revenu » et « Une enveloppe mensuelle » (plafond charges comprises, le reste devient du surplus) ;
  - charges à réserver, au centime près ;
  - cinq poches fixes : Besoins, Épargne, Envies, Projets personnels, Imprévus, avec des pourcentages entiers modifiables (total exactement 100) ;
  - résultat au clic sur « Simuler mon budget » : montant de chaque poche par tranches de 5 €, charges, surplus et reste d’arrondi affichés séparément, détail du calcul repliable ;
  - si les charges dépassent le budget, le montant manquant est indiqué et aucune répartition n’est proposée ;
  - après une modification, le résultat précédent est signalé « À actualiser » jusqu’au prochain clic ;
  - exemple fictif au chargement et bouton « Réinitialiser l’exemple ».

## Limites et données

- La simulation prépare un mois **avant** ses premières dépenses : elle ne tient pas compte des factures déjà payées, des avances, des reports ni d’un suivi des dépenses.
- Calepio ne déplace pas d’argent : les éventuels transferts se font dans sa propre banque.
- Les pourcentages ne sont jamais ajustés automatiquement : s’ils ne totalisent pas 100, la simulation est refusée et l’écart est indiqué.
- **Aucune donnée n’est enregistrée ni envoyée.** Le calcul se fait dans le navigateur ; les montants ne sont ni stockés (pas de cookie, de `localStorage` ni d’autre stockage), ni transmis à un serveur, ni placés dans l’URL. Recharger la page revient à l’exemple fictif. Le site ne charge aucune ressource externe et ne contient aucun traceur.
- La page porte une balise `noindex` : elle n’est pas destinée à être indexée par les moteurs de recherche à ce stade.

## Stack et prérequis

- [Astro](https://astro.build) 7 (site statique) et TypeScript en mode strict.
- [React](https://react.dev) 19 pour le simulateur, chargé comme îlot interactif.
- [Vitest](https://vitest.dev) pour les tests.
- Node.js `^22.12.0`, `^24.0.0` ou `>=26.0.0`, npm `>=9.6.5`.

## Commandes

```bash
npm ci              # installer les dépendances du lockfile
npm run dev         # serveur de développement sur http://127.0.0.1:4321
npm test            # tests Vitest
npm run typecheck   # vérification des types, fichiers .astro compris
npm run build       # vérification des types puis génération statique dans dist/
npm run preview     # servir localement le contenu de dist/
```

Le résultat de `npm run build` est un site entièrement statique (`dist/`), sans serveur applicatif.

## Architecture et tests

- `src/lib/budget/` : moteur de calcul en TypeScript pur, indépendant d’Astro et de React, en centimes entiers.
- `src/components/` : composants Astro de la page et îlot React du simulateur (`Simulateur.tsx`, `simulateur/`).
- `src/data/landing.ts` : textes de la page.
- Tests Vitest : règles de calcul, lecture des saisies, validations, états du simulateur et rendu serveur.

Pour aller plus loin :

- [Architecture](docs/architecture.md) : organisation du code, conventions Astro, hydratation, états du simulateur.
- [Règles de calcul](docs/calcul.md) : répartition, arrondis, format de saisie et bornes.
- [Tests et vérifications](docs/tests.md) : ce qui est testé automatiquement et ce qui a été vérifié autrement.
- [Accessibilité](docs/accessibilite.md) : clavier, focus, mouvement réduit, lecteurs d’écran, limites connues.

## Crédits et licences

- **Polices** : [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) (© 2022 The Bricolage Grotesque Project Authors) et [Figtree](https://github.com/erikdkennedy/figtree) (© 2022 The Figtree Project Authors), sous licence SIL Open Font License 1.1. Fichiers WOFF2 issus des paquets Fontsource, hébergés avec le site ; les textes de licence sont fournis dans [`public/fonts/OFL-Bricolage-Grotesque.txt`](public/fonts/OFL-Bricolage-Grotesque.txt) et [`public/fonts/OFL-Figtree.txt`](public/fonts/OFL-Figtree.txt).
- **Principales dépendances** : Astro, @astrojs/react, React et React DOM, Vitest, @astrojs/check (licence MIT), TypeScript (licence Apache 2.0), selon leurs licences respectives.
- **Logo, icônes et identité visuelle** : non couverts par une licence de réutilisation ; tous droits réservés.
- **Code** : aucune licence n’est encore attribuée à ce dépôt ; en l’absence de licence, tous droits sont réservés par défaut.
