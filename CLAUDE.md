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
- Les épisodes, le profil et les **raccourcis** sont **persistés en
  `localStorage`** (voir `src/data/`).
- Les 5 écrans marchent pour de vrai : accueil (jardin évolutif + raccourcis),
  saisie, historique, rapport, profil. Le dashboard et le rapport sont calculés
  à partir des épisodes réellement saisis.
- L'export PDF du rapport utilise l'impression navigateur (`window.print()` +
  styles `@media print`).
- **Nom retenu** : « Pousse » (signature « jour après jour »). Logo dans
  `public/logo.svg`, icône dans `public/icon.svg`. Pour changer de nom (ex.
  Vivace, Flora), chercher « Pousse » dans `index.html` et `src/App.jsx`.
- **Authentification** simple (nom + mot de passe, stockage local, multi-comptes)
  via `src/data/auth.js` et `src/screens/Auth.jsx`.

Ce n'est PAS encore une app de production santé complète : pas de serveur, pas
d'hébergement HDS. C'est le MVP « validation d'usage » voulu (§9).

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
- **Raccourcis rapides** : après saisie, l'utilisateur peut enregistrer un
  raccourci. En accueil, un tap sur le raccourci ouvre un mini-modal intensité
  → épisode créé en ~3 s. Voir §4bis.
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
- **Transitions douces entre contenu et navigation** : header et nav bar en bas
  utilisent `backdrop-filter: blur(20px)` sans `borderTop`/`borderBottom`, avec
  un `box-shadow` très subtil. Un `div` gradient fixe de 28px fait la transition
  entre le contenu scrollable et la nav. L'espacement entre la carte Screen et
  la nav est `navH + 32`.

## 4. Architecture modulaire (le cœur technique)

Toute pathologie réutilise le même **squelette d'épisode** :
`quand → où → intensité → durée → déclencheurs → traitement (+ efficacité différée)`.

Seuls changent le vocabulaire et les « briques » spécifiques. Tout est piloté
par les données dans `src/data/conditions.js`.

**Pour ajouter une pathologie** : ajouter une entrée dans `conditions` avec
`label`, `zones` (suggérées sur la silhouette), `triggers`, `treatment`, et un
`extra` optionnel (brique spécifique : échelle de Bristol pour le SII, aura /
nausée pour la migraine…). Aucun autre fichier à toucher.

## 4bis. Raccourcis rapides

Permettent de sauvegarder un épisode type (pathologie + zones + traitement +
extras) et de le rejouer depuis l'accueil en ne demandant que l'intensité.

**Structure d'un raccourci** :
```js
{ id, label, condition, zones, treatment, extra, customLabel? }
```

**Stockage** : clé `${ns()}.shortcuts.v1` dans localStorage.
- `storage.js` : `loadShortcuts()`, `saveShortcut()`, `removeShortcut()`
- `store.jsx` : expose `shortcuts`, `addShortcut`, `removeShortcut` via contexte

**Flux** :
1. `LogEpisode.jsx` : après sauvegarde, bandeau « Enregistrer comme raccourci ? »
   (Oui/Non). Le label est auto-généré : `Pathologie — Traitement`.
2. `Home.jsx` : chips horizontaux scrollables sous le jardin. Tap → mini-modal
   avec slider intensité (0–10, défaut 5) → `addEpisode()`. Appui long →
   `ConfirmDialog` de suppression.

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
                       print, animations (fadeIn, fadeInUp, scaleIn, slideDown,
                       slideUp, popIn, barGrow, barFillX, logo-*), règles
                       responsive de base (overflow-x, champs)
  data/
    auth.js          → authentification locale (multi-comptes, session)
    conditions.js    → modules de pathologies (voir section 4)
    storage.js       → lecture/écriture localStorage : épisodes, profil,
                       raccourcis + helpers de dates (dayKey, loggedDays,
                       currentStreak, gardenLoggedDays, getCyclePhase)
    store.jsx        → contexte React (StoreProvider/useStore) partageant
                       épisodes, profil, raccourcis + méthodes de mutation
    stats.js         → agrégations (computeStats, buildSeries) à partir des
                       épisodes réels, pour dashboard et rapport
    weather.js       → météo via géolocalisation + Open-Meteo API (cache 5 min)
  components/
    BodySilhouette.jsx → silhouette organique sélectionnable (paths SVG)
    GrowingGarden.jsx  → jardin animé SVG : plantes, ciel dynamique (heure),
                         météo réelle, faune, soleil/lune avec cycle lunaire
                         réel. Palette alignée sur tokens.js (voir §5bis).
    PlanetaryWidget.jsx → widget repères lunaires/planétaires (optionnel)
    ui.jsx             → Screen, ScreenHeader, Chip, Segmented, Toggle,
                         PrimaryButton, StreakBadge, AnimatedNumber,
                         ConfirmDialog, ErrorBoundary, ToastProvider/useToast
  screens/
    Auth.jsx          → écran de connexion / inscription
    Home.jsx          → accueil : jardin, raccourcis, cycle, efficacité,
                         boutons d'action, mini-modal intensité raccourci
    Dashboard.jsx     → historique semaine / mois / année (état vide géré)
    LogEpisode.jsx    → saisie d'un épisode + proposition de raccourci
    Profile.jsx       → genre, cycle, option planétaire (→ updateProfile)
    MedicalReport.jsx → rapport clinique, export PDF via window.print()
  App.jsx             → StoreProvider + navigation par onglets + logo inline
                         + gradient de transition contenu/nav
  main.jsx            → point d'entrée
public/
  logo.svg            → logo complet (symbole + nom)
  icon.svg            → icône d'app / favicon
```

## 5bis. Le jardin qui pousse (fonctionnalité signature de l'accueil)

`GrowingGarden` reçoit le nombre de jours distincts signalés et affiche une
plante par jour (cap visuel à 7, cycle de 7 jours). La maturité progresse :
bourgeon (< 3 j), bouton (3–4 j), fleur (≥ 5 j), toutes en fleurs (≥ 7 j).
C'est le moteur d'engagement émotionnel voulu. Ne pas le remplacer par un
simple compteur.

**Palette du jardin** : toutes les couleurs dérivent des tokens DA
(`src/theme/tokens.js`). L'objet `C` en haut de `GrowingGarden.jsx` mappe :
- Tiges/feuilles → `green.primary`, `green.leaf`, `green.leafLight`
- Sol/herbe → `green.bg`, `green.leafFaint`, `green.leafLight`
- Fleurs → `pink.bg`, `amber.border`, `coral.barStrong`, `green.surface`,
  `sand.bg` + lavande chaude assourdié
- Pollen/sparkle/abeille → `amber.border`, `amber.bg`, `green.surface`
- Ciel → gradients chauds sauge/vert (jour), terre/ambre (crépuscule),
  vert profond (nuit) — **pas de bleu froid**
- Collines/nuages/brouillard → `green.leafFaint`, `green.bg`

**Ne pas** réintroduire de hex froids/bleutés dans le jardin.

**Astres** :
- `CelestialSun` : toujours visible à l'aube/jour, opacité réduite si couvert.
  L'ancien `WeatherSun` a été supprimé.
- `CelestialMoon` : visible au crépuscule/nuit, phase lunaire **réelle**
  calculée via le cycle synodique de 29.53 jours (référence : nouvelle lune du
  6 jan 2000). Rendu SVG avec deux arcs (semicercle + terminateur à courbure
  variable) : nouvelle lune → croissant → quartier → gibbeuse → pleine lune.

**Météo** : `fetchWeather()` (`src/data/weather.js`) utilise la géolocalisation
du navigateur + l'API Open-Meteo (cache 5 min). Types : clear, cloudy, fog,
drizzle, rain, snow, storm. Le champ `isDay` sert à `getTimeOfDay()`.

## 6. Conventions de code

- **Couleurs** : toujours via `import { colors } from '../theme/tokens'`.
  Jamais de hex en dur dans les composants. Exception : `GrowingGarden.jsx`
  utilise un objet `C` local dont les valeurs sont dérivées des tokens
  (documenté en §5bis).
- **Icônes** : Tabler webfont, `<i className="ti ti-nom" aria-hidden="true" />`.
  Les icônes décoratives ont `aria-hidden`, les boutons icône-seule ont un
  `aria-label`.
- **Langue** : toute l'UI est en français.
- **Données** : persistées en `localStorage` via `src/data/storage.js`. Le store
  React (`src/data/store.jsx`) synchronise état mémoire et persistence.
- **Accessibilité** : focus visible et `prefers-reduced-motion` déjà gérés dans
  `global.css`. Garder les `aria-label` sur les SVG interactifs.
- **Animations** : définies dans `global.css` avec classes `.anim-*`. Délais
  via `.anim-d1` à `.anim-d8`. Le jardin SVG a ses propres keyframes inline
  (`pg-plant`, `pg-bloom`, `pg-fadein`).

## 7. Lancer le projet

```bash
npm install
npm run dev      # serveur de dev (Vite), http://localhost:5173
npm run build    # build de production
npm run preview  # prévisualiser le build
```

## 8. Pistes de travail à venir (non encore faites)

Déjà fait : persistance localStorage, page d'accueil avec jardin évolutif,
calcul réel des stats, export PDF par impression, nom + logo, authentification
locale, raccourcis rapides de saisie, jardin avec météo réelle + cycle lunaire,
palette jardin alignée sur la DA.

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
