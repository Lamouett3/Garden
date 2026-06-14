// =============================================================
// Jardin — Design tokens
// Source de vérité unique pour toute la direction artistique.
// Modifier une couleur ici la propage partout dans l'app.
// =============================================================

export const colors = {
  // Verts — couleur d'identité, action, croissance
  green: {
    bg: '#E7EFE8',        // fond d'écran
    surface: '#FBFBF6',   // carte principale (blanc cassé chaud)
    soft: '#EEF4EF',      // surfaces secondaires douces
    softer: '#E1EEE3',    // pastilles
    primary: '#5A8262',   // vert d'action (boutons)
    primaryDark: '#3F6B49',
    leaf: '#7FB089',      // barres "jour calme"
    leafLight: '#B8D6BD',
    leafFaint: '#DCEADF',
  },
  // Textes
  text: {
    title: '#2E4034',     // titres
    body: '#3A4A3E',      // corps
    muted: '#5A6B5E',     // labels
    soft: '#7A8B7E',      // hints
    faint: '#9DAFA1',     // mentions discrètes
  },
  // Accents fonctionnels
  amber: {
    bg: '#FBF1DA',        // zones suggérées, épisode léger
    border: '#E9B85E',
    text: '#9A6F2E',
    bar: '#E9B85E',
  },
  coral: {
    barStrong: '#D98A5A', // épisode fort
  },
  pink: {
    bg: '#F3C8D2',        // zone de douleur active sur la silhouette
    border: '#D4537E',
  },
  // Surfaces neutres chaudes (cartes de stats)
  sand: {
    bg: '#F3F0E9',
    text: '#8A8576',
    faint: '#A8A294',
  },
  // Bleu info (insights, encarts médicaux)
  info: {
    bg: '#F0F4F7',
    text: '#2B4A7A',
    accent: '#2E5BC4',
  },
  // Bordures
  border: {
    soft: '#D6E0D8',
    leaf: '#7FB089',
  },
  // Rapport médecin — registre clinique sobre
  clinical: {
    bg: '#ECEEEA',
    surface: '#FFFFFF',
    border: '#E0E2DD',
    surfaceSoft: '#F4F6F2',
    ink: '#1F2A22',       // "encre" du document
  },
}

export const radius = {
  sm: '10px',
  md: '14px',
  lg: '16px',
  xl: '18px',
  card: '28px',          // grands coins arrondis des écrans
  pill: '20px',
}

export const shadow = {
  xs: '0 1px 2px rgba(0,0,0,0.04)',
  sm: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 2px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
  lg: '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  xl: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)',
  button: '0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  buttonHover: '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)',
  card: '0 1px 4px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.03)',
  nav: '0 -2px 12px rgba(0,0,0,0.06)',
  sidebar: '2px 0 12px rgba(0,0,0,0.04)',
}

export const spacing = {
  xs: '6px',
  sm: '8px',
  md: '14px',
  lg: '18px',
  xl: '22px',
}

export const font = {
  family: "'Nunito', system-ui, -apple-system, sans-serif",
}

// Largeur du cadre mobile simulé
export const PHONE_WIDTH = 300
