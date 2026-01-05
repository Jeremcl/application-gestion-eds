require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Client = require('../models/Client');
const Intervention = require('../models/Intervention');

// Fonction pour nettoyer un numéro de téléphone (même que importClients.js)
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

// Fonction pour parser un prix (ex: "207,28 €" -> 207.28)
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[€\s]/g, '').replace(',', '.');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

// Fonction pour parser une date
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Format: "17 janvier 2026 14:00 (UTC+1) → 15:00" ou "20 décembre 2025"
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
  if (month === undefined) {
    console.log(`⚠️  Mois non reconnu: "${monthName}" dans "${dateStr}"`);
    return null;
  }

  return new Date(year, month, day);
}

// Fonction pour parser le nom complet (peut être "NOM Prenom" ou "NOM Prenom + Info")
function parseNomComplet(nomComplet) {
  if (!nomComplet) return { nom: 'INCONNU', prenom: '' };

  // Enlever les infos entre parenthèses ou après certains mots-clés
  let cleaned = nomComplet.split(/\s+(Patisserie|chocolaterie|SARL|TEXTURES)/i)[0].trim();

  const parts = cleaned.split(/\s+/);

  if (parts.length === 1) {
    return { nom: parts[0], prenom: '' };
  }

  // Premier mot = NOM, reste = prénom
  const nom = parts[0];
  const prenom = parts.slice(1).join(' ');

  return { nom, prenom };
}

// Fonction pour parser l'adresse (peut être multiligne)
function parseAdresse(adresseStr) {
  if (!adresseStr) return { adresse: '', codePostal: '', ville: '' };

  // Nettoyer les sauts de ligne
  const cleaned = adresseStr.replace(/\n/g, ', ').trim();

  // Chercher le code postal (5 chiffres)
  const cpMatch = cleaned.match(/\b(\d{5})\b/);
  const codePostal = cpMatch ? cpMatch[1] : '';

  // La ville est souvent après le code postal
  let ville = '';
  if (cpMatch) {
    const afterCP = cleaned.substring(cpMatch.index + 5).trim();
    // Prendre jusqu'à la virgule ou la fin
    ville = afterCP.split(',')[0].trim();
  }

  // L'adresse est tout ce qui est avant le code postal
  let adresse = cleaned;
  if (cpMatch) {
    adresse = cleaned.substring(0, cpMatch.index).trim();
    // Enlever la virgule finale si présente
    if (adresse.endsWith(',')) {
      adresse = adresse.slice(0, -1).trim();
    }
  }

  return { adresse, codePostal, ville };
}

// Fonction pour mapper le statut Notion vers notre enum
function mapStatut(etatNotion) {
  if (!etatNotion) return 'Demande';

  const statuts = {
    'Attente rdv': 'Planifié',
    'Attente diagnostic': 'Diagnostic',
    'En réparation': 'Réparation',
    'Terminé': 'Terminé',
    'Facturé': 'Facturé',
    'RDV annulé': 'Demande',
    'Appareil récupérer': 'Terminé'
  };

  return statuts[etatNotion] || 'Demande';
}

// Fonction pour mapper le type de réservation vers notre type d'intervention
function mapTypeIntervention(typeReservation) {
  if (!typeReservation) return 'Atelier';

  if (typeReservation.toLowerCase().includes('domicile') ||
      typeReservation.toLowerCase().includes('enlèvement')) {
    return 'Domicile';
  }

  return 'Atelier';
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

  columns.push(current);
  return columns;
}

async function importInterventions() {
  try {
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté\n');

    // Chemin du fichier CSV
    const csvPath = path.join(__dirname, 'import', 'BASE DE DONNEES faf10259c8874855a9f680c7ceab019b.csv');

    if (!fs.existsSync(csvPath)) {
      console.error('❌ Fichier CSV introuvable:', csvPath);
      process.exit(1);
    }

    console.log('📖 Lecture du fichier CSV...');
    let csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Enlever le BOM si présent
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.substring(1);
    }

    const lines = csvContent.split('\n');
    console.log(`📋 Total de lignes: ${lines.length}\n`);

    // Lire l'en-tête pour comprendre les colonnes
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    console.log('📑 Colonnes détectées:');
    const colMap = {};
    headers.forEach((h, i) => {
      const header = h.trim();
      colMap[header] = i;
      if (i < 20) console.log(`   ${i}: ${header}`);
    });
    console.log('   ... (voir CSV pour plus)\n');

    let stats = {
      total: 0,
      interventionsCreated: 0,
      clientsNotFound: 0,
      clientsCreated: 0,
      appareilsAdded: 0,
      errors: 0,
      skipped: 0
    };

    // Traiter chaque ligne (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      stats.total++;

      try {
        const cols = parseCSVLine(line);

        // Extraire les données importantes
        const nomComplet = cols[colMap['Nom']] || cols[colMap['Nom de famille']] || '';
        const adresseComplete = cols[colMap['Adresse']] || '';
        const telephone = cleanPhoneNumber(cols[colMap['Téléphone']] || '');
        const email = cols[colMap['E-mail']] || '';

        // Données appareil
        const typeAppareil = cols[colMap['Type d\'appareil']] || '';
        const marque = cols[colMap['Marque']] || '';
        const modele = cols[colMap['Modèle']] || '';
        const numeroSerie = cols[colMap['S/N']] || '';
        const reference = cols[colMap['Reference']] || '';

        // Données intervention
        const symptome = cols[colMap['Symptôme']] || '';
        const diagnostic = cols[colMap['Diagnostic']] || '';
        const etat = cols[colMap['État']] || '';
        const typeReservation = cols[colMap['Type de réservation']] || '';
        const dateEntree = parseDate(cols[colMap['Date d\'entrée']] || '');
        const dateSortie = parseDate(cols[colMap['Date de sortie']] || '');
        const typeReglement = cols[colMap['Type de règlement']] || '';

        // Pièces
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

        // Prix
        const forfait = parsePrice(cols[colMap['Forfait']] || '');
        const mainOeuvre = parsePrice(cols[colMap['Montant main d\'œuvre (prix) ']] || '');
        const prixTotal = parsePrice(cols[colMap['Prix totale']] || '');

        // Remarques
        const remarque = cols[colMap['Remarque réparation']] || '';

        // Vérifier données minimales
        if (!telephone) {
          stats.skipped++;
          if (stats.skipped <= 10) {
            console.log(`⏭️  Ligne ${i + 1} ignorée: pas de téléphone valide`);
          }
          continue;
        }

        if (!typeAppareil) {
          stats.skipped++;
          if (stats.skipped <= 10) {
            console.log(`⏭️  Ligne ${i + 1} ignorée: pas de type d'appareil (${nomComplet || 'inconnu'})`);
          }
          continue;
        }

        // Chercher le client par téléphone
        let client = await Client.findOne({ telephone });

        if (!client) {
          // Client pas trouvé, le créer
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

          if (stats.clientsCreated <= 5) {
            console.log(`✨ Client créé: ${nom} ${prenom} (${telephone})`);
          }
        }

        // Vérifier si l'appareil existe déjà
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
          // Ajouter l'appareil au client
          client.appareils.push({
            type: typeAppareil,
            marque,
            modele,
            numeroSerie: numeroSerie || reference
          });

          await client.save();

          // Récupérer l'ID du nouvel appareil
          appareilId = client.appareils[client.appareils.length - 1]._id;
          stats.appareilsAdded++;

          if (stats.appareilsAdded <= 5) {
            console.log(`  📱 Appareil ajouté: ${typeAppareil} ${marque} ${modele}`);
          }
        }

        // Préparer les pièces utilisées
        const piecesUtilisees = [];

        if (nomPiece1 && qtyPiece1 > 0) {
          piecesUtilisees.push({
            pieceId: null,  // Pas de catalogue pour l'instant
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

        // Vérifier qu'on a au moins une date valide
        if (!dateEntree && !dateSortie) {
          stats.skipped++;
          if (stats.skipped <= 15) {
            console.log(`⏭️  Ligne ${i + 1} ignorée: pas de date valide (${nomComplet})`);
          }
          continue;
        }

        // Créer l'intervention
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
          dateCreation: dateEntree || dateSortie || new Date(2025, 0, 1), // Fallback: 1er janvier 2025
          datePrevue: dateEntree,
          dateRealisation: dateSortie,
          piecesUtilisees,
          forfaitApplique: forfait,
          coutMainOeuvre: mainOeuvre,
          coutTotal: prixTotal,
          notes: remarque,
          // Le modèle calculera automatiquement coutPieces et coutTotal via le pre-save
        });

        await intervention.save();
        stats.interventionsCreated++;

        if (stats.interventionsCreated <= 10) {
          console.log(`✅ Intervention créée: ${intervention.numero} - ${client.nom} - ${typeAppareil}`);
        } else if (stats.interventionsCreated === 11) {
          console.log(`... (affichage limité)`);
        }

      } catch (error) {
        stats.errors++;
        if (stats.errors <= 10) {
          console.error(`❌ Ligne ${i + 1}: ${error.message}`);
        }
      }
    }

    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE L\'IMPORTATION');
    console.log('='.repeat(60));
    console.log(`📋 Lignes traitées: ${stats.total}`);
    console.log(`✅ Interventions créées: ${stats.interventionsCreated}`);
    console.log(`✨ Nouveaux clients créés: ${stats.clientsCreated}`);
    console.log(`📱 Appareils ajoutés: ${stats.appareilsAdded}`);
    console.log(`⏭️  Lignes ignorées: ${stats.skipped}`);
    console.log(`❌ Erreurs: ${stats.errors}`);
    console.log('='.repeat(60));

    console.log('\n✨ Import terminé!');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connexion MongoDB fermée');
  }
}

// Lancer l'import
importInterventions();
