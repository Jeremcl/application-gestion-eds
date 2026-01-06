require('dotenv').config();
const mongoose = require('mongoose');
const Intervention = require('../models/Intervention');

async function fixInterventionNumbers() {
  try {
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté\n');

    // Récupérer toutes les interventions triées par date de création
    console.log('📋 Récupération de toutes les interventions...');
    const interventions = await Intervention.find({}).sort({ dateCreation: 1 });
    console.log(`✅ ${interventions.length} interventions trouvées\n`);

    // Grouper par année et régénérer les numéros
    const yearCounters = {};
    let updated = 0;

    console.log('🔄 Étape 1: Attribution de numéros temporaires...\n');

    // Première passe : mettre des numéros temporaires pour éviter les conflits
    for (let i = 0; i < interventions.length; i++) {
      const intervention = interventions[i];
      const tempNumero = `TEMP-${String(i + 1).padStart(6, '0')}`;

      await Intervention.updateOne(
        { _id: intervention._id },
        { $set: { numero: tempNumero } }
      );

      if ((i + 1) <= 10) {
        console.log(`  ${intervention.numero} → ${tempNumero}`);
      } else if ((i + 1) === 11) {
        console.log('  ... (affichage limité aux 10 premières)');
      }
    }

    console.log(`\n✅ ${interventions.length} numéros temporaires attribués\n`);
    console.log('🔄 Étape 2: Régénération des numéros définitifs...\n');

    // Deuxième passe : attribuer les vrais numéros par année
    for (const intervention of interventions) {
      const year = new Date(intervention.dateCreation).getFullYear();

      // Initialiser le compteur pour cette année si nécessaire
      if (!yearCounters[year]) {
        yearCounters[year] = 0;
      }

      yearCounters[year]++;
      const newNumero = `INT-${year}-${String(yearCounters[year]).padStart(4, '0')}`;

      // Mettre à jour sans déclencher le hook pre-save
      await Intervention.updateOne(
        { _id: intervention._id },
        { $set: { numero: newNumero } }
      );

      updated++;

      if (updated <= 10) {
        console.log(`  TEMP-xxx → ${newNumero} (${new Date(intervention.dateCreation).toLocaleDateString('fr-FR')})`);
      } else if (updated === 11) {
        console.log('  ... (affichage limité aux 10 premières)');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`✅ ${updated} numéros d'intervention mis à jour`);
    console.log('\nRépartition par année:');
    Object.keys(yearCounters).sort().forEach(year => {
      console.log(`  ${year}: ${yearCounters[year]} interventions`);
    });
    console.log('='.repeat(60));

    console.log('\n✨ Régénération terminée!');

  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connexion MongoDB fermée');
  }
}

fixInterventionNumbers();
