# Accessibilité

## Clavier et focus

- Le premier Tab mène au lien « Aller au contenu ».
- Tous les contrôles sont atteignables au clavier. Dans le simulateur, Tab entre une seule fois dans le groupe « Budget à répartir », et les flèches ← → changent d’option, comme pour tout groupe de boutons radio.
- **Focus visible** : anneau bleu de 3 px cerclé d’un liseré encre de 2 px. Le bleu seul ne contrastait qu’à environ 2,1:1 sur le fond ivoire, sous le seuil de 3:1 recommandé par WCAG 2.2 (critère 1.4.11) ; avec le liseré, l’indicateur dépasse largement ce seuil. En mode de contraste élevé (`forced-colors`), un contour système prend le relais.
- Les cibles tactiles mesurent au moins 44 px.
- La FAQ utilise `<details>/<summary>` : Entrée ou Espace ouvrent et ferment une question, y compris sans JavaScript.

## Formulaire et annonces

- Chaque champ a un libellé visible et permanent.
- **Erreurs** :
  - le message est placé sous le champ concerné et relié à lui par `aria-describedby`, avec `aria-invalid` ;
  - il ne repose jamais sur la couleur seule : texte, icône « ! » et bordure en pointillés ;
  - le focus va au premier champ fautif.
- **Annonces** : une région `aria-live="polite"` annonce le résumé du résultat, le passage à « À actualiser » et la réinitialisation, jamais à chaque frappe. Le détail poche par poche se lit avec la navigation habituelle du lecteur d’écran.

## Mouvement

- L’animation de l’en-tête est jouée une seule fois en CSS, sans boucle, et peut être mise en pause, reprise ou rejouée.
- Avec `prefers-reduced-motion: reduce`, l’état final est affiché dès le premier rendu, sans animation intermédiaire. Un changement de préférence en cours de visite est pris en compte.
- La hauteur de la zone animée est fixe : la suite de la page ne bouge pas.

## Mise en page

La page reste lisible sans défilement horizontal de 320 à 1 440 px de large, au zoom à 200 % et avec un texte agrandi à 200 %. Dans ce dernier cas, sur un écran de 320 px, des mots longs peuvent être coupés. Pendant l’animation de l’en-tête, les libellés décoratifs des bandes peuvent aussi être rognés quelques secondes.

## Lecteurs d’écran : ce qui a été vérifié

- **VoiceOver sur macOS** : un essai manuel par l’autrice du projet, en octobre 2026. Les points suivants se sont révélés corrects :
  - les libellés des champs et le groupe de boutons radio parcouru aux flèches ;
  - le message d’erreur avec le retour du focus ;
  - les annonces du résultat et de « À actualiser » ;
  - la lecture au curseur VoiceOver des poches, des lignes du résultat et des réponses de la FAQ.
- **Non testés** : NVDA, JAWS, TalkBack et les autres combinaisons de navigateur et de lecteur d’écran.
- Les contrôles automatisés portent sur la structure (libellés, attributs ARIA, ordre de focus, arbre d’accessibilité calculé par Chrome), pas sur la restitution vocale.
