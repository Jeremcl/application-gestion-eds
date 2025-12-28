require('dotenv').config();
const mongoose = require('mongoose');

// Schéma User (copié du modèle)
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  nom: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'tech'],
    default: 'tech'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

async function createUsers() {
  try {
    // URL de connexion MongoDB interne VPS
    const MONGODB_URI = 'mongodb://eds22user:wdaujzphftw0scyq@6fd0a3003233:27017/eds22?authSource=admin';

    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connecté');

    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`⚠️  ${existingUsers} utilisateur(s) déjà présent(s) dans la base`);
      console.log('Voulez-vous les supprimer et recréer? (Ce script va supprimer tous les utilisateurs)');
      console.log('Si vous voulez conserver les utilisateurs existants, arrêtez ce script (Ctrl+C)');
      console.log('Sinon, attendez 3 secondes...');

      // Attendre 3 secondes
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Supprimer les utilisateurs existants
      await User.deleteMany({});
      console.log('🗑️  Utilisateurs existants supprimés');
    }

    // Créer l'utilisateur admin
    const admin = await User.create({
      email: 'admin@eds22.com',
      password: 'admin123',
      nom: 'Administrateur EDS22',
      role: 'admin'
    });
    console.log('✅ Admin créé: admin@eds22.com / admin123');

    // Créer les utilisateurs techniciens
    const jeremy = await User.create({
      email: 'jeremy@eds22.com',
      password: 'jeremy123',
      nom: 'Jérémy',
      role: 'tech'
    });
    console.log('✅ Technicien créé: jeremy@eds22.com / jeremy123');

    const stephane = await User.create({
      email: 'stephane@eds22.com',
      password: 'stephane123',
      nom: 'Stéphane',
      role: 'tech'
    });
    console.log('✅ Technicien créé: stephane@eds22.com / stephane123');

    const anneLaure = await User.create({
      email: 'annelaure@eds22.com',
      password: 'annelaure123',
      nom: 'Anne Laure',
      role: 'tech'
    });
    console.log('✅ Technicien créé: annelaure@eds22.com / annelaure123');

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('✨ CRÉATION DES UTILISATEURS TERMINÉE');
    console.log('='.repeat(60));
    console.log('👤 4 utilisateurs créés:');
    console.log('   - admin@eds22.com (Admin)');
    console.log('   - jeremy@eds22.com (Technicien)');
    console.log('   - stephane@eds22.com (Technicien)');
    console.log('   - annelaure@eds22.com (Technicien)');
    console.log('\n📝 Mot de passe pour tous: [nom]123');
    console.log('\n✅ Vous pouvez maintenant vous connecter à l\'application!');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connexion MongoDB fermée');
  }
}

// Lancer la création
createUsers();
