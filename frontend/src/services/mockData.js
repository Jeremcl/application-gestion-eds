// Données mockées pour démonstration sans backend

export const mockUser = {
  id: '1',
  email: 'admin@eds22.com',
  nom: 'Administrateur EDS22',
  role: 'admin'
};

export const mockClients = [
  {
    _id: '1',
    nom: 'Dupont',
    prenom: 'Marie',
    adresse: '12 rue de la Paix',
    codePostal: '22200',
    ville: 'Guingamp',
    telephone: '06 12 34 56 78',
    email: 'marie.dupont@email.com',
    appareils: [
      { type: 'Lave-linge', marque: 'Whirlpool', modele: 'AWE 6628' }
    ]
  },
  {
    _id: '2',
    nom: 'Martin',
    prenom: 'Jean',
    adresse: '45 avenue du Général de Gaulle',
    codePostal: '22200',
    ville: 'Guingamp',
    telephone: '06 23 45 67 89',
    email: 'jean.martin@email.com',
    appareils: [
      { type: 'Lave-vaisselle', marque: 'Bosch', modele: 'SMS46AI01E' }
    ]
  },
  {
    _id: '3',
    nom: 'Bernard',
    prenom: 'Sophie',
    adresse: '8 place du Centre',
    codePostal: '22200',
    ville: 'Guingamp',
    telephone: '06 34 56 78 90',
    email: 'sophie.bernard@email.com',
    appareils: [
      { type: 'Réfrigérateur', marque: 'Samsung', modele: 'RB34T632ESA' }
    ]
  }
];

export const mockInterventions = [
  {
    _id: '1',
    numero: 'INT-2025-0001',
    clientId: { _id: '1', nom: 'Dupont', prenom: 'Marie', telephone: '06 12 34 56 78' },
    appareil: { type: 'Lave-linge', marque: 'Whirlpool', modele: 'AWE 6628' },
    description: 'Ne vidange plus, tambour ne tourne plus',
    statut: 'Demande',
    dateCreation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    technicien: 'Pierre Moreau',
    typeIntervention: 'Atelier',
    forfaitApplique: 59
  },
  {
    _id: '2',
    numero: 'INT-2025-0002',
    clientId: { _id: '2', nom: 'Martin', prenom: 'Jean', telephone: '06 23 45 67 89' },
    appareil: { type: 'Lave-vaisselle', marque: 'Bosch', modele: 'SMS46AI01E' },
    description: 'Fuite d\'eau sous l\'appareil',
    statut: 'Planifié',
    dateCreation: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    technicien: 'Marie Leroux',
    typeIntervention: 'Domicile',
    forfaitApplique: 99
  },
  {
    _id: '3',
    numero: 'INT-2025-0003',
    clientId: { _id: '3', nom: 'Bernard', prenom: 'Sophie', telephone: '06 34 56 78 90' },
    appareil: { type: 'Réfrigérateur', marque: 'Samsung', modele: 'RB34T632ESA' },
    description: 'Ne refroidit plus',
    statut: 'En cours',
    dateCreation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    technicien: 'Pierre Moreau',
    typeIntervention: 'Atelier',
    forfaitApplique: 59
  }
];

export const mockPieces = [
  {
    _id: '1',
    reference: 'FIL-001',
    designation: 'Filtre à peluches universel',
    marque: 'Whirlpool',
    modelesCompatibles: ['AWE 6628', 'AWE 8629'],
    emplacement: 'A1-B2',
    quantiteStock: 12,
    quantiteMinimum: 5,
    prixAchat: 8.50,
    prixVente: 15.90,
    fournisseur: 'Pieces-Elec'
  },
  {
    _id: '2',
    reference: 'POM-002',
    designation: 'Pompe de vidange lave-vaisselle',
    marque: 'Bosch',
    modelesCompatibles: ['SMS46AI01E'],
    emplacement: 'C3-D4',
    quantiteStock: 3,
    quantiteMinimum: 5,
    prixAchat: 22.00,
    prixVente: 39.90,
    fournisseur: 'Bosch-Parts'
  },
  {
    _id: '3',
    reference: 'RES-003',
    designation: 'Résistance lave-linge 2000W',
    marque: 'Universel',
    modelesCompatibles: ['Tous modèles'],
    emplacement: 'E5-F6',
    quantiteStock: 8,
    quantiteMinimum: 5,
    prixAchat: 18.00,
    prixVente: 32.00,
    fournisseur: 'Pieces-Elec'
  }
];

export const mockFactures = [
  {
    _id: '1',
    numero: 'FAC-2025-0001',
    type: 'Facture',
    clientId: { _id: '1', nom: 'Dupont', prenom: 'Marie' },
    dateEmission: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    dateEcheance: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    totalTTC: 113.28,
    statut: 'Payé'
  },
  {
    _id: '2',
    numero: 'FAC-2025-0002',
    type: 'Facture',
    clientId: { _id: '2', nom: 'Martin', prenom: 'Jean' },
    dateEmission: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    dateEcheance: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    totalTTC: 200.28,
    statut: 'Émis'
  }
];

export const mockStats = {
  interventionsJour: 2,
  interventionsSemaine: 8,
  interventionsMois: 25,
  caMensuel: 3250.00,
  parStatut: [
    { _id: 'Demande', count: 3 },
    { _id: 'Planifié', count: 2 },
    { _id: 'En cours', count: 4 },
    { _id: 'Terminé', count: 10 },
    { _id: 'Facturé', count: 6 }
  ]
};
