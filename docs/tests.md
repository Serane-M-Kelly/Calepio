# Tests et vérifications

## Tests automatisés du dépôt

`npm test` lance Vitest sur `src/**/*.test.ts(x)` :

- `src/lib/budget/calcul.test.ts` :
  - exemples de référence de la répartition ;
  - cas limites : zéro, disponible inférieur à 5 €, manque, pourcentage nul, égalités de restes, centimes ;
  - parcours exhaustif des disponibles de 0 à 60 € au centime ;
  - 20 000 entrées pseudo-aléatoires à graine fixe, avec vérification de l’égalité de conservation.
- `montant.test.ts` et `poids.test.ts` : formats de saisie acceptés et refusés, bornes, absence de normalisation.
- `validation.test.ts` : transformation de la saisie en entrée de calcul ou en erreurs par champ.
- `src/components/simulateur/etat.test.ts` :
  - transitions d’état : exemple, « À actualiser », valide, déficit, erreur, réinitialisation ;
  - erreurs affichées après correction.
- `src/components/Simulateur.test.tsx` : rendu serveur du simulateur et de l’exemple fictif.

`npm run typecheck` (`astro check`) vérifie les types de tous les fichiers, `.astro` compris. `npm run build` l’exécute avant de générer le site.

## Vérifications faites hors de ce dépôt

Ces contrôles ont été faits sur la première version locale, mais leurs outils ne sont pas inclus dans le dépôt.

- **Navigateur** : contrôles dans Chrome avec des scripts Playwright. Ils couvrent :
  - le parcours complet du simulateur et tous ses états ;
  - le clavier et le contraste de l’anneau de focus ;
  - les largeurs de 320 à 1 440 px, le zoom à 200 % et le texte agrandi à 200 % ;
  - la préférence de mouvement réduit, au chargement et en cours de visite ;
  - l’absence de stockage, de requête externe, d’envoi et de montant dans l’URL ;
  - l’arbre d’accessibilité calculé par Chrome : rôles et noms des contrôles.
- **Build distribué** : inspection de `dist/` (aucune ressource externe ni API de stockage ou d’envoi, `noindex` présent, contenus clés dans le HTML statique).
- **Essais manuels** : un essai réel de plusieurs scénarios (budget courant, revenu inférieur au plafond, reste d’arrondi, déficit, résultat à actualiser) et un essai avec VoiceOver ont été faits par l’autrice du projet. Voir [accessibilite.md](accessibilite.md) pour leur portée.

## Limites

- Il n’y a pas de tests DOM simulés (jsdom) : l’interaction React est couverte par les tests des états purs et par les contrôles dans Chrome décrits ci-dessus.
- Les contrôles navigateur n’étant pas dans le dépôt, ils ne sont pas rejouables tels quels par un tiers.
- Les retours d’usage proviennent d’une seule personne, l’autrice du projet : la compréhension par d’autres utilisateurs n’a pas été vérifiée.
