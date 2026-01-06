require('dotenv').config();
const mongoose = require('mongoose');
const Intervention = require('../models/Intervention');
const Client = require('../models/Client');
const fs = require('fs');
const path = require('path');

// Toutes les fonctions utilitaires du script d'import
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s'\(\)\-]/g, '');
  if (cleaned.startsWith('+33')) {
    cleaned = '0' + cleaned.substring(3);
  }
  cleaned = cleaned.replace(/[^\d]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned;
  }
  return '';
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[€\s]/g, '').replace(',', '.');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d+)\s+(\w+)\s+(\d{4})/);
  if (!match) return null;

  const day = match[1];
  const monthName = match[2].toLowerCase();
  const year = match[3];

  const months = {
    'janvier': 0, 'fevrier': 1, 'février': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'aout': 7, 'août': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'decembre': 11, 'décembre': 11
  };

  const month = months[monthName];
  if (month === undefined) return null;
  return new Date(year, month, day);
}

function parseNomComplet(nomComplet) {
  if (!nomComplet) return { nom: 'INCONNU', prenom: '' };
  let cleaned = nomComplet.split(/\s+(Patisserie|chocolaterie|SARL|TEXTURES)/i)[0].trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return { nom: parts[0], prenom: '' };
  }
  const nom = parts[0];
  const prenom = parts.slice(1).join(' ');
  return { nom, prenom };
}

function parseAdresse(adresseStr) {
  if (!adresseStr) return { adresse: '', codePostal: '', ville: '' };
  const cleaned = adresseStr.replace(/\n/g, ', ').trim();
  const cpMatch = cleaned.match(/\b(\d{5})\b/);
  const codePostal = cpMatch ? cpMatch[1] : '';

  let ville = '';
  if (cpMatch) {
    const afterCP = cleaned.substring(cpMatch.index + 5).trim();
    ville = afterCP.split(',')[0].trim();
  }

  let adresse = cleaned;
  if (cpMatch) {
    adresse = cleaned.substring(0, cpMatch.index).trim();
    if (adresse.endsWith(',')) {
      adresse = adresse.slice(0, -1).trim();
    }
  }

  return { adresse, codePostal, ville };
}

function mapStatut(etatNotion) {
  if (!etatNotion) return 'Demande';
  const etatLower = etatNotion.toLowerCase().trim();

  if (etatLower.includes('terminer') || etatLower.includes('terminé') ||
      etatLower.includes('récupérer') || etatLower.includes('recuperer') ||
      etatLower.includes('appareil réparer') || etatLower.includes('appareil réparé') ||
      etatLower === 'stock mag') {
    return 'Terminé';
  }

  if (etatLower.includes('facture à faire') || etatLower.includes('facturé') ||
      etatLower === 'facturé') {
    return 'Facturé';
  }

  if (etatLower.includes('réparation') || etatLower.includes('reparation') ||
      etatLower === 'changement de pièces neuve') {
    return 'Réparation';
  }

  if (etatLower.includes('attente diagnostic') || etatLower.includes('attente pièces') ||
      etatLower.includes('attente réponse devis') || etatLower.includes('devis à faire')) {
    return 'Diagnostic';
  }

  if (etatLower.includes('attente rdv') || etatLower.includes('attente récup') ||
      etatLower.includes('attente relivr')) {
    return 'Planifié';
  }

  if (etatLower.includes('en cours') || etatLower === 'installation' ||
      etatLower.includes('demande de pièces seules en cours')) {
    return 'En cours';
  }

  if (etatLower.includes('annulé') || etatLower.includes('refusé') ||
      etatLower.includes('non réparable') || etatLower.includes('pièces épuisé') ||
      etatLower.includes('défaut non constater')) {
    return 'Demande';
  }

  return 'Demande';
}

function mapTypeIntervention(typeReservation) {
  if (!typeReservation) return 'Atelier';
  if (typeReservation.toLowerCase().includes('domicile') ||
      typeReservation.toLowerCase().includes('enlèvement')) {
    return 'Domicile';
  }
  return 'Atelier';
}

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
  columns.push(current);
  return columns;
}

async function fullReimport() {
  try {
    console.log('🚀 SCRIPT DE RÉ-IMPORT COMPLET\n');
    console.log('📡 Connexion à MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté\n');

    // ÉTAPE 1: Suppression des interventions
    console.log('🗑️  ÉTAPE 1/3: Suppression des interventions existantes...');
    const deleteResult = await Intervention.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} interventions supprimées\n`);

    // ÉTAPE 2: Import des interventions
    console.log('📥 ÉTAPE 2/3: Import des interventions...');

    const csvPath = path.join(__dirname, 'import', 'BASE DE DONNEES faf10259c8874855a9f680c7ceab019b.csv');
    let csvContent = fs.readFileSync(csvPath, 'utf-8');
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.substring(1);
    }

    const lines = csvContent.split('\n');
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    const colMap = {};
    headers.forEach((h, i) => {
      colMap[h.trim()] = i;
    });

    let stats = {
      interventionsCreated: 0,
      clientsCreated: 0,
      appareilsAdded: 0,
      skipped: 0,
      errors: 0
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const cols = parseCSVLine(line);

        const nomComplet = cols[colMap['Nom']] || cols[colMap['Nom de famille']] || '';
        const adresseComplete = cols[colMap['Adresse']] || '';
        const telephone = cleanPhoneNumber(cols[colMap['Téléphone']] || '');
        const email = cols[colMap['E-mail']] || '';

        const typeAppareil = cols[colMap['Type d\'appareil']] || '';
        const marque = cols[colMap['Marque']] || '';
        const modele = cols[colMap['Modèle']] || '';
        const numeroSerie = cols[colMap['S/N']] || '';
        const reference = cols[colMap['Reference']] || '';

        const symptome = cols[colMap['Symptôme']] || '';
        const diagnostic = cols[colMap['Diagnostic']] || '';
        const etat = cols[colMap['État']] || '';
        const typeReservation = cols[colMap['Type de réservation']] || '';
        const dateEntree = parseDate(cols[colMap['Date d\'entrée']] || '');
        const dateSortie = parseDate(cols[colMap['Date de sortie']] || '');

        const nomPiece1 = cols[colMap['Nom de la pièces / composant']] || '';
        const refPiece1 = cols[colMap['Ref de la pièces / composant']] || '';
        const prixPiece1 = parsePrice(cols[colMap['Prix pièces / composant']] || '');
        const qtyPiece1 = parseInt(cols[colMap['Quantité pièces']] || '0');

        const nomPiece2 = cols[colMap['Nom de la pièces / composant (2)']] || '';
        const refPiece2 = cols[colMap['Ref de la pièces / composant (2)']] || '';
        const prixPiece2 = parsePrice(cols[colMap['Prix pièces / composant (2)']] || '');
        const qtyPiece2 = parseInt(cols[colMap['Quantité pièces (2)']] || '0');

        const nomPiece3 = cols[colMap['Nom de la pièces / composant (3)']] || '';
        const refPiece3 = cols[colMap['Ref de la pièces / composant (3)']] || '';
        const prixPiece3 = parsePrice(cols[colMap['Prix pièces / composant (3)']] || '');
        const qtyPiece3 = parseInt(cols[colMap['Quantité pièces (3)']] || '0');

        const forfait = parsePrice(cols[colMap['Forfait']] || '');
        const mainOeuvre = parsePrice(cols[colMap['Montant main d\'œuvre (prix) ']] || '');
        const prixTotal = parsePrice(cols[colMap['Prix totale']] || '');
        const remarque = cols[colMap['Remarque réparation']] || '';

        if (!telephone) {
          stats.skipped++;
          continue;
        }

        if (!typeAppareil) {
          stats.skipped++;
          continue;
        }

        if (!dateEntree && !dateSortie) {
          stats.skipped++;
          continue;
        }

        let client = await Client.findOne({ telephone });

        if (!client) {
          const { nom, prenom } = parseNomComplet(nomComplet);
          const { adresse, codePostal, ville } = parseAdresse(adresseComplete);

          client = new Client({
            nom,
            prenom,
            telephone,
            email,
            adresse,
            codePostal,
            ville,
            appareils: []
          });

          await client.save();
          stats.clientsCreated++;
        }

        let appareilId = null;
        const appareilExistant = client.appareils.find(app =>
          app.type === typeAppareil &&
          app.marque === marque &&
          app.modele === modele &&
          (!numeroSerie || app.numeroSerie === numeroSerie)
        );

        if (appareilExistant) {
          appareilId = appareilExistant._id;
        } else {
          client.appareils.push({
            type: typeAppareil,
            marque,
            modele,
            numeroSerie: numeroSerie || reference
          });

          await client.save();
          appareilId = client.appareils[client.appareils.length - 1]._id;
          stats.appareilsAdded++;
        }

        const piecesUtilisees = [];

        if (nomPiece1 && qtyPiece1 > 0) {
          piecesUtilisees.push({
            pieceId: null,
            nom: nomPiece1,
            reference: refPiece1,
            quantite: qtyPiece1,
            prixUnitaire: prixPiece1
          });
        }

        if (nomPiece2 && qtyPiece2 > 0) {
          piecesUtilisees.push({
            pieceId: null,
            nom: nomPiece2,
            reference: refPiece2,
            quantite: qtyPiece2,
            prixUnitaire: prixPiece2
          });
        }

        if (nomPiece3 && qtyPiece3 > 0) {
          piecesUtilisees.push({
            pieceId: null,
            nom: nomPiece3,
            reference: refPiece3,
            quantite: qtyPiece3,
            prixUnitaire: prixPiece3
          });
        }

        const intervention = new Intervention({
          clientId: client._id,
          appareilId: appareilId,
          appareil: {
            type: typeAppareil,
            marque,
            modele,
            numeroSerie: numeroSerie || reference
          },
          description: symptome,
          diagnostic,
          statut: mapStatut(etat),
          typeIntervention: mapTypeIntervention(typeReservation),
          dateCreation: dateEntree || dateSortie || new Date(2025, 0, 1),
          datePrevue: dateEntree,
          dateRealisation: dateSortie,
          piecesUtilisees,
          forfaitApplique: forfait,
          coutMainOeuvre: mainOeuvre,
          coutTotal: prixTotal,
          notes: remarque,
        });

        await intervention.save();
        stats.interventionsCreated++;

        if (stats.interventionsCreated <= 10 || stats.interventionsCreated % 50 === 0) {
          console.log(`  ${stats.interventionsCreated} interventions créées...`);
        }

      } catch (error) {
        stats.errors++;
        if (stats.errors <= 5) {
          console.error(`❌ Erreur ligne ${i}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Import terminé: ${stats.interventionsCreated} interventions\n`);

    // ÉTAPE 3: Régénération des numéros
    console.log('🔄 ÉTAPE 3/3: Régénération des numéros...');

    const interventions = await Intervention.find({}).sort({ dateCreation: 1 });
    console.log(`📋 ${interventions.length} interventions à renuméroter\n`);

    // Numéros temporaires
    for (let i = 0; i < interventions.length; i++) {
      await Intervention.updateOne(
        { _id: interventions[i]._id },
        { $set: { numero: `TEMP-${String(i + 1).padStart(6, '0')}` } }
      );
    }

    // Numéros définitifs
    const yearCounters = {};
    for (const intervention of interventions) {
      const year = new Date(intervention.dateCreation).getFullYear();
      if (!yearCounters[year]) yearCounters[year] = 0;
      yearCounters[year]++;

      await Intervention.updateOne(
        { _id: intervention._id },
        { $set: { numero: `INT-${year}-${String(yearCounters[year]).padStart(4, '0')}` } }
      );
    }

    console.log('✅ Numéros régénérés\n');
    console.log('='.repeat(60));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(60));
    console.log(`✅ ${stats.interventionsCreated} interventions créées`);
    console.log(`✨ ${stats.clientsCreated} nouveaux clients`);
    console.log(`📱 ${stats.appareilsAdded} appareils ajoutés`);
    console.log(`⏭️  ${stats.skipped} lignes ignorées`);
    console.log(`❌ ${stats.errors} erreurs`);
    console.log('\nRépartition par année:');
    Object.keys(yearCounters).sort().forEach(year => {
      console.log(`  ${year}: ${yearCounters[year]} interventions`);
    });
    console.log('='.repeat(60));
    console.log('\n✨ Ré-import complet terminé!');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connexion MongoDB fermée');
  }
}

fullReimport();
