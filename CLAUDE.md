# CLAUDE.md — Contexte du projet « Pousse »

> Ce fichier est lu automatiquement par Claude Code au démarrage. Il résume
> l'origine du projet, les décisions de design, et les conventions à respecter
> pour que le travail reste cohérent. Mets-le à jour quand une décision change.

## 0. État actuel

Application web **fonctionnelle, responsive et déployable** (pas une maquette) :
- **Responsive** : un seul code s'adapte à trois formats via `useBreakpoint`
  (`src/theme/useBreakpoint.jsx`). mobile < 640px, tablette 640–1023px,
  desktop ≥ 1024px. Sur mobile/tablette la navigation est une barre en bas ;
  sur desktop c'est une barre latérale (sidebar) et le contenu passe sur deux
  colonnes là où c'est pertinent (dashboard, saisie). Chaque écran reçoit la
  prop `bp` et l'utilise pour ajuster largeur, colonnes et tailles.
- Les épisodes et le profil sont **persistés en `localStorage`** (voir `src/data/`).
- Les 5 écrans marchent pour de vrai : accueil (jardin évolutif), saisie,
  historique, rapport, profil. Le dashboard et le rapport sont calculés à partir
  des épisodes réellement saisis.
- L'export PDF du rapport utilise l'impression navigateur (`window.print()` +
  styles `@media print`).
- **Nom retenu** : « Pousse » (signature « jour après jour »). Logo dans
  `public/logo.svg`, icône dans `public/icon.svg`. Pour changer de nom (ex.
  Vivace, Flora), chercher « Pousse » dans `index.html` et `src/App.jsx`.

Ce n'est PAS encore une app de production santé complète : pas de compte, pas de
serveur, pas d'hébergement HDS. C'est le MVP « validation d'usage » voulu (§9).

## 1. Le projet en une phrase

Application mobile de **journal de symptômes modulaire** : l'utilisateur note ses
épisodes (douleur, crise) pour une ou plusieurs pathologies chroniques, visualise
son historique, et exporte un **rapport pour son médecin**. Visée startup, domaine
santé / bien-être.

## 2. Origine et raisonnement (résumé de la conversation de conception)

Le concept a été affiné par étapes. Les décisions clés et leur justification :

- **Domaine retenu** : santé / bien-être, avec une visée produit/startup.
- **Concept de base** : un journal de symptômes qui détecte des tendances et
  génère un rapport médecin. La valeur tient à deux choses : une **saisie
  ultra-rapide** (≤ 15 s, sinon les gens abandonnent) et le **rapport médecin**
  comme fonctionnalité signature qui distingue l'app d'un simple carnet.
- **Approche modulaire** (choisie plutôt qu'une app mono-pathologie) : un seul
  moteur d'épisode, des « modules » par pathologie. Voir section 4.
- **Pathologies du MVP** : migraine (tête), SII (digestif), fibromyalgie
  (multi-zones). Choisies pour valider que le moteur gère des zones et des
  mécaniques différentes. Extensions prévues : endométriose, eczéma, asthme,
  arthrose, etc.
- **Stockage local d'abord** (pas de serveur au MVP) : évite la complexité
  réglementaire HDS/RGPD et permet de valider l'usage avant d'investir.
- **Direction artistique « Jardin »** : palette végétale chaleureuse, métaphore
  de croissance (« chaque jour suivi fait pousser une fleur ») comme moteur
  d'engagement respectueux. Issue d'un mix de 3 directions explorées ; on a
  retenu la chaleur du jardin + la visualisation de semaine claire, sans
  mascotte (jugée risquée car potentiellement infantilisante un jour de crise).

## 3. Décisions de design importantes (à ne pas casser)

- **Deux registres visuels distincts et assumés** :
  - Écrans utilisateur (dashboard, saisie, profil) = **DA jardin**, chaleureuse,
    encourageante, motivante.
  - Rapport médecin = **registre clinique sobre**, crédible pour un soignant.
    Pas de métaphore, pas de ton motivant : chiffres, corrélations, efficacité
    des traitements. C'est volontaire — ne pas « jardiniser » le rapport.
- **Saisie en deux modes** : l'essentiel visible (zone, intensité, durée,
  déclencheurs) + un bloc « Plus de détails » replié pour le reste. Objectif :
  valider un épisode en 3 gestes si pressé.
- **Efficacité du traitement en deux temps** : au moment de la crise on ne sait
  pas encore si le médicament agit. L'app propose donc de revenir plus tard
  (notification douce) pour dire s'il a soulagé. Donnée à forte valeur médicale.
- **Cycle menstruel** : proposé uniquement pour le profil « femme ». Lien
  règles/symptômes cliniquement reconnu → va dans le rapport médecin.
- **Repères lunaires & planétaires** : option pour tous les genres, mais
  **DÉSACTIVÉE PAR DÉFAUT** et présentée comme repère personnel **sans valeur
  médicale**. Règle stricte : **ces données n'apparaissent JAMAIS dans le
  rapport médecin**, pour ne pas entamer la crédibilité clinique de l'outil.
  Ne pas changer ce comportement sans raison explicite.

## 4. Architecture modulaire (le cœur technique)

Toute pathologie réutilise le même **squelette d'épisode** :
`quand → où → intensité → durée → déclencheurs → traitement (+ efficacité différée)`.

Seuls changent le vocabulaire et les « briques » spécifiques. Tout est piloté
par les données dans `src/data/conditions.js`.

**Pour ajouter une pathologie** : ajouter une entrée dans `conditions` avec
`label`, `zones` (suggérées sur la silhouette), `triggers`, `treatment`, et un
`extra` optionnel (brique spécifique : échelle de Bristol pour le SII, aura /
nausée pour la migraine…). Aucun autre fichier à toucher.

## 5. Structure des fichiers

```
src/
  theme/
    tokens.js        → SOURCE DE VÉRITÉ des couleurs, rayons, espacements.
                       Toute couleur de l'app vient d'ici. Ne pas hardcoder
                       de hex ailleurs.
    useBreakpoint.jsx → hook responsive : renvoie { bp, isMobile, isTablet,
                       isDesktop }. App.jsx s'en sert pour choisir la mise en
                       page ; chaque écran reçoit `bp` en prop.
    global.css       → reset, focus visible, prefers-reduced-motion, @media
                       print, règles responsive de base (overflow-x, champs)
  data/
    conditions.js    → modules de pathologies (voir section 4)
    storage.js       → lecture/écriture localStorage + helpers de dates
                       (dayKey, loggedDays, currentStreak)
    store.jsx        → contexte React (StoreProvider/useStore) partageant
                       épisodes + profil à toute l'app
    stats.js         → agrégations (computeStats, buildSeries) à partir des
                       épisodes réels, pour dashboard et rapport
  components/
    BodySilhouette.jsx → silhouette organique sélectionnable (paths SVG)
    GrowingGarden.jsx  → le jardin qui pousse : 1 plante par jour signalé,
                         3 paliers de maturité (≥5 j, ≥14 j)
    ui.jsx             → Screen (conteneur responsive ; remplace l'ancien
                         PhoneFrame, conservé en alias), ScreenHeader, Chip,
                         Segmented, Toggle, PrimaryButton, StreakBadge
  screens/
    Home.jsx          → page d'accueil avec le jardin évolutif
    Dashboard.jsx     → historique semaine / mois / année (état vide géré)
    LogEpisode.jsx    → saisie d'un épisode → addEpisode() (persiste vraiment)
    Profile.jsx       → genre, cycle, option planétaire (→ updateProfile)
    MedicalReport.jsx → rapport clinique, export PDF via window.print()
  App.jsx             → StoreProvider + navigation par onglets + logo inline
  main.jsx            → point d'entrée
public/
  logo.svg            → logo complet (symbole + nom)
  icon.svg            → icône d'app / favicon
```

## 5bis. Le jardin qui pousse (fonctionnalité signature de l'accueil)

`GrowingGarden` reçoit le nombre de jours distincts signalés et affiche une
plante par jour (cap visuel à 12). La maturité globale monte par paliers :
bourgeon (< 5 j), feuilles (≥ 5 j), fleurs (≥ 14 j). C'est le moteur d'engagement
émotionnel voulu. Ne pas le remplacer par un simple compteur.

## 6. Conventions de code

- **Couleurs** : toujours via `import { colors } from '../theme/tokens'`.
  Jamais de hex en dur dans les composants (sauf cas isolés déjà commentés).
- **Icônes** : Tabler webfont, `<i className="ti ti-nom" aria-hidden="true" />`.
  Les icônes décoratives ont `aria-hidden`, les boutons icône-seule ont un
  `aria-label`.
- **Langue** : toute l'UI est en français.
- **Données** : actuellement en dur (mock) dans les écrans. Quand on branchera
  la persistance, viser `localStorage` au MVP (cf. décision « stockage local »).
- **Accessibilité** : focus visible et `prefers-reduced-motion` déjà gérés dans
  `global.css`. Garder les `aria-label` sur les SVG interactifs.

## 7. Lancer le projet

```bash
npm install
npm run dev      # serveur de dev (Vite), http://localhost:5173
npm run build    # build de production
npm run preview  # prévisualiser le build
```

## 8. Pistes de travail à venir (non encore faites)

Déjà fait : persistance localStorage, page d'accueil avec jardin évolutif,
calcul réel des stats, export PDF par impression, nom + logo.

Par ordre de valeur estimée :

1. **Notification de second temps** pour l'efficacité du traitement : aujourd'hui
   l'efficacité se saisit seulement au moment de l'épisode. Ajouter une vraie
   relance (les épisodes avec `treatment ≠ Aucun` et `efficacy = null` sont à
   relancer). Sur web : Notifications API ; sur mobile : push natif.
2. **Détail / édition d'un épisode** (liste des épisodes, tap pour rouvrir,
   `editEpisode`/`removeEpisode` existent déjà dans le store).
3. **Vue annuelle en carte de chaleur** (calendrier heatmap) au lieu des barres.
4. **Onboarding** : premier lancement, choix des pathologies suivies et du profil.
5. **Intégration du cycle dans les stats/rapport** : corréler épisodes et phase
   du cycle (les données de cycle sont déjà dans le profil).
6. **PWA** : ajouter un manifest + service worker pour installation sur mobile
   et usage hors-ligne (cohérent avec le stockage local).
7. **Modules supplémentaires** : endométriose, eczéma (brique photo), asthme.
8. **Passage en prod santé réelle** (gros chantier) : comptes, backend chiffré,
   hébergement HDS, RGPD, déploiement stores. Voir §9.

## 9. Garde-fous produit (santé)

- Rester sur du **suivi / restitution de données**, pas de **diagnostic** ni de
  recommandation de traitement → reste dans le « bien-être », évite le statut de
  dispositif médical (marquage CE), bien plus lourd.
- Données de santé = sensibles. Si passage au cloud : hébergement HDS (France),
  consentement clair, chiffrement.
- La confiance est l'actif central : contenu validé médicalement, transparence
  sur les données. C'est aussi pourquoi l'option planétaire est cloisonnée.
