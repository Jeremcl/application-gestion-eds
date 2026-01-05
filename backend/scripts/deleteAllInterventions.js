require('dotenv').config();
const mongoose = require('mongoose');
const Intervention = require('../models/Intervention');

async function deleteAllInterventions() {
  try {
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté\n');

    // Compter les interventions
    const count = await Intervention.countDocuments();
    console.log(`📋 ${count} interventions trouvées\n`);

    // Demander confirmation (ce script doit être lancé manuellement)
    console.log('⚠️  ATTENTION: Ce script va supprimer TOUTES les interventions !');
    console.log('⚠️  Les clients et appareils seront conservés.\n');

    // Supprimer toutes les interventions
    const result = await Intervention.deleteMany({});
    console.log(`✅ ${result.deletedCount} interventions supprimées\n`);

    console.log('✨ Suppression terminée!');
    console.log('💡 Vous pouvez maintenant relancer le script d\'import avec:');
    console.log('   node scripts/importInterventions.js');

  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connexion MongoDB fermée');
  }
}

deleteAllInterventions();
