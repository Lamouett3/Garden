// =============================================================
// Modules de pathologies
// Chaque pathologie réutilise le même squelette d'épisode
// (quand / où / intensité / durée / déclencheurs / traitement).
// Seuls le vocabulaire et les "briques" spécifiques changent.
// Pour ajouter une pathologie : ajouter une entrée ici, rien d'autre.
// =============================================================

export const conditions = {
  migraine: {
    label: 'Migraine',
    zones: ['tete'],              // zones suggérées sur la silhouette
    triggers: ['Sommeil', 'Stress', 'Règles', 'Aliment', 'Météo', 'Écran'],
    treatment: 'Triptan',
    // brique spécifique optionnelle (affichée dans "Plus de détails")
    extra: {
      label: 'Symptômes associés',
      options: ['Aura', 'Nausée', 'Photophobie'],
    },
  },
  sii: {
    label: 'SII',
    zones: ['abdomen'],
    triggers: ['Aliment gras', 'Stress', 'Lactose', 'Gluten', 'Caféine'],
    treatment: 'Antispasmodique',
    extra: {
      label: 'Selles (échelle de Bristol)',
      options: ['Dure', 'Normale', 'Molle', 'Liquide'],
    },
  },
  fibro: {
    label: 'Fibro',
    zones: ['torse', 'brasG', 'brasD', 'jambeG', 'jambeD'],
    triggers: ['Sommeil', 'Stress', 'Effort', 'Froid'],
    treatment: 'Antalgique',
    extra: {
      label: 'Autres',
      options: ['Raideur matinale', 'Fatigue intense'],
    },
  },
}

export const conditionKeys = Object.keys(conditions)

// Niveaux d'efficacité du traitement (renseignés en second temps)
export const efficacyLevels = ['Pas encore', 'Un peu', 'Bien']

// Durées proposées
export const durations = ['<1h', '2-4h', '½ jour', '+1j']
