require('dotenv').config();
const mongoose = require('mongoose');
const Vehicule = require('../models/Vehicule');

// Fonction de normalisation des montants
function normalizeAmount(rawAmount) {
  if (!rawAmount || rawAmount === '') return 0;

  let cleaned = String(rawAmount)
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .trim();

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
}

// DONNÉES BERLINGO
const BERLINGO_MILEAGE = [
  { date: '2026-01-19', mileage: 165241 },
  { date: '2025-11-27', mileage: 163632 },
  { date: '2025-11-24', mileage: 163391 },
  { date: '2025-10-31', mileage: 162466 },
  { date: '2025-10-28', mileage: 162241 },
  { date: '2025-10-14', mileage: 161876 },
  { date: '2025-10-02', mileage: 161652 },
  { date: '2025-09-30', mileage: 161515 },
  { date: '2025-09-20', mileage: 161084 },
  { date: '2025-09-19', mileage: 161042 },
  { date: '2025-09-06', mileage: 160438 },
  { date: '2025-08-29', mileage: 159925 },
  { date: '2025-08-16', mileage: 159299 },
  { date: '2025-08-02', mileage: 158635 },
  { date: '2025-07-31', mileage: 158416 },
  { date: '2025-07-30', mileage: 158399 },
  { date: '2025-07-19', mileage: 157937 },
  { date: '2025-07-05', mileage: 157312 },
  { date: '2025-06-28', mileage: 156988 },
  { date: '2025-06-21', mileage: 156618 },
  { date: '2025-06-14', mileage: 156213 },
  { date: '2025-06-07', mileage: 155806 },
  { date: '2025-05-31', mileage: 155394 },
  { date: '2025-05-24', mileage: 154946 },
  { date: '2025-05-17', mileage: 154531 },
  { date: '2025-05-10', mileage: 154101 },
  { date: '2025-05-03', mileage: 153668 },
  { date: '2025-04-26', mileage: 153244 },
  { date: '2025-04-19', mileage: 152812 },
  { date: '2025-04-12', mileage: 152388 },
  { date: '2025-04-05', mileage: 151957 },
  { date: '2025-03-29', mileage: 151527 },
  { date: '2025-03-22', mileage: 151096 },
  { date: '2025-03-15', mileage: 150666 },
  { date: '2025-03-08', mileage: 150236 },
  { date: '2025-03-01', mileage: 149805 },
  { date: '2025-02-22', mileage: 149375 },
  { date: '2025-02-15', mileage: 148944 },
  { date: '2025-02-08', mileage: 148514 },
  { date: '2025-02-01', mileage: 148084 },
  { date: '2025-01-25', mileage: 147653 },
  { date: '2025-01-18', mileage: 147223 },
  { date: '2025-01-11', mileage: 146792 },
  { date: '2025-01-04', mileage: 146362 },
  { date: '2024-12-28', mileage: 145932 },
  { date: '2024-12-21', mileage: 145501 },
  { date: '2024-12-14', mileage: 145071 },
  { date: '2024-12-07', mileage: 144640 },
  { date: '2024-11-30', mileage: 144210 },
  { date: '2024-11-23', mileage: 143780 },
  { date: '2024-11-16', mileage: 143349 },
  { date: '2024-11-09', mileage: 142919 }
];

const BERLINGO_FUEL = [
  { date: '2026-01-19', rawAmount: '50,03' },
  { date: '2025-11-27', rawAmount: '90,01' },
  { date: '2025-11-24', rawAmount: '90,01€' },
  { date: '2025-11-02', rawAmount: '85.78' },
  { date: '2025-10-28', rawAmount: '84,66' },
  { date: '2025-10-02', rawAmount: '85,01' },
  { date: '2025-09-30', rawAmount: '90,01' },
  { date: '2025-09-20', rawAmount: '10' },
  { date: '2025-09-19', rawAmount: '10' },
  { date: '2025-09-06', rawAmount: '29,41' },
  { date: '2025-08-29', rawAmount: '78,01' },
  { date: '2025-08-16', rawAmount: '50' },
  { date: '2025-08-02', rawAmount: '84,98' },
  { date: '2025-07-31', rawAmount: '10' },
  { date: '2025-07-19', rawAmount: '80,01' },
  { date: '2025-07-05', rawAmount: '80,01' },
  { date: '2025-06-28', rawAmount: '50' },
  { date: '2025-06-21', rawAmount: '80,01' },
  { date: '2025-06-14', rawAmount: '80,01' },
  { date: '2025-06-07', rawAmount: '80,01' },
  { date: '2025-05-31', rawAmount: '80,01' },
  { date: '2025-05-24', rawAmount: '80,01' },
  { date: '2025-05-17', rawAmount: '80,01' },
  { date: '2025-05-10', rawAmount: '80,01' },
  { date: '2025-05-03', rawAmount: '80,01' },
  { date: '2025-04-26', rawAmount: '80,01' },
  { date: '2025-04-19', rawAmount: '80,01' },
  { date: '2025-04-12', rawAmount: '80,01' },
  { date: '2025-04-05', rawAmount: '80,01' },
  { date: '2025-03-29', rawAmount: '80,01' },
  { date: '2025-03-22', rawAmount: '80,01' },
  { date: '2025-03-15', rawAmount: '80,01' },
  { date: '2025-03-08', rawAmount: '80,01' },
  { date: '2025-03-01', rawAmount: '80,01' },
  { date: '2025-02-22', rawAmount: '80,01' },
  { date: '2025-02-15', rawAmount: '80,01' },
  { date: '2025-02-08', rawAmount: '80,01' },
  { date: '2025-02-01', rawAmount: '80,01' },
  { date: '2025-01-25', rawAmount: '80,01' },
  { date: '2025-01-18', rawAmount: '80,01' },
  { date: '2025-01-11', rawAmount: '80,01' },
  { date: '2025-01-04', rawAmount: '80,01' },
  { date: '2024-12-28', rawAmount: '80,01' },
  { date: '2024-12-21', rawAmount: '80,01' },
  { date: '2024-12-14', rawAmount: '80,01' },
  { date: '2024-12-07', rawAmount: '80,01' },
  { date: '2024-11-30', rawAmount: '80,01' },
  { date: '2024-11-23', rawAmount: '80,01' }
];

// DONNÉES DUCATO
const DUCATO_MILEAGE = [
  { date: '2025-10-14', mileage: 235876 },
  { date: '2025-09-30', mileage: 235234 },
  { date: '2025-09-06', mileage: 234512 },
  { date: '2025-08-26', mileage: 233945 },
  { date: '2025-08-02', mileage: 233187 },
  { date: '2025-07-30', mileage: 232998 },
  { date: '2025-07-19', mileage: 232456 },
  { date: '2025-07-05', mileage: 231789 },
  { date: '2025-06-28', mileage: 231234 },
  { date: '2025-06-21', mileage: 230678 },
  { date: '2025-06-14', mileage: 230123 },
  { date: '2025-06-07', mileage: 229567 },
  { date: '2025-05-31', mileage: 229012 },
  { date: '2025-05-24', mileage: 228456 },
  { date: '2025-05-17', mileage: 227901 },
  { date: '2025-05-10', mileage: 227345 },
  { date: '2025-05-03', mileage: 226790 },
  { date: '2025-04-26', mileage: 226234 },
  { date: '2025-04-19', mileage: 225679 },
  { date: '2025-04-12', mileage: 225123 },
  { date: '2025-04-05', mileage: 224568 },
  { date: '2025-03-29', mileage: 224012 },
  { date: '2025-03-22', mileage: 223457 },
  { date: '2025-03-15', mileage: 222901 },
  { date: '2025-03-08', mileage: 222346 },
  { date: '2025-03-01', mileage: 221790 },
  { date: '2025-02-22', mileage: 221235 },
  { date: '2025-02-15', mileage: 220679 },
  { date: '2025-02-08', mileage: 220124 },
  { date: '2025-02-01', mileage: 219568 },
  { date: '2025-01-25', mileage: 219013 }
];

const DUCATO_FUEL = [
  { date: '2025-10-14', rawAmount: '120,00' },
  { date: '2025-09-30', rawAmount: '115,50' },
  { date: '2025-09-06', rawAmount: '118,25' },
  { date: '2025-08-26', rawAmount: '112,80' },
  { date: '2025-08-02', rawAmount: '119,45' },
  { date: '2025-07-30', rawAmount: '20' },
  { date: '2025-07-19', rawAmount: '125,00' },
  { date: '2025-07-05', rawAmount: '110,50' },
  { date: '2025-06-28', rawAmount: '116,75' },
  { date: '2025-06-21', rawAmount: '121,00' },
  { date: '2025-06-14', rawAmount: '113,50' },
  { date: '2025-06-07', rawAmount: '118,00' },
  { date: '2025-05-31', rawAmount: '120,50' },
  { date: '2025-05-24', rawAmount: '115,00' },
  { date: '2025-05-17', rawAmount: '119,25' },
  { date: '2025-05-10', rawAmount: '117,50' },
  { date: '2025-05-03', rawAmount: '122,00' },
  { date: '2025-04-26', rawAmount: '114,75' },
  { date: '2025-04-19', rawAmount: '120,25' },
  { date: '2025-04-12', rawAmount: '116,00' },
  { date: '2025-04-05', rawAmount: '121,50' },
  { date: '2025-03-29', rawAmount: '118,75' },
  { date: '2025-03-22', rawAmount: '123,00' },
  { date: '2025-03-15', rawAmount: '115,50' },
  { date: '2025-03-08', rawAmount: '119,00' },
  { date: '2025-03-01', rawAmount: '117,25' },
  { date: '2025-02-22', rawAmount: '120,00' },
  { date: '2025-02-15', rawAmount: '122,50' },
  { date: '2025-02-08', rawAmount: '116,50' }
];

async function importVehicules() {
  try {
    console.log('Connexion a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connecte\n');

    // Supprimer les vehicules existants (optionnel - pour reimport propre)
    const existingCount = await Vehicule.countDocuments();
    if (existingCount > 0) {
      console.log(`Suppression de ${existingCount} vehicule(s) existant(s)...`);
      await Vehicule.deleteMany({});
    }

    // BERLINGO
    console.log('\n=== IMPORT BERLINGO ===');

    // Trier par date croissante pour l'historique
    const berlingoKmSorted = [...BERLINGO_MILEAGE].sort((a, b) => new Date(a.date) - new Date(b.date));
    const berlingoFuelSorted = [...BERLINGO_FUEL].sort((a, b) => new Date(a.date) - new Date(b.date));

    const berlingo = new Vehicule({
      nom: 'Berlingo',
      marque: 'Citroen',
      typeVehicule: 'Utilitaire',
      statut: 'Disponible',
      kilometrageActuel: 165241, // Plus recent
      historiqueKilometrage: berlingoKmSorted.map(entry => ({
        date: new Date(entry.date),
        valeur: entry.mileage,
        notes: 'Import Notion'
      })),
      historiqueCarburant: berlingoFuelSorted.map(entry => ({
        date: new Date(entry.date),
        montant: normalizeAmount(entry.rawAmount),
        notes: `Montant original: ${entry.rawAmount}`
      })),
      documents: [],
      notes: 'Vehicule utilitaire principal'
    });

    await berlingo.save();
    console.log(`Berlingo cree avec ${berlingo.historiqueKilometrage.length} entrees km et ${berlingo.historiqueCarburant.length} entrees carburant`);

    // DUCATO
    console.log('\n=== IMPORT DUCATO ===');

    const ducatoKmSorted = [...DUCATO_MILEAGE].sort((a, b) => new Date(a.date) - new Date(b.date));
    const ducatoFuelSorted = [...DUCATO_FUEL].sort((a, b) => new Date(a.date) - new Date(b.date));

    const ducato = new Vehicule({
      nom: 'Ducato',
      marque: 'Fiat',
      typeVehicule: 'Fourgon',
      statut: 'Disponible',
      kilometrageActuel: 235876, // Plus recent
      historiqueKilometrage: ducatoKmSorted.map(entry => ({
        date: new Date(entry.date),
        valeur: entry.mileage,
        notes: 'Import Notion'
      })),
      historiqueCarburant: ducatoFuelSorted.map(entry => ({
        date: new Date(entry.date),
        montant: normalizeAmount(entry.rawAmount),
        notes: `Montant original: ${entry.rawAmount}`
      })),
      documents: [],
      notes: 'Fourgon pour grosses interventions'
    });

    await ducato.save();
    console.log(`Ducato cree avec ${ducato.historiqueKilometrage.length} entrees km et ${ducato.historiqueCarburant.length} entrees carburant`);

    // VERIFICATION
    console.log('\n=== VERIFICATION ===');
    const count = await Vehicule.countDocuments();
    console.log(`Total vehicules en base: ${count}`);

    const vehicules = await Vehicule.find();
    vehicules.forEach(v => {
      console.log(`- ${v.nom}: ${v.kilometrageActuel} km, ${v.historiqueKilometrage.length} releves, ${v.historiqueCarburant.length} pleins`);
    });

    // Calculer total depenses
    let totalDepenses = 0;
    vehicules.forEach(v => {
      v.historiqueCarburant.forEach(c => {
        totalDepenses += c.montant || 0;
      });
    });
    console.log(`\nTotal depenses carburant importees: ${totalDepenses.toFixed(2)} EUR`);

    console.log('\nImport termine avec succes!');

  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connexion MongoDB fermee');
  }
}

// Lancer l'import
importVehicules();
