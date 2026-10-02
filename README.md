# Calepio

Landing française de Calepio (direction AD v21, contenus PA v4). Astro + TypeScript strict ; React est prévu pour le simulateur (phase 2). La zone `#simulateur` est pour l’instant un emplacement provisoire « En préparation » : aucun champ, aucun calcul.

## Commandes

- `npm ci` : installer les versions du lockfile.
- `npm run dev` : serveur local, généralement http://127.0.0.1:4321.
- `npm run typecheck` : vérifier les types, y compris les fichiers `.astro`.
- `npm run build` : types puis génération statique dans `dist/`.
- `npm run preview` : servir localement le build.
- `npm test` : Vitest, pour les futurs tests métier. Aucun test n’existe encore : la commande échoue, elle ne simule pas un succès.

## Conventions Astro utilisées

- **Routes** : chaque fichier de `src/pages/` devient une page. `src/pages/index.astro` produit `/` (`dist/index.html`).
- **Gabarit** : `src/layouts/BaseLayout.astro` porte `<head>` (titre, description, `noindex` provisoire, icônes, préchargement des polices) et importe les styles globaux.
- **Composants** : `src/components/*.astro` (en-tête, hero, simulateur provisoire, méthode, « Tu gardes la main », FAQ, pied de page, logo). Un `.astro` est rendu en HTML au build ; un `.tsx` sera un composant React, hydraté seulement avec une directive comme `client:load`.
- **Contenus** : les textes sont dans `src/data/landing.ts` (poches, étapes, FAQ, métadonnées). L’identifiant `SIMULATOR_ID` (`simulateur`) est l’ancre stable du futur simulateur.
- **Styles** : `src/styles/global.css` contient les `@font-face`, les jetons v21 (couleurs, tailles fluides, focus) et quelques classes partagées. Le bloc `<style>` d’un `.astro` est limité à ce composant ; `:global(...)` sert à cibler un élément rendu par un composant enfant.
- **Build ou navigateur** : le bloc entre `---` s’exécute au build, jamais dans le navigateur ; il ne doit pas lire de saisie. Le `<script>` d’un `.astro` est regroupé par Astro et s’exécute dans le navigateur (ici : commande pause / reprise / rejouer du hero). Tout ce qui doit être lisible sans JavaScript (méthode, poches, FAQ) est dans le HTML statique.
- **`public/`** : copié tel quel dans `dist/`. N’y mettre que des actifs de diffusion choisis.

## Accessibilité et mouvement

- Hero : animation CSS unique (400 ms d’attente, trois états, arrêt sur l’état final). `prefers-reduced-motion: reduce` affiche l’état final dès le premier rendu ; le script suit aussi les changements de préférence (`matchMedia`). Hauteur de zone fixe : la suite de la page ne bouge pas.
- FAQ en `<details>/<summary>` : utilisable au clavier et sans JavaScript.
- Focus visible : anneau bleu de 3 px de la charte, cerclé d’un liseré encre de 2 px (le bleu seul contraste à 2,1:1 sur ivoire, sous le seuil WCAG de 3:1) ; cibles tactiles de 44 px minimum.

## Actifs et licences

- Polices auto-hébergées dans `public/fonts/` : Bricolage Grotesque (axes `opsz` + `wght`) et Figtree (`wght`), fichiers variables WOFF2 des paquets npm `@fontsource-variable/bricolage-grotesque` et `@fontsource-variable/figtree` 5.3.0 (source Google Fonts), sous-ensembles latin et latin-ext. Licence SIL OFL 1.1, copiée à côté des fichiers (`OFL-Bricolage-Grotesque.txt`, `OFL-Figtree.txt`). Aucune requête vers Google Fonts.
- `public/favicon.svg` (icône 32 px en adaptation optique) et `public/apple-touch-icon.png` (180 px) : copies des fichiers AD v21 dont le manifeste de provenance C2PA a été retiré (décision de Kelly, 2 octobre 2026) ; dessin et pixels inchangés.
- Logo : tracés de `calepio-logo.svg` (nom vectorisé) intégrés dans `src/components/Logo.astro`. Zone de protection de 0,5 × la hauteur du symbole : règle provisoire, non vérifiée séparément.

PA v4 et AD v21 restent dans le workspace privé voisin, hors dépôt applicatif. Ne pas copier leurs archives, captures, prototype (`support.js`) ou l’historique personnel dans `public/`. Aucun traceur, aucun hébergement ni déploiement configuré.
