# Indicateurs socio-économiques du Togo (2000–2023)

Analyse de données complète sur 7 indicateurs de la Banque Mondiale :
PIB par habitant (PPA), population, pénétration mobile, utilisateurs
d'internet, accès à l'électricité, chômage et mortalité des moins de 5 ans.

## Méthode

Chaîne de traitement classique d'un projet d'analyse de données :

1. **Collecte** — API publique de la Banque Mondiale
   (`api.worldbank.org`, sans clé). Un repli automatique sur des CSV
   publics (Our World in Data / datasets) est prévu si l'API est
   injoignable : `python analyse_togo.py --source owid`.
2. **Nettoyage** — restriction 2000–2023, conversion numérique,
   interpolation limitée aux petites lacunes (≤ 2 années), exclusion
   des séries à couverture < 80 %.
3. **Analyse** — variations totales, taux de croissance moyen annuel
   (TCMA), matrice de corrélations (Pearson).
4. **Restitution** — 3 graphiques + rapport texte.

## Reproduire

```bash
pip install pandas matplotlib
python analyse_togo.py
```

Sorties : `togo_indicateurs_clean.csv`, `graphique_1..3.png`,
`rapport_analyse.txt`.

## Principaux résultats (exécution 2026, source : API Banque Mondiale)

| Indicateur | 2000 | 2023 | Variation | TCMA |
|---|---|---|---|---|
| Mobile (abonnements/100 hab.) | 1 | 76 | +7 691 % | +20,9 %/an |
| Internet (utilisateurs, %) | 1 % | 38 % | ×39 | +18,2 %/an |
| Accès à l'électricité (%) | 17 % | 59 % | +248 % | +5,6 %/an |
| Mortalité < 5 ans (‰ naissances) | 119 | 58 | −51 % | −3,1 %/an |
| Population totale | 4,8 M | 8,2 M | +72 % | +2,4 %/an |
| PIB/habitant, PPA ($) | 2 322 | 3 216 | +38 % | +1,4 %/an |

**Lecture** : sur la période, le Togo a connu une révolution numérique
(mobile et internet) et des progrès sociaux majeurs (mortalité infantile
divisée par deux, électrification triplée), tandis que la croissance du
PIB par habitant restait modeste (+1,4 %/an en moyenne). Les fortes
corrélations observées (électricité ↔ mortalité infantile : r = −0,99 ;
mobile ↔ électrification : r = +0,97) traduisent une modernisation
globale concomitante — des séries temporelles corrélées sur tendance ne
prouvent pas une causalité, mais dessinent un portrait cohérent du
développement du pays.

## Auteur

Kpatchil Urbain — [portfolio](https://maskdataec.github.io/MonPortofolio/)
