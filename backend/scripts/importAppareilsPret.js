require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const AppareilPret = require('../models/AppareilPret');

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

// Fonction pour extraire la valeur numérique d'une chaîne de prix
function extractPrice(priceString) {
  if (!priceString) return 0;

  // Extraire les chiffres et le séparateur décimal
  const cleaned = priceString.replace(/[^\d,\.]/g, '');
  const number = parseFloat(cleaned.replace(',', '.'));

  return isNaN(number) ? 0 : number;
}

// Fonction pour déterminer le statut
function determineStatus(assigneA, statutInterne) {
  // Si "Assigné à" contient un nom, l'appareil est prêté
  if (assigneA && assigneA.trim() && !assigneA.toLowerCase().includes('prêt n°')) {
    return 'Prêté';
  }

  // Mapper les statuts internes
  if (statutInterne) {
    const statut = statutInterne.toLowerCase().trim();
    if (statut.includes('maintenance')) {
      return 'En maintenance';
    }
    if (statut.includes('dispo') || statut.includes('disponible')) {
      return 'Disponible';
    }
  }

  // Par défaut, disponible
  return 'Disponible';
}

// Fonction pour parser le CSV des appareils de prêt
function parseAppareilsPretCSV(csvContent) {
  // Enlever le BOM si présent
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.substring(1);
  }

  const lines = csvContent.split('\n');
  const appareils = [];
  let skippedCount = 0;

  console.log(`📋 Total de lignes dans le CSV: ${lines.length}`);

  // La première ligne est l'en-tête, on commence à la ligne 1
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Ignorer les lignes vides

    // Parser la ligne CSV
    const columns = parseCSVLine(line);

    // Mapping des colonnes selon le CSV fourni:
    // 0: Numéro de prêt
    // 1: Assigné à
    // 2: Cout REE
    // 3: Dernier contrôle
    // 4: Documentation technique
    // 5: ID Wix
    // 6: Lien notice
    // 7: Lien wix
    // 8: Marque
    // 9: Modèle
    // 10: Numéro de série
    // 11: PHOTOS
    // 12: Photos détourées
    // 13: Plaque signalétique
    // 14: Prix généré
    // 15: Remarque
    // 16: Statut interne
    // 17: Statut publication
    // 18: Type d'appareil
    // 19: État général

    const numeroPret = columns[0]?.trim() || '';
    const assigneA = columns[1]?.trim() || '';
    const coutREE = columns[2]?.trim() || '';
    const dernierControle = columns[3]?.trim() || '';
    const marque = columns[8]?.trim() || '';
    const modele = columns[9]?.trim() || '';
    const numeroSerie = columns[10]?.trim() || '';
    const photos = columns[11]?.trim() || '';
    const plaqueSignaletique = columns[13]?.trim() || '';
    const prixGenere = columns[14]?.trim() || '';
    const remarque = columns[15]?.trim() || '';
    const statutInterne = columns[16]?.trim() || '';
    const typeAppareil = columns[18]?.trim() || '';
    const etatGeneral = columns[19]?.trim() || '';

    // Le type est obligatoire
    if (!typeAppareil) {
      skippedCount++;
      continue;
    }

    // Déterminer le statut
    const statut = determineStatus(assigneA, statutInterne);

    // Déterminer la valeur (prioriser Prix généré, sinon Cout REE)
    const valeur = extractPrice(prixGenere) || extractPrice(coutREE);

    // Déterminer la photo (prioriser Plaque signalétique)
    const photo = plaqueSignaletique || photos;

    // Construire les notes avec les informations supplémentaires
    let notes = remarque || '';
    if (numeroPret) {
      notes = `Numéro: ${numeroPret}${notes ? '\n' + notes : ''}`;
    }
    if (dernierControle) {
      notes += `${notes ? '\n' : ''}Dernier contrôle: ${dernierControle}`;
    }
    if (assigneA && assigneA !== numeroPret) {
      notes += `${notes ? '\n' : ''}Assigné à: ${assigneA}`;
    }

    appareils.push({
      type: typeAppareil,
      marque: marque || undefined,
      modele: modele || undefined,
      numeroSerie: numeroSerie || undefined,
      statut: statut,
      etat: etatGeneral || undefined,
      valeur: valeur,
      photo: photo || undefined,
      notes: notes.trim() || undefined,
      ligneOrigine: i + 1
    });
  }

  console.log(`⏭️  Lignes ignorées (pas de type d'appareil): ${skippedCount}`);

  return appareils;
}

async function importAppareilsPret() {
  try {
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté');

    // Chemin du fichier CSV (utiliser le fichier exemple en local)
    const csvPath = path.join(__dirname, 'appareils-pret.exemple.csv');

    // Vérifier si le fichier existe
    if (!fs.existsSync(csvPath)) {
      console.error('❌ Fichier CSV introuvable');
      console.log('📝 Chemin attendu:', csvPath);
      process.exit(1);
    }

    // Lire le fichier CSV
    console.log('📖 Lecture du fichier CSV des appareils de prêt...');
    console.log('📂 Chemin:', csvPath);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const appareils = parseAppareilsPretCSV(csvContent);

    console.log(`📊 ${appareils.length} appareils valides trouvés dans le CSV\n`);

    // Afficher un aperçu des premiers appareils
    console.log('👀 Aperçu des 5 premiers appareils:');
    appareils.slice(0, 5).forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.type} ${a.marque || ''} ${a.modele || ''} - ${a.statut} - ${a.valeur}€`);
    });
    console.log('');

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];

    // Importer chaque appareil
    for (let i = 0; i < appareils.length; i++) {
      const appareilData = appareils[i];

      try {
        // Vérifier si l'appareil existe déjà (par numéro de série si défini)
        let existingAppareil = null;
        if (appareilData.numeroSerie) {
          existingAppareil = await AppareilPret.findOne({
            numeroSerie: appareilData.numeroSerie
          });
        }

        if (existingAppareil) {
          duplicateCount++;
          if (duplicateCount <= 5) {
            console.log(`⏭️  Doublon (ligne ${appareilData.ligneOrigine}): ${appareilData.type} - ${appareilData.numeroSerie}`);
          }
          continue;
        }

        // Créer le nouvel appareil
        const newAppareil = new AppareilPret(appareilData);
        await newAppareil.save();
        importedCount++;

        // Afficher seulement les 10 premiers imports
        if (importedCount <= 10) {
          console.log(`✅ Importé (ligne ${appareilData.ligneOrigine}): ${appareilData.type} ${appareilData.marque || ''} ${appareilData.modele || ''}`);
        } else if (importedCount === 11) {
          console.log(`... (affichage limité aux 10 premiers)`);
        }

      } catch (error) {
        errorCount++;
        const errorMsg = `Ligne ${appareilData.ligneOrigine} (${appareilData.type}): ${error.message}`;
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
    console.log(`✅ Appareils importés avec succès: ${importedCount}`);
    console.log(`⏭️  Appareils déjà existants (doublons): ${duplicateCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📝 Total traité: ${appareils.length}`);

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
importAppareilsPret();
