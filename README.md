# Calepio — socle local

Astro + TypeScript strict, React pour le futur simulateur. La page actuelle est un contrôle d’intégration temporaire ; ce n’est pas la landing v21 ou le simulateur.

- `npm ci` : installer les versions du lockfile.
- `npm run dev` : serveur local, généralement http://127.0.0.1:4321.
- `npm run typecheck` : vérifier les types, y compris les fichiers Astro.
- `npm run build` : types puis génération statique dans `dist/`.
- `npm run preview` : servir localement le build.
- `npm test` : Vitest, pour les futurs tests métier. Aucun test métier n’existe encore ; sans tests cette commande échoue, elle ne simule pas un succès.

Conventions : `src/pages/` crée les routes ; `src/components/` contient les composants ; `.astro` pré-rend le HTML, `.tsx` définit React ; `client:load` hydrate le composant React. Les scripts du bloc entre `---` s’exécutent lors du build, pas dans le navigateur : ne pas y lire les saisies du simulateur. `public/` pourra accueillir seulement les actifs de diffusion sélectionnés. Le calcul métier TypeScript restera indépendant de React et d’Astro.

PA v4 et AD v21 sont conservés dans le workspace privé voisin, hors dépôt applicatif. Ne pas copier leurs archives ou l’historique personnel dans `public/`. Les conventions seront expliquées au fil du développement. Aucun hébergement ni déploiement configuré.
