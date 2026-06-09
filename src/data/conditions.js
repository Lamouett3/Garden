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
    zones: ['tete'],
    triggers: ['Sommeil', 'Stress', 'Regles', 'Aliment', 'Meteo', 'Ecran'],
    treatment: 'Triptan',
    extra: {
      label: 'Symptomes associes',
      options: ['Aura', 'Nausee', 'Photophobie'],
    },
  },
  maux_de_tete: {
    label: 'Maux de tete',
    zones: ['tete'],
    triggers: ['Stress', 'Fatigue', 'Ecran', 'Deshydratation', 'Sommeil', 'Meteo'],
    treatment: 'Paracetamol',
    extra: {
      label: 'Type de douleur',
      options: ['Tension', 'Pression', 'Pulsatile', 'En etau'],
    },
  },
  sii: {
    label: 'SII',
    zones: ['abdomen'],
    triggers: ['Aliment gras', 'Stress', 'Lactose', 'Gluten', 'Cafeine'],
    treatment: 'Antispasmodique',
    extra: {
      label: 'Selles (echelle de Bristol)',
      options: ['Dure', 'Normale', 'Molle', 'Liquide'],
    },
  },
  fibro: {
    label: 'Fibromyalgie',
    zones: ['torse', 'brasG', 'brasD', 'jambeG', 'jambeD'],
    triggers: ['Sommeil', 'Stress', 'Effort', 'Froid'],
    treatment: 'Antalgique',
    extra: {
      label: 'Autres',
      options: ['Raideur matinale', 'Fatigue intense'],
    },
  },
  endometriose: {
    label: 'Endometriose',
    zones: ['abdomen'],
    triggers: ['Regles', 'Stress', 'Effort', 'Rapports'],
    treatment: 'Antalgique',
    extra: {
      label: 'Symptomes associes',
      options: ['Crampes', 'Nausee', 'Fatigue', 'Saignements anormaux'],
    },
  },
  eczema: {
    label: 'Eczema',
    zones: ['brasG', 'brasD', 'jambeG', 'jambeD', 'torse'],
    triggers: ['Stress', 'Allergene', 'Chaleur', 'Produit chimique', 'Aliment'],
    treatment: 'Corticoide local',
    extra: {
      label: 'Aspect',
      options: ['Plaques rouges', 'Suintement', 'Croutes', 'Secheresse'],
    },
  },
  asthme: {
    label: 'Asthme',
    zones: ['torse'],
    triggers: ['Effort', 'Allergene', 'Froid', 'Pollution', 'Stress'],
    treatment: 'Bronchodilatateur',
    extra: {
      label: 'Symptomes',
      options: ['Sifflement', 'Toux seche', 'Oppression', 'Essoufflement'],
    },
  },
  arthrose: {
    label: 'Arthrose',
    zones: ['jambeG', 'jambeD', 'brasG', 'brasD'],
    triggers: ['Effort', 'Froid', 'Humidite', 'Immobilite prolongee'],
    treatment: 'Anti-inflammatoire',
    extra: {
      label: 'Symptomes',
      options: ['Raideur', 'Gonflement', 'Craquements', 'Perte de mobilite'],
    },
  },
  autre: {
    label: 'Autre pathologie',
    zones: ['tete', 'torse', 'abdomen', 'brasG', 'brasD', 'jambeG', 'jambeD'],
    triggers: ['Stress', 'Sommeil', 'Effort', 'Aliment', 'Meteo', 'Froid'],
    treatment: 'Medicament',
    extra: {
      label: 'Precision',
      options: [],
    },
    custom: true, // signale qu'un champ libre est propose
  },
}

export const conditionKeys = Object.keys(conditions)

// Noms lisibles des zones du corps
export const zoneLabels = {
  tete: 'Tete',
  torse: 'Torse',
  abdomen: 'Abdomen',
  brasG: 'Bras gauche',
  brasD: 'Bras droit',
  jambeG: 'Jambe gauche',
  jambeD: 'Jambe droite',
}

// Declencheurs lies au genre — masques pour certains profils
export const genderFilteredTriggers = {
  h: ['Regles', 'Rapports'],
}

// Niveaux d'efficacité du traitement (renseignés en second temps)
export const efficacyLevels = ['Pas encore', 'Un peu', 'Bien']

// Durées proposées
export const durations = ['<1h', '2-4h', '½ jour', '+1j']
