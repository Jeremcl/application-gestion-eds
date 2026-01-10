require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Schéma Client (copié du modèle)
const appareilSchema = new mongoose.Schema({
  type: String,
  marque: String,
  modele: String,
  numeroSerie: String
}, { _id: true });

const clientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  adresse: String,
  codePostal: String,
  ville: String,
  telephone: {
    type: String,
    required: true
  },
  email: String,
  appareils: [appareilSchema],
  notes: String,
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

const Client = mongoose.model('Client', clientSchema);

// Fonction pour nettoyer un numéro de téléphone
function cleanPhoneNumber(phone) {
  if (!phone) return '';

  // Enlever les espaces, apostrophes, parenthèses, tirets
  let cleaned = phone.replace(/[\s'\(\)\-]/g, '');

  // Remplacer +33 par 0
  if (cleaned.startsWith('+33')) {
    cleaned = '0' + cleaned.substring(3);
  }

  // Garder uniquement les chiffres
  cleaned = cleaned.replace(/[^\d]/g, '');

  // Vérifier que c'est un numéro français valide (10 chiffres commençant par 0)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned;
  }

  return '';
}

// Fonction pour parser le CSV avec le format contacts.csv
function parseContactsCSV(csvContent) {
  // Enlever le BOM si présent
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.substring(1);
  }

  const lines = csvContent.split('\n');
  const clients = [];
  let skippedCount = 0;

  console.log(`📋 Total de lignes dans le CSV: ${lines.length}`);

  // Commencer à la ligne 1 pour ignorer l'en-tête (si présent)
  // Détecter si la première ligne est un en-tête
  const startLine = lines[0].toLowerCase().includes('prénom') || lines[0].toLowerCase().includes('prenom') ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Ignorer les lignes vides

    // Parser la ligne CSV (gérer les virgules dans les guillemets)
    const columns = parseCSVLine(line);

    // Mapper les colonnes selon le format fourni
    const prenom = columns[0]?.trim() || '';
    const nom = columns[1]?.trim() || '';
    const email1 = columns[2]?.trim() || '';
    const email2 = columns[3]?.trim() || '';
    const tel1 = cleanPhoneNumber(columns[4]);
    const tel2 = cleanPhoneNumber(columns[5]);
    const tel3 = cleanPhoneNumber(columns[6]);
    const adresseRue1 = columns[8]?.trim() || '';
    const adresseRue2 = columns[9]?.trim() || '';
    const ville = columns[10]?.trim() || '';
    const codePostal = columns[12]?.trim() || '';
    const notes = columns[33]?.trim() || '';

    // Ignorer les lignes sans nom ET sans téléphone
    const telephone = tel1 || tel2 || tel3;
    if (!nom && !telephone) {
      skippedCount++;
      continue;
    }

    // Si pas de nom, mettre un placeholder
    const finalNom = nom || 'INCONNU';
    const finalPrenom = prenom || '';

    // Combiner les deux lignes d'adresse
    let adresse = adresseRue1;
    if (adresseRue2) {
      adresse = adresse ? `${adresse}, ${adresseRue2}` : adresseRue2;
    }

    // Prioriser email1, sinon email2
    const email = email1 || email2;

    // Si pas de téléphone valide, ignorer
    if (!telephone) {
      skippedCount++;
      continue;
    }

    clients.push({
      nom: finalNom,
      prenom: finalPrenom,
      telephone: telephone,
      adresse: adresse,
      codePostal: codePostal,
      ville: ville,
      email: email,
      notes: notes,
      ligneOrigine: i + 1
    });
  }

  console.log(`⏭️  Lignes ignorées (pas de nom ni téléphone): ${skippedCount}`);

  return clients;
}

// Fonction pour parser une ligne CSV en gérant les guillemets
function parseCSVLine(line) {
  const columns = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Ajouter la dernière colonne
  columns.push(current);

  return columns;
}

async function importClients() {
  try {
    // URL de connexion MongoDB interne VPS
    const MONGODB_URI = 'mongodb://eds22user:wdaujzphftw0scyq@application-gestion-eds-eds22mongodb-fzzvbu:27017/eds22?authSource=admin';

    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connecté');

    // Chemin du fichier CSV
    const csvPath = path.join(__dirname, 'contacts.csv');

    // Vérifier si le fichier existe
    if (!fs.existsSync(csvPath)) {
      console.error('❌ Fichier contacts.csv introuvable');
      console.log('📝 Chemin attendu:', csvPath);
      process.exit(1);
    }

    // Lire le fichier CSV
    console.log('📖 Lecture du fichier contacts.csv...');
    console.log('📂 Chemin:', csvPath);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const clients = parseContactsCSV(csvContent);

    console.log(`📊 ${clients.length} clients valides trouvés dans le CSV\n`);

    // Afficher un aperçu des premiers clients
    console.log('👀 Aperçu des 3 premiers clients:');
    clients.slice(0, 3).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.prenom} ${c.nom} - ${c.telephone} - ${c.ville}`);
    });
    console.log('');

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];

    // Importer chaque client
    for (let i = 0; i < clients.length; i++) {
      const clientData = clients[i];

      try {
        // Vérifier si le client existe déjà (par téléphone)
        const existingClient = await Client.findOne({
          telephone: clientData.telephone
        });

        if (existingClient) {
          duplicateCount++;
          if (duplicateCount <= 5) {
            console.log(`⏭️  Doublon (ligne ${clientData.ligneOrigine}): ${clientData.prenom} ${clientData.nom} - ${clientData.telephone}`);
          }
          continue;
        }

        // Créer le nouveau client
        const newClient = new Client({
          nom: clientData.nom,
          prenom: clientData.prenom,
          telephone: clientData.telephone,
          adresse: clientData.adresse,
          codePostal: clientData.codePostal,
          ville: clientData.ville,
          email: clientData.email,
          notes: clientData.notes,
          appareils: []
        });

        await newClient.save();
        importedCount++;

        // Afficher seulement les 10 premiers imports pour ne pas polluer la console
        if (importedCount <= 10) {
          console.log(`✅ Importé (ligne ${clientData.ligneOrigine}): ${clientData.prenom} ${clientData.nom} - ${clientData.telephone}`);
        } else if (importedCount === 11) {
          console.log(`... (affichage limité aux 10 premiers)`);
        }

      } catch (error) {
        errorCount++;
        const errorMsg = `Ligne ${clientData.ligneOrigine} (${clientData.prenom} ${clientData.nom}): ${error.message}`;
        errors.push(errorMsg);
        if (errorCount <= 10) {
          console.error(`❌ ${errorMsg}`);
        }
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE L\'IMPORTATION');
    console.log('='.repeat(60));
    console.log(`✅ Clients importés avec succès: ${importedCount}`);
    console.log(`⏭️  Clients déjà existants (doublons): ${duplicateCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📝 Total traité: ${clients.length}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Détail des erreurs (max 10):');
      errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
      if (errors.length > 10) {
        console.log(`   ... et ${errors.length - 10} autres erreurs`);
      }
    }

    console.log('\n✨ Importation terminée!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connexion MongoDB fermée');
  }
}

// Lancer l'importation
importClients();
