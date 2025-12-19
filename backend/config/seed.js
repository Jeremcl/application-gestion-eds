require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Piece = require('../models/Piece');
const Intervention = require('../models/Intervention');
const Facture = require('../models/Facture');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connexion MongoDB établie');

    // Nettoyage de la base
    await User.deleteMany({});
    await Client.deleteMany({});
    await Piece.deleteMany({});
    await Intervention.deleteMany({});
    await Facture.deleteMany({});
    console.log('🗑️  Base de données nettoyée');

    // Création de l'utilisateur admin
    const admin = await User.create({
      email: 'admin@eds22.com',
      password: 'admin123',
      nom: 'Administrateur EDS22',
      role: 'admin'
    });
    console.log('👤 Utilisateur admin créé');

    // Création des utilisateurs techniciens
    const jeremy = await User.create({
      email: 'jeremy@eds22.com',
      password: 'jeremy123',
      nom: 'Jérémy',
      role: 'tech'
    });

    const stephane = await User.create({
      email: 'stephane@eds22.com',
      password: 'stephane123',
      nom: 'Stéphane',
      role: 'tech'
    });

    const anneLaure = await User.create({
      email: 'annelaure@eds22.com',
      password: 'annelaure123',
      nom: 'Anne Laure',
      role: 'tech'
    });
    console.log('👥 Utilisateurs techniciens créés (Jérémy, Stéphane, Anne Laure)');

    // Création des clients
    const clients = await Client.create([
      {
        nom: 'Dupont',
        prenom: 'Marie',
        adresse: '12 rue de la Paix',
        codePostal: '22200',
        ville: 'Guingamp',
        telephone: '06 12 34 56 78',
        email: 'marie.dupont@email.com',
        appareils: [
          { type: 'Lave-linge', marque: 'Whirlpool', modele: 'AWE 6628', numeroSerie: 'WH123456' }
        ]
      },
      {
        nom: 'Martin',
        prenom: 'Jean',
        adresse: '45 avenue du Général de Gaulle',
        codePostal: '22200',
        ville: 'Guingamp',
        telephone: '06 23 45 67 89',
        email: 'jean.martin@email.com',
        appareils: [
          { type: 'Lave-vaisselle', marque: 'Bosch', modele: 'SMS46AI01E', numeroSerie: 'BS789012' }
        ]
      },
      {
        nom: 'Bernard',
        prenom: 'Sophie',
        adresse: '8 place du Centre',
        codePostal: '22200',
        ville: 'Guingamp',
        telephone: '06 34 56 78 90',
        email: 'sophie.bernard@email.com',
        appareils: [
          { type: 'Réfrigérateur', marque: 'Samsung', modele: 'RB34T632ESA', numeroSerie: 'SM345678' }
        ]
      },
      {
        nom: 'Dubois',
        prenom: 'Pierre',
        adresse: '23 rue Victor Hugo',
        codePostal: '22200',
        ville: 'Guingamp',
        telephone: '06 45 67 89 01',
        email: 'pierre.dubois@email.com'
      },
      {
        nom: 'Moreau',
        prenom: 'Claire',
        adresse: '67 route de Brest',
        codePostal: '22300',
        ville: 'Lannion',
        telephone: '06 56 78 90 12',
        email: 'claire.moreau@email.com',
        appareils: [
          { type: 'Sèche-linge', marque: 'Miele', modele: 'TCE 530 WP', numeroSerie: 'MI901234' }
        ]
      },
      {
        nom: 'Leroy',
        prenom: 'Thomas',
        adresse: '34 rue des Lilas',
        codePostal: '22200',
        ville: 'Guingamp',
        telephone: '06 67 89 01 23',
        email: 'thomas.leroy@email.com'
      },
      {
        nom: 'Roux',
        prenom: 'Isabelle',
        adresse: '91 avenue de la République',
        codePostal: '22200',
        ville: 'Guingamp',
        telephone: '06 78 90 12 34',
        email: 'isabelle.roux@email.com',
        appareils: [
          { type: 'Four', marque: 'Siemens', modele: 'HB634GBS1', numeroSerie: 'SI567890' }
        ]
      },
      {
        nom: 'Fournier',
        prenom: 'Marc',
        adresse: '15 impasse du Moulin',
        codePostal: '22200',
        ville: 'Guingamp',
        telephone: '06 89 01 23 45',
        email: 'marc.fournier@email.com'
      },
      {
        nom: 'Girard',
        prenom: 'Anne',
        adresse: '52 rue Jean Jaurès',
        codePostal: '22200',
        ville: 'Guingamp',
        telephone: '06 90 12 34 56',
        email: 'anne.girard@email.com',
        appareils: [
          { type: 'Plaque de cuisson', marque: 'Electrolux', modele: 'EHH6240ISK', numeroSerie: 'EL123456' }
        ]
      },
      {
        nom: 'Bonnet',
        prenom: 'François',
        adresse: '78 chemin des Vignes',
        codePostal: '22300',
        ville: 'Lannion',
        telephone: '06 01 23 45 67',
        email: 'francois.bonnet@email.com'
      }
    ]);
    console.log(`👥 ${clients.length} clients créés`);

    // Création des pièces détachées
    const pieces = await Piece.create([
      {
        reference: 'FIL-001',
        designation: 'Filtre à peluches universel',
        marque: 'Whirlpool',
        modelesCompatibles: ['AWE 6628', 'AWE 8629', 'AWE 9629'],
        emplacement: 'A1-B2',
        quantiteStock: 12,
        quantiteMinimum: 5,
        prixAchat: 8.50,
        prixVente: 15.90,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'WHP-FIL-001'
      },
      {
        reference: 'POM-002',
        designation: 'Pompe de vidange lave-vaisselle',
        marque: 'Bosch',
        modelesCompatibles: ['SMS46AI01E', 'SMS50E32EU'],
        emplacement: 'C3-D4',
        quantiteStock: 3,
        quantiteMinimum: 5,
        prixAchat: 22.00,
        prixVente: 39.90,
        fournisseur: 'Bosch-Parts',
        fournisseurRef: 'BSH-POM-002'
      },
      {
        reference: 'RES-003',
        designation: 'Résistance lave-linge 2000W',
        marque: 'Universel',
        modelesCompatibles: ['Tous modèles'],
        emplacement: 'E5-F6',
        quantiteStock: 8,
        quantiteMinimum: 5,
        prixAchat: 18.00,
        prixVente: 32.00,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'UNI-RES-003'
      },
      {
        reference: 'JOI-004',
        designation: 'Joint de porte lave-linge',
        marque: 'Whirlpool',
        modelesCompatibles: ['AWE 6628'],
        emplacement: 'G7-H8',
        quantiteStock: 4,
        quantiteMinimum: 5,
        prixAchat: 25.00,
        prixVente: 45.00,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'WHP-JOI-004'
      },
      {
        reference: 'THE-005',
        designation: 'Thermostat réfrigérateur',
        marque: 'Samsung',
        modelesCompatibles: ['RB34T632ESA', 'RB34T652ESA'],
        emplacement: 'I9-J10',
        quantiteStock: 6,
        quantiteMinimum: 3,
        prixAchat: 32.00,
        prixVente: 58.00,
        fournisseur: 'Samsung-Parts',
        fournisseurRef: 'SAM-THE-005'
      },
      {
        reference: 'COU-006',
        designation: 'Courroie lave-linge 1195 J5',
        marque: 'Universel',
        modelesCompatibles: ['Tous modèles'],
        emplacement: 'K11-L12',
        quantiteStock: 15,
        quantiteMinimum: 8,
        prixAchat: 6.50,
        prixVente: 12.90,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'UNI-COU-006'
      },
      {
        reference: 'ELE-007',
        designation: 'Électrovanne lave-linge 2 voies',
        marque: 'Universel',
        modelesCompatibles: ['Tous modèles'],
        emplacement: 'M13-N14',
        quantiteStock: 2,
        quantiteMinimum: 5,
        prixAchat: 15.00,
        prixVente: 28.00,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'UNI-ELE-007'
      },
      {
        reference: 'CHA-008',
        designation: 'Charnière porte lave-vaisselle',
        marque: 'Bosch',
        modelesCompatibles: ['SMS46AI01E'],
        emplacement: 'O15-P16',
        quantiteStock: 5,
        quantiteMinimum: 4,
        prixAchat: 12.00,
        prixVente: 22.00,
        fournisseur: 'Bosch-Parts',
        fournisseurRef: 'BSH-CHA-008'
      },
      {
        reference: 'BRA-009',
        designation: 'Bras de lavage supérieur',
        marque: 'Bosch',
        modelesCompatibles: ['SMS46AI01E', 'SMS50E32EU'],
        emplacement: 'Q17-R18',
        quantiteStock: 7,
        quantiteMinimum: 5,
        prixAchat: 18.50,
        prixVente: 34.90,
        fournisseur: 'Bosch-Parts',
        fournisseurRef: 'BSH-BRA-009'
      },
      {
        reference: 'VEN-010',
        designation: 'Ventilateur réfrigérateur',
        marque: 'Samsung',
        modelesCompatibles: ['RB34T632ESA'],
        emplacement: 'S19-T20',
        quantiteStock: 3,
        quantiteMinimum: 3,
        prixAchat: 28.00,
        prixVente: 52.00,
        fournisseur: 'Samsung-Parts',
        fournisseurRef: 'SAM-VEN-010'
      },
      {
        reference: 'ROU-011',
        designation: 'Roulement tambour lave-linge',
        marque: 'Whirlpool',
        modelesCompatibles: ['AWE 6628', 'AWE 8629'],
        emplacement: 'U21-V22',
        quantiteStock: 4,
        quantiteMinimum: 4,
        prixAchat: 22.00,
        prixVente: 42.00,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'WHP-ROU-011'
      },
      {
        reference: 'CAR-012',
        designation: 'Carte électronique lave-linge',
        marque: 'Whirlpool',
        modelesCompatibles: ['AWE 6628'],
        emplacement: 'W23-X24',
        quantiteStock: 1,
        quantiteMinimum: 2,
        prixAchat: 65.00,
        prixVente: 125.00,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'WHP-CAR-012'
      },
      {
        reference: 'TUY-013',
        designation: 'Tuyau vidange universel 1.5m',
        marque: 'Universel',
        modelesCompatibles: ['Tous modèles'],
        emplacement: 'Y25-Z26',
        quantiteStock: 18,
        quantiteMinimum: 10,
        prixAchat: 4.50,
        prixVente: 9.90,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'UNI-TUY-013'
      },
      {
        reference: 'KIT-014',
        designation: 'Kit joints lave-vaisselle',
        marque: 'Bosch',
        modelesCompatibles: ['SMS46AI01E'],
        emplacement: 'Z2C3',
        quantiteStock: 6,
        quantiteMinimum: 4,
        prixAchat: 14.00,
        prixVente: 26.00,
        fournisseur: 'Bosch-Parts',
        fournisseurRef: 'BSH-KIT-014'
      },
      {
        reference: 'SEL-015',
        designation: 'Sel régénérant 2kg',
        marque: 'Universel',
        modelesCompatibles: ['Tous lave-vaisselle'],
        emplacement: 'R4-F1',
        quantiteStock: 25,
        quantiteMinimum: 15,
        prixAchat: 2.50,
        prixVente: 5.90,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'UNI-SEL-015'
      },
      {
        reference: 'FIL-016',
        designation: 'Filtre charbon hotte',
        marque: 'Universel',
        modelesCompatibles: ['Tous modèles'],
        emplacement: 'A2-B3',
        quantiteStock: 10,
        quantiteMinimum: 6,
        prixAchat: 8.00,
        prixVente: 15.50,
        fournisseur: 'Pieces-Elec',
        fournisseurRef: 'UNI-FIL-016'
      },
      {
        reference: 'LAM-017',
        designation: 'Lampe four 40W',
        marque: 'Siemens',
        modelesCompatibles: ['HB634GBS1'],
        emplacement: 'C4-D5',
        quantiteStock: 12,
        quantiteMinimum: 8,
        prixAchat: 3.50,
        prixVente: 7.90,
        fournisseur: 'Siemens-Parts',
        fournisseurRef: 'SIE-LAM-017'
      },
      {
        reference: 'RES-018',
        designation: 'Résistance circulaire four 2500W',
        marque: 'Siemens',
        modelesCompatibles: ['HB634GBS1'],
        emplacement: 'E6-F7',
        quantiteStock: 2,
        quantiteMinimum: 3,
        prixAchat: 35.00,
        prixVente: 65.00,
        fournisseur: 'Siemens-Parts',
        fournisseurRef: 'SIE-RES-018'
      },
      {
        reference: 'BAC-019',
        designation: 'Bac à sel lave-vaisselle',
        marque: 'Bosch',
        modelesCompatibles: ['SMS46AI01E'],
        emplacement: 'G8-H9',
        quantiteStock: 4,
        quantiteMinimum: 3,
        prixAchat: 16.00,
        prixVente: 29.90,
        fournisseur: 'Bosch-Parts',
        fournisseurRef: 'BSH-BAC-019'
      },
      {
        reference: 'PAN-020',
        designation: 'Panier lave-vaisselle supérieur',
        marque: 'Bosch',
        modelesCompatibles: ['SMS46AI01E', 'SMS50E32EU'],
        emplacement: 'I10-J11',
        quantiteStock: 2,
        quantiteMinimum: 2,
        prixAchat: 42.00,
        prixVente: 78.00,
        fournisseur: 'Bosch-Parts',
        fournisseurRef: 'BSH-PAN-020'
      }
    ]);
    console.log(`📦 ${pieces.length} pièces créées`);

    // Création des interventions
    const today = new Date();
    const interventions = [];

    // Intervention 1 - Demande
    interventions.push(await Intervention.create({
      clientId: clients[0]._id,
      appareil: {
        type: 'Lave-linge',
        marque: 'Whirlpool',
        modele: 'AWE 6628',
        numeroSerie: 'WH123456'
      },
      description: 'Ne vidange plus, tambour ne tourne plus',
      statut: 'Demande',
      dateCreation: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      datePrevue: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      technicien: 'Pierre Moreau',
      typeIntervention: 'Atelier',
      forfaitApplique: 59
    }));

    // Intervention 2 - Planifié
    interventions.push(await Intervention.create({
      clientId: clients[1]._id,
      appareil: {
        type: 'Lave-vaisselle',
        marque: 'Bosch',
        modele: 'SMS46AI01E',
        numeroSerie: 'BS789012'
      },
      description: 'Fuite d\'eau sous l\'appareil',
      statut: 'Planifié',
      dateCreation: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      datePrevue: today,
      technicien: 'Marie Leroux',
      typeIntervention: 'Domicile',
      forfaitApplique: 99
    }));

    // Intervention 3 - En cours
    interventions.push(await Intervention.create({
      clientId: clients[2]._id,
      appareil: {
        type: 'Réfrigérateur',
        marque: 'Samsung',
        modele: 'RB34T632ESA',
        numeroSerie: 'SM345678'
      },
      description: 'Ne refroidit plus, ventilateur bruyant',
      statut: 'En cours',
      dateCreation: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      datePrevue: today,
      technicien: 'Pierre Moreau',
      typeIntervention: 'Atelier',
      forfaitApplique: 59
    }));

    // Intervention 4 - Diagnostic
    interventions.push(await Intervention.create({
      clientId: clients[4]._id,
      appareil: {
        type: 'Sèche-linge',
        marque: 'Miele',
        modele: 'TCE 530 WP',
        numeroSerie: 'MI901234'
      },
      description: 'Ne chauffe plus',
      statut: 'Diagnostic',
      dateCreation: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      datePrevue: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      diagnostic: 'Résistance défectueuse, à remplacer',
      technicien: 'Jean Dupuis',
      typeIntervention: 'Atelier',
      forfaitApplique: 59
    }));

    // Intervention 5 - Réparation
    interventions.push(await Intervention.create({
      clientId: clients[6]._id,
      appareil: {
        type: 'Four',
        marque: 'Siemens',
        modele: 'HB634GBS1',
        numeroSerie: 'SI567890'
      },
      description: 'Porte ne ferme plus correctement',
      statut: 'Réparation',
      dateCreation: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      datePrevue: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      diagnostic: 'Charnière cassée',
      technicien: 'Marie Leroux',
      typeIntervention: 'Domicile',
      forfaitApplique: 99,
      tempsMainOeuvre: 1,
      tauxHoraire: 45
    }));

    // Intervention 6 - Terminé
    interventions.push(await Intervention.create({
      clientId: clients[0]._id,
      appareil: {
        type: 'Lave-linge',
        marque: 'Whirlpool',
        modele: 'AWE 6628',
        numeroSerie: 'WH123456'
      },
      description: 'Remplacement pompe de vidange',
      statut: 'Terminé',
      dateCreation: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
      datePrevue: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000),
      dateRealisation: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      diagnostic: 'Pompe de vidange HS',
      technicien: 'Pierre Moreau',
      typeIntervention: 'Atelier',
      forfaitApplique: 59,
      piecesUtilisees: [
        { pieceId: pieces[1]._id, quantite: 1, prixUnitaire: 39.90 }
      ],
      tempsMainOeuvre: 1.5,
      tauxHoraire: 45
    }));

    // Intervention 7 - Facturé
    interventions.push(await Intervention.create({
      clientId: clients[3]._id,
      appareil: {
        type: 'Lave-linge',
        marque: 'Indesit',
        modele: 'IWC 71252',
        numeroSerie: 'IN456789'
      },
      description: 'Courroie cassée',
      statut: 'Facturé',
      dateCreation: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
      datePrevue: new Date(today.getTime() - 17 * 24 * 60 * 60 * 1000),
      dateRealisation: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
      diagnostic: 'Courroie usée',
      technicien: 'Jean Dupuis',
      typeIntervention: 'Atelier',
      forfaitApplique: 59,
      piecesUtilisees: [
        { pieceId: pieces[5]._id, quantite: 1, prixUnitaire: 12.90 }
      ],
      tempsMainOeuvre: 0.5,
      tauxHoraire: 45
    }));

    // 8 autres interventions variées
    for (let i = 0; i < 8; i++) {
      const statuts = ['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation', 'Terminé', 'Facturé'];
      const techniciens = ['Pierre Moreau', 'Marie Leroux', 'Jean Dupuis'];
      const types = ['Atelier', 'Domicile'];
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      const randomStatut = statuts[Math.floor(Math.random() * statuts.length)];

      interventions.push(await Intervention.create({
        clientId: randomClient._id,
        appareil: {
          type: ['Lave-linge', 'Lave-vaisselle', 'Réfrigérateur', 'Four'][Math.floor(Math.random() * 4)],
          marque: ['Whirlpool', 'Bosch', 'Samsung', 'Siemens'][Math.floor(Math.random() * 4)],
          modele: 'Modèle ' + (i + 1)
        },
        description: `Problème technique ${i + 1}`,
        statut: randomStatut,
        dateCreation: new Date(today.getTime() - (i + 1) * 3 * 24 * 60 * 60 * 1000),
        technicien: techniciens[Math.floor(Math.random() * techniciens.length)],
        typeIntervention: types[Math.floor(Math.random() * types.length)],
        forfaitApplique: types[Math.floor(Math.random() * types.length)] === 'Atelier' ? 59 : 99
      }));
    }

    console.log(`🔧 ${interventions.length} interventions créées`);

    // Création de quelques factures
    const facture1 = await Facture.create({
      type: 'Facture',
      clientId: clients[3]._id,
      interventionId: interventions[6]._id,
      dateEmission: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
      lignes: [
        { description: 'Forfait atelier', quantite: 1, prixUnitaire: 59, total: 59 },
        { description: 'Courroie lave-linge', quantite: 1, prixUnitaire: 12.90, total: 12.90 },
        { description: 'Main d\'œuvre (0.5h)', quantite: 1, prixUnitaire: 22.50, total: 22.50 }
      ],
      statut: 'Payé',
      datePaiement: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      modePaiement: 'Carte bancaire'
    });

    const facture2 = await Facture.create({
      type: 'Facture',
      clientId: clients[0]._id,
      interventionId: interventions[5]._id,
      dateEmission: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000),
      lignes: [
        { description: 'Forfait atelier', quantite: 1, prixUnitaire: 59, total: 59 },
        { description: 'Pompe de vidange', quantite: 1, prixUnitaire: 39.90, total: 39.90 },
        { description: 'Main d\'œuvre (1.5h)', quantite: 1, prixUnitaire: 67.50, total: 67.50 }
      ],
      statut: 'Émis'
    });

    console.log('💰 Factures créées');

    console.log('\n✅ Base de données initialisée avec succès !');
    console.log('\n📝 Informations de connexion:');
    console.log('\n   👑 Administrateur:');
    console.log('      Email: admin@eds22.com');
    console.log('      Mot de passe: admin123');
    console.log('\n   👨‍🔧 Techniciens:');
    console.log('      Jérémy - Email: jeremy@eds22.com / Mot de passe: jeremy123');
    console.log('      Stéphane - Email: stephane@eds22.com / Mot de passe: stephane123');
    console.log('      Anne Laure - Email: annelaure@eds22.com / Mot de passe: annelaure123');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
};

seedDatabase();
