# -*- coding: utf-8 -*-
"""
Analyse des indicateurs socio-économiques du Togo (2000–2023)
================================================================
Sources de données (au choix, sélection automatique) :

  • API publique de la Banque Mondiale (api.worldbank.org) — source
    primaire, pas de clé requise.
  • Miroirs CSV publics (Our World in Data / datasets) — repli
    automatique si l'API est injoignable (réseau restreint, etc.).

Chaîne de traitement :
  1. Collecte    — API Banque Mondiale, sinon CSV de repli
  2. Nettoyage   — restriction 2000-2023, conversion numérique,
                   interpolation des petites lacunes (max 2 années),
                   exclusion des séries trop incomplètes (< 80 %)
  3. Analyse     — variations totales, taux de croissance moyen annuel
                   (TCMA), corrélations entre indicateurs
  4. Restitution — 3 graphiques (PNG) + rapport texte chiffré

Sorties (dossier courant) :
  - togo_indicateurs_clean.csv    — tableau propre (format long)
  - graphique_1_pib_population.png
  - graphique_2_numerique_infra.png
  - graphique_3_correlations.png
  - rapport_analyse.txt           — synthèse des résultats

Usage :
  python analyse_togo.py              # source auto : API puis repli
  python analyse_togo.py --source api
  python analyse_togo.py --source owid
"""

import argparse
import io
import json
import sys
import urllib.request

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------

PAYS = "TGO"
PAYS_NOM = "Togo"
DEBUT, FIN = 2000, 2023

# (libellé, code API Banque Mondiale, slug CSV de repli OWID)
INDICATEURS = [
    ("PIB / habitant, PPA ($ int.)", "NY.GDP.PCAP.PP.KD", "gdp-per-capita-worldbank"),
    ("Population totale",            "SP.POP.TOTL",       "__datasets_pop__"),
    ("Mobile (abonnements / 100 hab.)", "IT.CEL.SETS.P2", "mobile-cellular-subscriptions-per-100-people"),
    ("Internet, utilisateurs (%)",   "IT.NET.USER.ZS",    "share-of-individuals-using-the-internet"),
    ("Accès à l'électricité (%)",    "EG.ELC.ACCS.ZS",    "share-of-the-population-with-access-to-electricity"),
    ("Chômage (%)",                  "SL.UEM.TOTL.ZS",    "unemployment-rate"),
    ("Mortalité < 5 ans (pour 1000 naissances)", "SH.DYN.MORT", "child-mortality"),
]

FAMILLES = {
    "PIB / habitant, PPA ($ int.)": "Économie",
    "Chômage (%)": "Économie",
    "Population totale": "Démographie",
    "Mobile (abonnements / 100 hab.)": "Numérique",
    "Internet, utilisateurs (%)": "Numérique",
    "Accès à l'électricité (%)": "Infrastructure",
    "Mortalité < 5 ans (pour 1000 naissances)": "Santé",
}

UA = {"User-Agent": "Mozilla/5.0 (analyse-portfolio)"}


def _get(url, timeout=25):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as rep:
        return rep.read().decode("utf-8")


# ------------------------------------------------------------------
# 1. COLLECTE — deux sources interchangeables
# ------------------------------------------------------------------

def collecter_api(code):
    """Série [(année, valeur)] via l'API Banque Mondiale."""
    url = (f"https://api.worldbank.org/v2/country/{PAYS}/indicator/{code}"
           f"?date={DEBUT}:{FIN}&format=json&per_page=100")
    donnees = json.loads(_get(url))
    if len(donnees) < 2 or donnees[1] is None:
        return []
    return [(int(d["date"]), float(d["value"]))
            for d in donnees[1] if d["value"] is not None]


def _wb_code_vers_owid(code):
    """NY.GDP.PCAP.PP.KD -> ny_gdp_pcap_pp_kd (convention OWID)."""
    return code.lower().replace(".", "_")


def collecter_owid(slug, code_api):
    """Série [(année, valeur)] via les CSV publics de repli."""
    if slug == "__datasets_pop__":
        txt = _get("https://raw.githubusercontent.com/datasets/population/master/data/population.csv")
        df = pd.read_csv(io.StringIO(txt))
        s = df[df["Country Code"] == PAYS][["Year", "Value"]]
        return [(int(a), float(v)) for a, v in s.itertuples(index=False)]
    url = f"https://ourworldindata.org/grapher/{slug}.csv?v=1&csvType=full&useColumnShortNames=true"
    df = pd.read_csv(io.StringIO(_get(url)))
    col = _wb_code_vers_owid(code_api)
    if col not in df.columns:
        col = df.columns[-1]          # dernière colonne de valeur disponible
    df = df[df["code"] == PAYS][["year", col]].dropna()
    return [(int(a), float(v)) for a, v in df.itertuples(index=False)]


def collecter(source, libelle, code, slug):
    points = []
    erreur = None
    if source in ("auto", "api"):
        try:
            points = collecter_api(code)
            if points:
                return points, "API Banque Mondiale"
        except Exception as e:        # réseau, timeout, HTTP…
            erreur = e
    if source in ("auto", "owid"):
        try:
            points = collecter_owid(slug, code)
            if points:
                return points, "miroir CSV (OWID/datasets)"
        except Exception as e:
            erreur = erreur or e
    if erreur:
        print(f"  ! {libelle} : échec de collecte ({erreur})", file=sys.stderr)
    return points, None


# ------------------------------------------------------------------
# 2. NETTOYAGE
# ------------------------------------------------------------------

def nettoyer(registre):
    df = pd.DataFrame(registre)
    large = df.pivot(index="annee", columns="indicateur", values="valeur").sort_index()
    large = large.reindex(range(DEBUT, FIN + 1))

    couverture = large.notna().mean()
    gardees = couverture[couverture >= 0.8].index
    retirees = [c for c in large.columns if c not in gardees]
    large = large[gardees].interpolate(limit=2, limit_area="inside")

    clean = (large.reset_index()
             .melt(id_vars="annee", var_name="indicateur", value_name="valeur")
             .dropna(subset=["valeur"]))
    clean["famille"] = clean["indicateur"].map(FAMILLES)
    clean = clean.dropna(subset=["valeur"]).sort_values(["indicateur", "annee"])
    return clean, large, retirees


# ------------------------------------------------------------------
# 3. ANALYSE
# ------------------------------------------------------------------

def tcma(v1, v2, n):
    """Taux de croissance moyen annuel (%), insensible aux valeurs nulles."""
    if v1 and v1 > 0 and n > 0 and v2 and v2 > 0:
        return ((v2 / v1) ** (1 / n) - 1) * 100
    return float("nan")


def analyser(large):
    lignes = []
    for col in large.columns:
        serie = large[col].dropna()
        if len(serie) < 5:
            continue
        v1, v2 = serie.iloc[0], serie.iloc[-1]
        n = serie.index[-1] - serie.index[0]
        lignes.append({
            "indicateur": col,
            "debut": f"{serie.index[0]} : {v1:,.0f}".replace(",", " "),
            "fin": f"{serie.index[-1]} : {v2:,.0f}".replace(",", " "),
            "variation": (v2 / v1 - 1) * 100 if v1 else float("nan"),
            "tcma": tcma(v1, v2, n),
        })
    return pd.DataFrame(lignes)


# ------------------------------------------------------------------
# 4. RESTITUTION
# ------------------------------------------------------------------

CYAN = "#0891b2"
GRIS = "#94a3b8"
BLEU = "#1e3a5f"


def styliser():
    plt.rcParams.update({
        "font.size": 10, "axes.spines.top": False, "axes.spines.right": False,
        "axes.grid": True, "grid.alpha": 0.25, "grid.linestyle": "--",
        "figure.dpi": 150, "axes.titlesize": 11,
    })


def graph1(large):
    pib = "PIB / habitat, PPA ($ int.)"
    pib = pib.replace("habitat", "habitant")
    if pib not in large.columns or "Population totale" not in large.columns:
        return
    fig, ax1 = plt.subplots(figsize=(8, 4.5))
    ax2 = ax1.twinx()
    ax2.grid(False)
    ax1.plot(large.index, large[pib], color=CYAN, lw=2.2, marker="o", ms=3.5)
    ax1.set_ylabel("PIB / habitant, PPA ($)", color=CYAN)
    ax1.tick_params(axis="y", labelcolor=CYAN)
    ax2.plot(large.index, large["Population totale"] / 1e6, color=GRIS, lw=1.8)
    ax2.set_ylabel("Population (millions)", color=GRIS)
    ax2.tick_params(axis="y", labelcolor=GRIS)
    ax1.set_title(f"{PAYS_NOM} — PIB par habitant et population ({DEBUT}–{FIN})",
                  loc="left", fontweight="bold")
    ax1.set_xlabel("Année")
    fig.tight_layout()
    fig.savefig("graphique_1_pib_population.png", bbox_inches="tight")
    plt.close(fig)


def graph2(large):
    cles = ["Internet, utilisateurs (%)", "Mobile (abonnements / 100 hab.)",
            "Accès à l'électricité (%)"]
    candidats = [c for c in cles if c in large.columns]
    if not candidats:
        return
    fig, ax = plt.subplots(figsize=(8, 4.5))
    couleurs = [CYAN, BLEU, GRIS]
    for col, coul in zip(candidats, couleurs):
        ax.plot(large.index, large[col], color=coul, lw=2, label=col)
    ax.set_title(f"{PAYS_NOM} — Numérique et infrastructure ({DEBUT}–{FIN})",
                 loc="left", fontweight="bold")
    ax.set_xlabel("Année")
    ax.set_ylabel("% / pour 100 habitants")
    ax.legend(frameon=False, fontsize=9)
    fig.tight_layout()
    fig.savefig("graphique_2_numerique_infra.png", bbox_inches="tight")
    plt.close(fig)


def graph3(corr):
    if corr is None or corr.shape[0] < 4:
        return
    fig, ax = plt.subplots(figsize=(7.5, 6))
    im = ax.imshow(corr.values, cmap="RdBu_r", vmin=-1, vmax=1)
    ax.set_xticks(range(len(corr.columns)))
    ax.set_yticks(range(len(corr.columns)))
    etiquettes = [c.split(" (")[0] for c in corr.columns]
    ax.set_xticklabels(etiquettes, rotation=38, ha="right", fontsize=8)
    ax.set_yticklabels(etiquettes, fontsize=8)
    for i in range(len(corr)):
        for j in range(len(corr)):
            v = corr.values[i, j]
            ax.text(j, i, f"{v:.2f}", ha="center", va="center", fontsize=7,
                    color="white" if abs(v) > 0.6 else "black")
    ax.set_title(f"{PAYS_NOM} — Corrélations entre indicateurs",
                 loc="left", fontweight="bold")
    ax.grid(False)
    fig.colorbar(im, shrink=0.8, label="r de Pearson")
    fig.tight_layout()
    fig.savefig("graphique_3_correlations.png", bbox_inches="tight")
    plt.close(fig)


# ------------------------------------------------------------------
# Orchestration
# ------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--source", choices=["auto", "api", "owid"], default="auto")
    args = ap.parse_args()

    print(f"Collecte des indicateurs du {PAYS_NOM} ({DEBUT}–{FIN}), source : {args.source}…")
    registre, sources = [], {}
    for libelle, code, slug in INDICATEURS:
        points, src = collecter(args.source, libelle, code, slug)
        if points:
            src = src or "inconnue"
            sources[src] = sources.get(src, 0) + 1
            print(f"  {libelle:<46} {len(points):>3} obs.  ({src})")
            for annee, valeur in points:
                registre.append({"annee": annee, "indicateur": libelle,
                                 "famille": FAMILLES[libelle], "valeur": valeur})
    if not registre:
        sys.exit("Aucune donnée collectée — vérifiez la connexion réseau.")

    clean, large, retirees = nettoyer(registre)
    if retirees:
        print(f"\nSéries exclues (couverture < 80 %) : {', '.join(retires)}")
    clean.to_csv("togo_indicateurs_clean.csv", index=False)
    print(f"\nTableau propre : {len(clean)} observations, "
          f"{clean['indicateur'].nunique()} indicateurs → togo_indicateurs_clean.csv")

    stats = analyser(large)
    corr = large.corr() if large.shape[1] >= 4 else None

    # Rapport texte
    lignes = [
        f"ANALYSE DES INDICATEURS SOCIO-ÉCONOMIQUES DU {PAYS_NOM.upper()} ({DEBUT}–{FIN})",
        "=" * 76,
        "Sources : " + " ; ".join(f"{s} ({n} indicateurs)" for s, n in sources.items()),
        f"Après nettoyage : {len(clean)} observations, "
        f"{clean['indicateur'].nunique()} indicateurs",
        "",
        "VARIATIONS ET TAUX DE CROISSANCE MOYEN ANNUEL (TCMA)",
        "-" * 76,
    ]
    for _, l in stats.iterrows():
        lignes.append(f"{l['indicateur']:<46} {l['debut']:<18} → {l['fin']:<18} "
                      f"variation {l['variation']:+8.1f} %   TCMA {l['tcma']:+6.2f} %/an")
    if corr is not None:
        lignes += ["", "CORRÉLATIONS LES PLUS MARQUÉES (Pearson)", "-" * 76]
        paires = sorted(((abs(corr.loc[a, b]), corr.loc[a, b], a, b)
                         for i, a in enumerate(corr.columns)
                         for b in corr.columns[i + 1:]), reverse=True)
        for _, r, a, b in paires[:6]:
            lignes.append(f"r = {r:+.2f}   {a}  ↔  {b}")
    rapport = "\n".join(lignes)
    with open("rapport_analyse.txt", "w", encoding="utf-8") as f:
        f.write(rapport + "\n")
    print("\n" + rapport)

    styliser()
    graph1(large)
    graph2(large)
    graph3(corr)
    print("\nGraphiques : graphique_1_pib_population.png, graphique_2_numerique_infra.png, "
          "graphique_3_correlations.png")


if __name__ == "__main__":
    main()
