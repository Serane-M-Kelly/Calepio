# Règles de calcul

Tout le calcul se fait en **centimes entiers** dans `src/lib/budget/calcul.ts`.

## Notations

- `R` : revenus du mois.
- `E` : montant de l’enveloppe (plafond, charges comprises), en mode « Une enveloppe mensuelle ».
- `C` : charges à réserver.

## Étapes

1. **Budget retenu** `B` : en mode enveloppe, `B = min(R, E)` ; en mode « Tout mon revenu », `B = R`.
2. **Surplus** `S = R − B` : la part des revenus laissée hors de l’enveloppe, non répartie.
3. **Manque** : si `C > B`, le manque vaut `C − B`. Aucune poche n’est remplie, et rien ne présente des charges non financées comme payées.
4. **Disponible** `D = B − C`, à répartir entre les cinq poches.
5. **Répartition par tranches de 5 €** (500 centimes) :
   - pour chaque poche, la part théorique `D × pourcentage / 100` est arrondie au multiple de 500 centimes inférieur ;
   - les tranches de 500 centimes encore disponibles vont aux poches qui ont les plus grands restes théoriques ;
   - en cas d’égalité, l’ordre d’affichage départage : Besoins, Épargne, Envies, Projets personnels, Imprévus ;
   - une poche à 0 % ne reçoit jamais rien.
6. **Reste d’arrondi** `D mod 500` : moins de 5 €, distinct du surplus, à conserver soi-même.

Les charges et le surplus restent exacts au centime. Pour tout résultat sans manque :

```text
C + somme des poches + reste d’arrondi + S = R
```

Le moteur vérifie cette égalité à chaque calcul et refuse toute entrée hors limites.

## Exemple

Pourcentages 40 / 20 / 15 / 15 / 10, revenus 1 000 €, enveloppe 402,40 €, charges 75 € :

- budget retenu 402,40 €, surplus 597,60 € ;
- disponible 327,40 € ;
- poches 130 / 65 / 50 / 50 / 30 €, reste d’arrondi 2,40 €.

## Format de saisie

- **Montants** :
  - chiffres avec au plus deux décimales ;
  - virgule décimale, le point étant accepté comme équivalent ;
  - milliers séparés par une espace (normale, insécable ou fine), uniquement par groupes de trois ;
  - « € » final toléré.
- **Montants refusés** :
  - champ vide ;
  - signe moins ;
  - plus de deux décimales, donc « 1.000 » est refusé plutôt que deviné ;
  - séparateurs mélangés ;
  - montant au-delà de 999 999,99 €.
- **Pourcentages** : entiers de 0 à 100, « % » final toléré. Le total doit valoir exactement 100 et n’est jamais normalisé.

## Bornes et exactitude

Avec au plus 99 999 999 centimes par champ et des pourcentages de 100 au plus, le plus grand produit intermédiaire vaut environ 10¹⁰. C’est très en deçà de `Number.MAX_SAFE_INTEGER` : l’arithmétique entière de JavaScript reste exacte, sans `BigInt`.
