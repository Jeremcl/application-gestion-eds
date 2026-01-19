#!/usr/bin/env node
/**
 * Script de diagnostic pour tester l'endpoint AI
 * Usage: node test-ai-endpoint.js
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5001';
const TEST_EMAIL = 'admin@eds22.com';
const TEST_PASSWORD = 'admin123';

console.log('🔍 DIAGNOSTIC DE L\'ENDPOINT AI');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 URL API: ${API_URL}`);
console.log('');

// Fonction de test
async function testAIEndpoint() {
  try {
    // 1. Vérifier les variables d'environnement
    console.log('📋 ÉTAPE 1: Vérification des variables d\'environnement');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓ MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Définie' : '❌ MANQUANTE'}`);
    console.log(`✓ OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✅ Définie' : '❌ MANQUANTE'}`);
    console.log(`✓ JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Définie' : '❌ MANQUANTE'}`);
    console.log('');

    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'ta_clé_openrouter_ici') {
      console.error('❌ PROBLÈME CRITIQUE: OPENROUTER_API_KEY non configurée ou invalide');
      console.error('   L\'agent IA ne peut pas fonctionner sans cette clé.');
      console.error('   Ajoutez-la dans le fichier .env ou dans les variables d\'environnement Dokploy.');
      console.error('');
      console.error('   Format attendu: OPENROUTER_API_KEY=sk-or-v1-...');
      console.error('   Obtenez votre clé sur: https://openrouter.ai/keys');
      console.log('');
      process.exit(1);
    }

    // 2. Tester la connexion au serveur
    console.log('📋 ÉTAPE 2: Test de connexion au serveur');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
      const healthResponse = await axios.get(`${API_URL}/api/health`);
      console.log(`✅ Serveur accessible: ${healthResponse.data.message}`);
    } catch (error) {
      console.error('❌ Serveur inaccessible:', error.message);
      console.error('   Vérifiez que le backend est démarré.');
      process.exit(1);
    }
    console.log('');

    // 3. Authentification
    console.log('📋 ÉTAPE 3: Test d\'authentification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    let token;
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      token = loginResponse.data.token;
      console.log(`✅ Authentification réussie`);
      console.log(`   Token: ${token.substring(0, 20)}...`);
    } catch (error) {
      console.error('❌ Authentification échouée:', error.response?.data?.message || error.message);
      console.error('   Vérifiez que l\'utilisateur admin existe dans MongoDB.');
      process.exit(1);
    }
    console.log('');

    // 4. Test de l'endpoint AI
    console.log('📋 ÉTAPE 4: Test de l\'endpoint /api/ai/chat');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
      const testMessage = 'Bonjour';
      const sessionId = `test-${Date.now()}`;

      console.log(`   Message: "${testMessage}"`);
      console.log(`   Session: ${sessionId}`);
      console.log('   Envoi de la requête...');

      const startTime = Date.now();
      const aiResponse = await axios.post(
        `${API_URL}/api/ai/chat`,
        {
          message: testMessage,
          sessionId: sessionId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 secondes
        }
      );
      const endTime = Date.now();

      console.log('');
      console.log('✅ RÉPONSE REÇUE');
      console.log(`   Temps de réponse: ${endTime - startTime}ms`);
      console.log(`   Status: ${aiResponse.status}`);
      console.log('');
      console.log('📨 Contenu de la réponse:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(aiResponse.data.message);
      console.log('');
      console.log('✅ L\'ENDPOINT AI FONCTIONNE CORRECTEMENT');
    } catch (error) {
      console.error('');
      console.error('❌ ERREUR LORS DE L\'APPEL À L\'ENDPOINT AI');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (error.code === 'ECONNABORTED') {
        console.error('⏱️  TIMEOUT: La requête a pris trop de temps (>30s)');
        console.error('   Causes possibles:');
        console.error('   - OpenRouter API est lent ou inaccessible');
        console.error('   - MongoDB met trop de temps à répondre');
        console.error('   - Le backend manque de ressources');
      } else if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Message: ${error.response.data?.message || error.response.data?.error || 'Aucun message'}`);
        console.error('');
        console.error('   Détails complets:');
        console.error(JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('   Aucune réponse reçue du serveur');
        console.error('   Le backend ne répond pas.');
      } else {
        console.error(`   Erreur: ${error.message}`);
      }

      console.error('');
      console.error('🔍 VÉRIFICATIONS À FAIRE:');
      console.error('   1. Vérifiez les logs du backend (Dokploy)');
      console.error('   2. Vérifiez que OPENROUTER_API_KEY est valide');
      console.error('   3. Testez la connexion à OpenRouter:');
      console.error('      curl -X POST https://openrouter.ai/api/v1/chat/completions \\');
      console.error('        -H "Authorization: Bearer $OPENROUTER_API_KEY" \\');
      console.error('        -H "Content-Type: application/json" \\');
      console.error('        -d \'{"model":"google/gemini-2.0-flash-exp:free","messages":[{"role":"user","content":"test"}]}\'');
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ ERREUR GÉNÉRALE:', error.message);
    process.exit(1);
  }
}

// Exécution
console.log('🚀 Démarrage des tests...');
console.log('');
testAIEndpoint();
