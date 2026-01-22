require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Vehicule = require('../models/Vehicule');

// Fonction pour parser une ligne CSV en gerant les guillemets
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

  // Ajouter la derniere colonne
  columns.push(current);

  return columns;
}

// Fonction pour normaliser les montants (gere: 50,03 / 10 / 85.78 / 90,01EUR)
function normalizeAmount(amountString) {
  if (!amountString) return 0;

  // Nettoyer la chaine: retirer EUR, espaces et autres caracteres non numeriques
  const cleaned = amountString
    .replace(/EUR/gi, '')
    .replace(/[^\d,\.]/g, '')
    .trim();

  if (!cleaned) return 0;

  // Remplacer la virgule par un point pour le parsing
  const number = parseFloat(cleaned.replace(',', '.'));

  return isNaN(number) ? 0 : Math.round(number * 100) / 100;
}

// Fonction pour parser un kilometrage
function parseKilometrage(kmString) {
  if (!kmString) return 0;

  // Retirer les espaces, km, et caracteres non numeriques
  const cleaned = kmString
    .replace(/km/gi, '')
    .replace(/\s/g, '')
    .replace(/[^\d]/g, '');

  const number = parseInt(cleaned, 10);
  return isNaN(number) ? 0 : number;
}

// Fonction pour determiner le statut
function determineStatus(statutString) {
  if (!statutString) return 'Disponible';

  const statut = statutString.toLowerCase().trim();

  if (statut.includes('utilisation') || statut.includes('en cours')) {
    return 'En utilisation';
  }
  if (statut.includes('maintenance') || statut.includes('reparation') || statut.includes('panne')) {
    return 'En maintenance';
  }
  if (statut.includes('dispo')) {
    return 'Disponible';
  }

  return 'Disponible';
}

// Fonction pour determiner le type de vehicule
function determineType(typeString, nomString) {
  if (!typeString && !nomString) return 'Utilitaire';

  const combined = (typeString + ' ' + nomString).toLowerCase();

  if (combined.includes('fourgon') || combined.includes('ducato')) {
    return 'Fourgon';
  }

  return 'Utilitaire';
}

// Fonction pour parser une date au format francais ou ISO
function parseDate(dateString) {
  if (!dateString) return null;

  // Essayer le format francais DD/MM/YYYY
  const frMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frMatch) {
    const [, day, month, year] = frMatch;
    return new Date(year, parseInt(month) - 1, parseInt(day));
  }

  // Essayer le format ISO YYYY-MM-DD
  const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(dateString);
  }

  return null;
}

// Fonction pour parser le CSV des vehicules
function parseVehiculesCSV(csvContent, columnMapping) {
  // Enlever le BOM si present
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.substring(1);
  }

  const lines = csvContent.split('\n');
  const vehicules = [];
  let skippedCount = 0;

  console.log(`Total de lignes dans le CSV: ${lines.length}`);

  // La premiere ligne est l'en-tete
  const header = parseCSVLine(lines[0]);
  console.log('\nColonnes detectees:');
  header.forEach((col, i) => console.log(`  ${i}: ${col}`));

  // Utiliser le mapping fourni ou les indices par defaut
  const mapping = columnMapping || {
    nom: 0,
    marque: 1,
    type: 2,
    immatriculation: 3,
    statut: 4,
    kilometrage: 5,
    notes: 6
  };

  // Commencer a la ligne 1 (apres l'en-tete)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);

    const nom = columns[mapping.nom]?.trim() || '';
    const marque = columns[mapping.marque]?.trim() || '';
    const typeVehicule = columns[mapping.type]?.trim() || '';
    const immatriculation = columns[mapping.immatriculation]?.trim() || '';
    const statut = columns[mapping.statut]?.trim() || '';
    const kilometrage = columns[mapping.kilometrage]?.trim() || '';
    const notes = columns[mapping.notes]?.trim() || '';

    // Le nom est obligatoire
    if (!nom) {
      skippedCount++;
      continue;
    }

    const parsedKm = parseKilometrage(kilometrage);

    vehicules.push({
      nom: nom,
      marque: marque || undefined,
      typeVehicule: determineType(typeVehicule, nom),
      immatriculation: immatriculation || undefined,
      statut: determineStatus(statut),
      kilometrageActuel: parsedKm,
      historiqueKilometrage: parsedKm > 0 ? [{
        date: new Date(),
        valeur: parsedKm,
        notes: 'Import initial'
      }] : [],
      notes: notes || undefined,
      ligneOrigine: i + 1
    });
  }

  console.log(`\nLignes ignorees (pas de nom): ${skippedCount}`);

  return vehicules;
}

async function importVehicules() {
  try {
    // Connexion a MongoDB
    console.log('Connexion a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connecte\n');

    // Chemin du fichier CSV
    const csvPath = path.join(__dirname, 'vehicules.csv');

    // Verifier si le fichier existe
    if (!fs.existsSync(csvPath)) {
      console.error('Fichier CSV introuvable');
      console.log('Chemin attendu:', csvPath);
      console.log('\nCreez un fichier vehicules.csv avec les colonnes:');
      console.log('  Nom, Marque, Type, Immatriculation, Statut, Kilometrage, Notes');
      console.log('\nExemple:');
      console.log('  Berlingo,Citroen,Utilitaire,AB-123-CD,Disponible,165241,Vehicule principal');
      process.exit(1);
    }

    // Lire le fichier CSV
    console.log('Lecture du fichier CSV des vehicules...');
    console.log('Chemin:', csvPath, '\n');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Vous pouvez personnaliser le mapping des colonnes ici
    // const columnMapping = { nom: 0, marque: 1, type: 2, immatriculation: 3, statut: 4, kilometrage: 5, notes: 6 };
    const vehicules = parseVehiculesCSV(csvContent, null);

    console.log(`\n${vehicules.length} vehicules valides trouves dans le CSV\n`);

    // Afficher un apercu
    console.log('Apercu des vehicules:');
    vehicules.slice(0, 5).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.nom} ${v.marque || ''} - ${v.typeVehicule} - ${v.statut} - ${v.kilometrageActuel} km`);
    });
    console.log('');

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];

    // Importer chaque vehicule
    for (let i = 0; i < vehicules.length; i++) {
      const vehiculeData = vehicules[i];

      try {
        // Verifier si le vehicule existe deja (par immatriculation si definie)
        let existingVehicule = null;
        if (vehiculeData.immatriculation) {
          existingVehicule = await Vehicule.findOne({
            immatriculation: vehiculeData.immatriculation
          });
        }

        if (existingVehicule) {
          duplicateCount++;
          if (duplicateCount <= 5) {
            console.log(`Doublon (ligne ${vehiculeData.ligneOrigine}): ${vehiculeData.nom} - ${vehiculeData.immatriculation}`);
          }
          continue;
        }

        // Creer le nouveau vehicule
        const newVehicule = new Vehicule(vehiculeData);
        await newVehicule.save();
        importedCount++;

        if (importedCount <= 10) {
          console.log(`Importe (ligne ${vehiculeData.ligneOrigine}): ${vehiculeData.nom} ${vehiculeData.marque || ''}`);
        } else if (importedCount === 11) {
          console.log(`... (affichage limite aux 10 premiers)`);
        }

      } catch (error) {
        errorCount++;
        const errorMsg = `Ligne ${vehiculeData.ligneOrigine} (${vehiculeData.nom}): ${error.message}`;
        errors.push(errorMsg);
        if (errorCount <= 10) {
          console.error(`Erreur: ${errorMsg}`);
        }
      }
    }

    // Resume
    console.log('\n' + '='.repeat(60));
    console.log('RESUME DE L\'IMPORTATION');
    console.log('='.repeat(60));
    console.log(`Vehicules importes avec succes: ${importedCount}`);
    console.log(`Vehicules deja existants (doublons): ${duplicateCount}`);
    console.log(`Erreurs: ${errorCount}`);
    console.log(`Total traite: ${vehicules.length}`);

    if (errors.length > 0) {
      console.log('\nDetail des erreurs (max 10):');
      errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
      if (errors.length > 10) {
        console.log(`  ... et ${errors.length - 10} autres erreurs`);
      }
    }

    console.log('\nImportation terminee!');

  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Connexion MongoDB fermee');
  }
}

// Lancer l'importation
importVehicules();
