# Calepio

Landing française de Calepio (direction AD v21, contenus PA v4) avec son simulateur de répartition à cinq poches. Astro + TypeScript strict ; le simulateur est un îlot React.

## Commandes

- `npm ci` : installer les versions du lockfile.
- `npm run dev` : serveur local, généralement http://127.0.0.1:4321.
- `npm run typecheck` : vérifier les types, y compris les fichiers `.astro`.
- `npm run build` : types puis génération statique dans `dist/`.
- `npm run preview` : servir localement le build.
- `npm test` : Vitest (`vitest run`), tests du moteur, des états du simulateur et de son rendu serveur (`src/**/*.test.ts(x)`).

## Conventions Astro utilisées

- **Routes** : chaque fichier de `src/pages/` devient une page. `src/pages/index.astro` produit `/` (`dist/index.html`).
- **Gabarit** : `src/layouts/BaseLayout.astro` porte `<head>` (titre, description, `noindex` provisoire, icônes, préchargement des polices) et importe les styles globaux.
- **Composants** : `src/components/*.astro` (en-tête, hero, section simulateur, méthode, « Tu gardes la main », FAQ, pied de page, logo). Un `.astro` est rendu en HTML au build ; un `.tsx` est un composant React, rendu au build puis hydraté seulement avec une directive comme `client:load`.
- **Contenus** : les textes sont dans `src/data/landing.ts` (poches, étapes, FAQ, métadonnées). L’identifiant `SIMULATOR_ID` (`simulateur`) est l’ancre stable du simulateur.
- **Styles** : `src/styles/global.css` contient les `@font-face`, les jetons v21 (couleurs, tailles fluides, focus) et quelques classes partagées. Le bloc `<style>` d’un `.astro` est limité à ce composant ; `:global(...)` sert à cibler un élément rendu par un composant enfant.
- **Build ou navigateur** : le bloc entre `---` s’exécute au build, jamais dans le navigateur ; il ne doit pas lire de saisie. Le `<script>` d’un `.astro` est regroupé par Astro et s’exécute dans le navigateur (ici : commande pause / reprise / rejouer du hero). Tout ce qui doit être lisible sans JavaScript (méthode, limites, exemple fictif, FAQ) est dans le HTML statique.
- **`public/`** : copié tel quel dans `dist/`. N’y mettre que des actifs de diffusion choisis.

## Simulateur

### Séparation moteur / interface

- `src/lib/budget/` : TypeScript pur, sans Astro ni React. `montant.ts` (lecture des montants → centimes), `poids.ts` (pourcentages entiers), `validation.ts` (saisie texte → entrée typée ou erreurs par champ), `calcul.ts` (répartition, résultat `financable` ou `manque`), `format.ts` (affichage fr-FR), `messages.ts` (textes d’erreur). Tout est en centimes entiers : avec les bornes (999 999,99 € par champ, poids ≤ 100), le plus grand produit vaut environ 1e10, très en deçà de `Number.MAX_SAFE_INTEGER` ; le moteur vérifie ses entrées et l’invariant `charges + poches + reste d’arrondi + surplus = revenus`.
- `src/components/simulateur/etat.ts` : états du simulateur en fonctions pures (`reduire`, `etatCarte`), testables sans navigateur.
- `src/components/Simulateur.tsx` (formulaire) et `src/components/simulateur/CarteResultat.tsx` (résultat) : affichage seulement, styles dans `simulateur/simulateur.css` (jetons de `global.css`).
- `src/components/SectionSimulateur.astro` : section `#simulateur`, titre, message sans JavaScript, méthode en HTML statique, et l’îlot.

### Hydratation (`client:load`)

Astro rend l’îlot en HTML au build : l’exemple fictif (1 000 € de revenus, enveloppe 400 €, 75 € de charges, 40/20/15/15/10) y est déjà calculé par le moteur. `client:load` charge ensuite React dès l’ouverture de la page et « hydrate » ce HTML : React s’y attache et rend le formulaire interactif. Choix plutôt que `client:visible`, car la section suit directement le hero et son bouton y mène. Tant que l’hydratation n’a pas eu lieu (ou sans JavaScript), le formulaire est dans un `fieldset` désactivé et une balise `<noscript>` l’explique : pas de faux formulaire actif.

### États

- `exemple` : résultat de l’exemple fictif, étiquette « Exemple fictif ».
- Toute modification après un résultat : aucun recalcul ; le résultat est marqué « À actualiser » (`perime`), annoncé une fois, et les saisies ne sont plus attribuées à l’exemple.
- Clic sur « Simuler mon budget » (ou Entrée dans un champ, qui soumet le formulaire) : validation, puis `valide`, `deficit` (manque affiché, aucune allocation) ou `erreur` (aucun résultat courant, message sous chaque champ, `aria-invalid`, focus sur le premier champ fautif).
- « Réinitialiser l’exemple » restaure chiffres, mode, pourcentages et panneaux repliés.
- Annonce : une région live polie (`#sim-annonce`) n’est remplie qu’à la simulation, au passage en « À actualiser » et à la réinitialisation, jamais à chaque frappe.
- Aucun stockage (ni `localStorage`, ni cookie), aucune requête réseau, aucun montant dans l’URL ni dans la console.

### Format de saisie

Montants : chiffres avec au plus deux décimales ; virgule décimale (le point est accepté comme équivalent, pour les claviers qui n’offrent que lui) ; milliers séparés par une espace (normale, insécable ou fine), uniquement par groupes de trois ; « € » final toléré. Refusés : vide, signe moins, plus de deux décimales (donc « 1.000 » est refusé plutôt que deviné), séparateurs mélangés, au-delà de 999 999,99 €. Pourcentages : entiers de 0 à 100, « % » final toléré, total exactement 100, jamais normalisé.

## Accessibilité et mouvement

- Hero : animation CSS unique (400 ms d’attente, trois états, arrêt sur l’état final). `prefers-reduced-motion: reduce` affiche l’état final dès le premier rendu ; le script suit aussi les changements de préférence (`matchMedia`). Hauteur de zone fixe : la suite de la page ne bouge pas.
- FAQ en `<details>/<summary>` : utilisable au clavier et sans JavaScript.
- Focus visible : anneau bleu de 3 px de la charte, cerclé d’un liseré encre de 2 px (le bleu seul contraste à 2,1:1 sur ivoire, sous le seuil WCAG de 3:1) ; cibles tactiles de 44 px minimum.

## Actifs et licences

- Polices auto-hébergées dans `public/fonts/` : Bricolage Grotesque (axes `opsz` + `wght`) et Figtree (`wght`), fichiers variables WOFF2 des paquets npm `@fontsource-variable/bricolage-grotesque` et `@fontsource-variable/figtree` 5.3.0 (source Google Fonts), sous-ensembles latin et latin-ext. Licence SIL OFL 1.1, copiée à côté des fichiers (`OFL-Bricolage-Grotesque.txt`, `OFL-Figtree.txt`). Aucune requête vers Google Fonts.
- `public/favicon.svg` (icône 32 px en adaptation optique) et `public/apple-touch-icon.png` (180 px) : copies des fichiers AD v21 dont le manifeste de provenance C2PA a été retiré (décision de Kelly, 2 octobre 2026) ; dessin et pixels inchangés.
- Logo : tracés de `calepio-logo.svg` (nom vectorisé) intégrés dans `src/components/Logo.astro`. Zone de protection de 0,5 × la hauteur du symbole : règle provisoire, non vérifiée séparément.

PA v4 et AD v21 restent dans le workspace privé voisin, hors dépôt applicatif. Ne pas copier leurs archives, captures, prototype (`support.js`) ou l’historique personnel dans `public/`. Aucun traceur, aucun hébergement ni déploiement configuré.
