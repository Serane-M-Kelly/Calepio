# Architecture

Calepio est un site statique Astro. Une seule route (`/`) est pré-rendue au build ; le simulateur est un îlot React hydraté dans le navigateur.

## Organisation

```text
src/
  pages/index.astro          route « / » : assemble les sections
  layouts/BaseLayout.astro   <head> : titre, description, noindex, icônes, préchargement des polices
  components/                sections de la page (.astro) et simulateur (.tsx)
    SectionSimulateur.astro  section #simulateur : titre, message sans JavaScript, méthode statique, îlot
    Simulateur.tsx           formulaire du simulateur (React)
    simulateur/              carte de résultat, états purs, styles du simulateur
  data/landing.ts            textes de la page (poches, étapes, FAQ, métadonnées)
  lib/budget/                moteur de calcul (TypeScript pur)
  styles/global.css          polices, couleurs, tailles fluides, focus, classes partagées
public/                      fichiers copiés tels quels : polices et licences, icônes
```

## Conventions Astro utilisées

- **Routes** : chaque fichier de `src/pages/` devient une page. `src/pages/index.astro` produit `/` (`dist/index.html`).
- **Composants** : un fichier `.astro` est rendu en HTML au build. Un fichier `.tsx` est un composant React, rendu au build puis rendu interactif seulement avec une directive comme `client:load`.
- **Styles** : le bloc `<style>` d’un `.astro` ne s’applique qu’à ce composant ; `:global(...)` cible un élément rendu par un composant enfant. Les variables partagées (couleurs, tailles, anneau de focus) sont dans `src/styles/global.css`.
- **Build ou navigateur** : le bloc entre `---` en tête d’un `.astro` s’exécute au build, jamais dans le navigateur. Le `<script>` d’un `.astro` est regroupé par Astro et s’exécute dans le navigateur (ici : commande pause / reprise / rejouer de l’animation d’en-tête).
- **Contenu sans JavaScript** : la méthode, les limites, l’exemple fictif et la FAQ sont dans le HTML statique.
- **`public/`** : copié tel quel dans `dist/` ; n’y placer que des fichiers destinés à être servis.

## Moteur et interface du simulateur

- `src/lib/budget/` ne dépend ni d’Astro ni de React :
  - `montant.ts` lit les montants saisis et les convertit en centimes ;
  - `poids.ts` lit les pourcentages entiers et calcule leur total ;
  - `validation.ts` transforme la saisie texte en entrée typée, ou en erreurs par champ ;
  - `calcul.ts` calcule la répartition (résultat `financable` ou `manque`) ;
  - `format.ts` et `messages.ts` produisent les montants et messages affichés.
- `src/components/simulateur/etat.ts` décrit les états du simulateur en fonctions pures (`reduire`, `etatCarte`, `erreursAffichees`), testables sans navigateur.
- `Simulateur.tsx` et `simulateur/CarteResultat.tsx` ne font qu’afficher ; leurs styles sont dans `simulateur/simulateur.css`.

Les règles de calcul sont détaillées dans [calcul.md](calcul.md).

## Hydratation (`client:load`)

Au build, Astro rend l’îlot en HTML avec l’exemple fictif déjà calculé par le moteur (1 000 € de revenus, enveloppe de 400 €, 75 € de charges, pourcentages 40/20/15/15/10). `client:load` charge ensuite React dès l’ouverture de la page et « hydrate » ce HTML : React s’y attache et rend le formulaire interactif. Ce choix plutôt que `client:visible` tient à la position de la section, juste après l’en-tête, que le bouton principal cible directement.

Avant l’hydratation, ou si JavaScript est désactivé, le formulaire est dans un `fieldset` désactivé et une balise `<noscript>` l’explique : aucun faux formulaire actif.

## États du simulateur

- `exemple` : résultat de l’exemple fictif, avec l’étiquette « Exemple fictif ».
- Toute modification après un résultat : aucun recalcul. Le résultat est marqué « À actualiser » (`perime`), annoncé une fois, et n’est plus attribué à l’exemple.
- Clic sur « Simuler mon budget » ou touche Entrée dans un champ : validation, puis l’un des états suivants :
  - `valide` ;
  - `deficit` : manque affiché, aucune allocation ;
  - `erreur` : aucun résultat courant, message sous chaque champ, `aria-invalid`, focus sur le premier champ fautif.
- Entre deux clics, les messages affichés suivent la saisie actuelle : une erreur devenue sans objet disparaît, un écart de total reprend le total courant. Une nouvelle saisie invalide n’est signalée qu’au clic suivant.
- « Réinitialiser l’exemple » restaure les montants, le mode, les pourcentages et les panneaux repliés.
- La région `#sim-annonce` (`aria-live="polite"`) n’est remplie qu’à la simulation, au passage en « À actualiser » et à la réinitialisation, jamais à chaque frappe.
- Aucun stockage, aucune requête réseau, aucun montant dans l’URL ni dans la console.
