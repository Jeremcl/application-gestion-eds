const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const iconv = require('iconv-lite');

// Schéma Piece (copié du modèle)
const pieceSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true
  },
  marque: String,
  modelesCompatibles: [String],
  quantiteStock: {
    type: Number,
    default: 0
  },
  quantiteMinimum: {
    type: Number,
    default: 5
  },
  emplacement: String,
  prixAchat: {
    type: Number,
    required: true
  },
  prixVente: {
    type: Number,
    required: true
  },
  fournisseur: String,
  fournisseurRef: String,
  actif: {
    type: Boolean,
    default: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Piece = mongoose.model('Piece', pieceSchema);

// Chemins des fichiers CSV
const CSV_PIECES = path.join(__dirname, '../data/PD/BDD_Pieces_EDS22.csv');
const CSV_TYPES = path.join(__dirname, '../data/PD/Pièces(in).csv');
const CSV_MARQUES = path.join(__dirname, '../data/PD/CONSTRUCTEUR(in).csv');

// Fonction pour charger la table des types de pièces
function loadTypesMapping() {
  return new Promise((resolve, reject) => {
    const map = new Map();

    fs.createReadStream(CSV_TYPES)
      .pipe(csv({ separator: ',' }))
      .on('data', (row) => {
        const firstCol = Object.values(row)[0] || '';
        const match = firstCol.match(/^(.+),""(\d+)""$/);

        if (match) {
          const type = match[1].trim();
          const numero = match[2].trim();
          map.set(numero, type);
        }
      })
      .on('end', () => {
        console.log(`✅ ${map.size} types de pièces chargés`);
        resolve(map);
      })
      .on('error', reject);
  });
}

// Fonction pour charger la table des marques
function loadMarquesMapping() {
  return new Promise((resolve, reject) => {
    const map = new Map();

    fs.createReadStream(CSV_MARQUES)
      .pipe(csv({ separator: ',' }))
      .on('data', (row) => {
        const firstCol = Object.values(row)[0] || '';
        const match = firstCol.match(/^(.+),""(\d+)""$/);

        if (match) {
          const marque = match[1].trim();
          const numero = match[2].trim();
          map.set(numero, marque);
        }
      })
      .on('end', () => {
        console.log(`✅ ${map.size} marques chargées`);
        resolve(map);
      })
      .on('error', reject);
  });
}

// Fonction pour charger le CSV des pièces (encodage Latin-1)
function loadPiecesCSV() {
  return new Promise((resolve, reject) => {
    const data = [];
    let lineNumber = 0;

    fs.createReadStream(CSV_PIECES)
      .pipe(iconv.decodeStream('latin1'))
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        lineNumber++;
        data.push({
          id: row.Id,
          codeBarre: row['Code Barre'],
          typePiece: row['Type de pièce'],
          marque: row['Marque'],
          refConstructeur: row['Référence constructeur'],
          codeDarty: row['Code absolu darty/ SDS'],
          modele: row['Modèle ou chassis'],
          etat: row['Etat actuel de la pièce'],
          localisation: row['Localisation'],
          commentaire: row['Commentaire'],
          lineNumber
        });
      })
      .on('end', () => {
        console.log(`✅ ${data.length} lignes CSV chargées`);
        resolve(data);
      })
      .on('error', reject);
  });
}

// Fonction pour catégoriser l'état
function categorizeEtat(etatCSV) {
  const etat = (etatCSV || '').trim();

  if (etat === 'Neuve' || etat === 'Contrôlée OK') {
    return 'Fonctionnelle';
  } else if (etat === 'Non contrôlée') {
    return 'Non contrôlée';
  } else if (etat === 'HS') {
    return 'HS';
  } else {
    return 'Non contrôlée';
  }
}

// Fonction pour grouper les pièces par clé unique et état
function groupPiecesByKeyAndState(csvData, typesMap, marquesMap) {
  const groups = new Map();
  const errors = [];

  for (const row of csvData) {
    try {
      const typeNom = typesMap.get(row.typePiece) || 'Type inconnu';
      const marqueNom = marquesMap.get(row.marque) || 'Marque inconnue';

      if (typeNom === 'Type inconnu') {
        errors.push({ ligne: row.lineNumber, erreur: `Type ${row.typePiece} inconnu` });
      }
      if (marqueNom === 'Marque inconnue') {
        errors.push({ ligne: row.lineNumber, erreur: `Marque ${row.marque} inconnue` });
      }

      const refBase = (row.refConstructeur || row.codeDarty || `UNKNOWN-${row.id}`).trim();
      const key = `${row.typePiece}-${row.marque}-${refBase}`;
      const etatCategorie = categorizeEtat(row.etat);
      const fullKey = `${key}|${etatCategorie}`;

      if (!groups.has(fullKey)) {
        groups.set(fullKey, {
          refBase,
          typeNom,
          marqueNom,
          etatCategorie,
          quantite: 0,
          emplacements: [],
          modeles: new Set(),
          commentaires: []
        });
      }

      const group = groups.get(fullKey);
      group.quantite++;

      if (row.localisation) {
        group.emplacements.push(row.localisation);
      }

      if (row.modele && row.modele !== 'NC' && row.modele.trim() !== '') {
        row.modele.split('-').forEach(m => {
          const modele = m.trim();
          if (modele) group.modeles.add(modele);
        });
      }

      if (row.commentaire && row.commentaire.trim()) {
        group.commentaires.push(row.commentaire.trim());
      }

    } catch (error) {
      errors.push({ ligne: row.lineNumber, erreur: error.message });
    }
  }

  if (errors.length > 0) {
    console.warn(`⚠️  ${errors.length} avertissements de parsing:`);
    errors.slice(0, 10).forEach(e => console.warn(`   Ligne ${e.ligne}: ${e.erreur}`));
    if (errors.length > 10) {
      console.warn(`   ... et ${errors.length - 10} autres avertissements`);
    }
  }

  return groups;
}

// Fonction pour générer les documents MongoDB
function generateMongoDocuments(groups) {
  const documents = [];

  for (const [fullKey, group] of groups) {
    const { refBase, typeNom, marqueNom, etatCategorie } = group;

    let reference = refBase;
    if (etatCategorie === 'Non contrôlée') {
      reference = `${refBase}-NC`;
    } else if (etatCategorie === 'HS') {
      reference = `${refBase}-HS`;
    }

    const designation = `${typeNom} - ${marqueNom}`;
    const actif = etatCategorie !== 'HS';
    const emplacement = group.emplacements[0] || '';

    documents.push({
      reference,
      designation,
      marque: marqueNom,
      modelesCompatibles: Array.from(group.modeles),
      quantiteStock: group.quantite,
      quantiteMinimum: 5,
      emplacement,
      prixAchat: 0,
      prixVente: 0,
      fournisseur: '',
      fournisseurRef: refBase,
      actif
    });
  }

  console.log(`✅ ${documents.length} documents générés`);
  return documents;
}

// Fonction de validation
function validateDocuments(documents) {
  const errors = [];
  const references = new Set();

  for (const doc of documents) {
    if (references.has(doc.reference)) {
      errors.push(`Doublon: reference "${doc.reference}"`);
    }
    references.add(doc.reference);

    if (!doc.reference) errors.push('reference manquante');
    if (!doc.designation) errors.push('designation manquante');
    if (doc.quantiteStock < 1) errors.push(`quantiteStock invalide: ${doc.quantiteStock}`);
  }

  if (errors.length > 0) {
    console.error('❌ Erreurs de validation:');
    errors.slice(0, 20).forEach(e => console.error(`   ${e}`));
    if (errors.length > 20) {
      console.error(`   ... et ${errors.length - 20} autres erreurs`);
    }
    throw new Error('Validation échouée');
  }

  console.log('✅ Validation OK');
}

// Fonction de rapport final
function printReport(insertResult, csvLineCount) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('='.repeat(60));

  console.log(`\n📥 CSV traité:`);
  console.log(`   Lignes CSV lues: ${csvLineCount}`);

  console.log(`\n💾 MongoDB:`);
  console.log(`   Documents insérés: ${insertResult.length}`);

  const stats = {
    fonctionnelles: 0,
    nonControlees: 0,
    hs: 0,
    quantiteTotale: 0
  };

  insertResult.forEach(doc => {
    stats.quantiteTotale += doc.quantiteStock;

    if (doc.reference.endsWith('-HS')) {
      stats.hs++;
    } else if (doc.reference.endsWith('-NC')) {
      stats.nonControlees++;
    } else {
      stats.fonctionnelles++;
    }
  });

  console.log(`\n📊 Répartition par état:`);
  console.log(`   Fonctionnelles: ${stats.fonctionnelles} entrées`);
  console.log(`   Non contrôlées: ${stats.nonControlees} entrées`);
  console.log(`   HS: ${stats.hs} entrées`);
  console.log(`   Quantité totale: ${stats.quantiteTotale} pièces physiques`);

  console.log('\n✅ Import terminé avec succès !');
  console.log('='.repeat(60) + '\n');
}

// Fonction principale
async function importPieces() {
  try {
    // URL de connexion MongoDB interne VPS
    const MONGODB_URI = 'mongodb://eds22user:wdaujzphftw0scyq@application-gestion-eds-eds22mongodb-fzzvbu:27017/eds22?authSource=admin';

    // 1. Connexion MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connecté');

    // 2. Chargement des tables de correspondance
    console.log('\n📖 Chargement des tables de correspondance...');
    const typesMap = await loadTypesMapping();
    const marquesMap = await loadMarquesMapping();

    // 3. Lecture du CSV principal
    console.log('\n📖 Lecture du CSV des pièces...');
    const csvData = await loadPiecesCSV();

    // 4. Groupement par clé + état
    console.log('\n🔄 Groupement des pièces...');
    const groupedPieces = groupPiecesByKeyAndState(csvData, typesMap, marquesMap);
    console.log(`✅ ${groupedPieces.size} groupes de pièces créés`);

    // 5. Génération des documents MongoDB
    console.log('\n🔨 Génération des documents...');
    const documents = generateMongoDocuments(groupedPieces);

    // 6. Validation
    console.log('\n🔍 Validation...');
    validateDocuments(documents);

    // 7. Vidage de la collection
    console.log('\n🗑️  Vidage de la collection pieces...');
    const deleteResult = await Piece.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} anciennes pièces supprimées`);

    // 8. Insertion en base
    console.log('\n💾 Insertion en base...');
    const result = await Piece.insertMany(documents, { ordered: false });
    console.log(`✅ ${result.length} pièces insérées`);

    // 9. Rapport final
    printReport(result, csvData.length);

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'import:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connexion MongoDB fermée');
  }
}

// Lancer l'import
importPieces();
