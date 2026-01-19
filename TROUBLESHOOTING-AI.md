# 🔧 Guide de Dépannage - Agent IA

## 🎯 Problème: L'agent IA ne répond pas

Ce guide vous aidera à diagnostiquer et corriger le problème de l'agent IA qui affiche un message d'erreur au lieu de répondre aux questions.

---

## ✅ Vérifications à faire sur Dokploy

### 1. Vérifier les Variables d'Environnement du BACKEND

**Où:** Dokploy → Votre Projet → Service Backend → Settings → Environment Variables

**Variables OBLIGATOIRES:**

```bash
# MongoDB (obligatoire)
MONGODB_URI=mongodb://...

# OpenRouter API Key (CRITIQUE pour l'IA)
OPENROUTER_API_KEY=sk-or-v1-...

# JWT Secret
JWT_SECRET=eds22_production_secret_2025

# Port
PORT=5001

# Node Environment
NODE_ENV=production
```

**⚠️ CRITIQUE:** La variable `OPENROUTER_API_KEY` est INDISPENSABLE.

**Comment obtenir la clé:**
1. Allez sur https://openrouter.ai/
2. Créez un compte ou connectez-vous
3. Allez dans "Keys" : https://openrouter.ai/keys
4. Créez une nouvelle clé API
5. Copiez la clé (format: `sk-or-v1-...`)
6. Ajoutez-la dans Dokploy

**Vérification:**
- ✅ La clé doit commencer par `sk-or-v1-`
- ✅ La clé ne doit PAS être `ta_clé_openrouter_ici`
- ✅ Après ajout, redéployez le service Backend

---

### 2. Vérifier les Logs du Backend

**Où:** Dokploy → Votre Projet → Service Backend → Logs

**Que chercher:**

#### ✅ Au démarrage (logs normaux):
```
✅ MongoDB connecté
🚀 Serveur EDS22 démarré sur le port 5001
```

#### ❌ Erreur MongoDB:
```
❌ Erreur MongoDB: ...
```
**Solution:** Vérifiez que votre service MongoDB est démarré et que `MONGODB_URI` est correct.

#### ❌ Erreur OpenRouter:
```
❌ Erreur OpenRouter: ...
OPENROUTER_API_KEY non configurée
```
**Solution:** Ajoutez la variable `OPENROUTER_API_KEY` dans les settings.

#### ❌ Timeout:
```
Error: timeout of 30000ms exceeded
```
**Solution:** OpenRouter API est lent. Vérifiez votre connexion internet ou attendez quelques minutes.

---

### 3. Tester l'Endpoint AI Manuellement

#### Option A: Via le script de diagnostic (Recommandé)

**Dans le terminal de votre machine locale:**

```bash
cd backend
node test-ai-endpoint.js
```

Ce script va tester:
- ✅ Les variables d'environnement
- ✅ La connexion au serveur
- ✅ L'authentification
- ✅ L'endpoint AI complet

#### Option B: Via curl (depuis Dokploy ou local)

**1. Tester la santé du serveur:**
```bash
curl https://api-eds.srv1068230.hstgr.cloud/api/health
```
Réponse attendue: `{"status":"OK","message":"EDS22 API is running"}`

**2. S'authentifier pour obtenir un token:**
```bash
curl -X POST https://api-eds.srv1068230.hstgr.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eds22.com","password":"admin123"}'
```
Réponse attendue: `{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{...}}`

**3. Tester l'endpoint AI:**
```bash
curl -X POST https://api-eds.srv1068230.hstgr.cloud/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{"message":"Bonjour","sessionId":"test-123"}'
```
Réponse attendue: `{"message":"Bonjour ... 👋","conversation":{...}}`

---

### 4. Vérifier la Configuration CORS

**Fichier:** `backend/server.js` (ligne 9-16)

```javascript
const corsOptions = {
  origin: [
    'https://eds.srv1068230.hstgr.cloud',  // ← Votre domaine Frontend
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

**Vérification:**
- ✅ Le domaine de votre Frontend (`https://eds.srv1068230.hstgr.cloud`) est bien dans la liste
- ✅ Pas de typo dans l'URL
- ⚠️ Si vous avez changé le domaine, mettez à jour cette liste et redéployez

---

### 5. Vérifier que MongoDB est Accessible

**Sur Dokploy:**
1. Allez dans Services
2. Vérifiez que le service MongoDB (ou votre base de données) est démarré
3. Vérifiez que `MONGODB_URI` pointe vers la bonne adresse

**Format de MONGODB_URI:**
```bash
# MongoDB local sur Dokploy
MONGODB_URI=mongodb://mongodb:27017/eds22

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/eds22

# MongoDB avec authentification
MONGODB_URI=mongodb://username:password@mongodb:27017/eds22
```

---

## 🔍 Diagnostic Avancé

### Scénario 1: "⚠️ L'assistant IA n'est pas encore configuré"

**Cause:** La clé OpenRouter manque ou est invalide.

**Solution:**
1. Allez sur https://openrouter.ai/keys
2. Créez une nouvelle clé
3. Ajoutez-la dans Dokploy: `OPENROUTER_API_KEY=sk-or-v1-...`
4. Redéployez le Backend

---

### Scénario 2: "Erreur lors de la récupération du contexte"

**Cause:** MongoDB n'est pas accessible ou vide.

**Solution:**
1. Vérifiez que MongoDB est démarré
2. Vérifiez `MONGODB_URI` dans les variables d'environnement
3. Testez la connexion MongoDB:
   ```bash
   curl https://api-eds.srv1068230.hstgr.cloud/api/health
   ```
4. Si MongoDB est vide, importez les données de base

---

### Scénario 3: "timeout of 30000ms exceeded"

**Cause:** OpenRouter API est trop lent.

**Solution:**
1. Vérifiez votre connexion internet
2. Attendez quelques minutes et réessayez
3. Vérifiez le statut d'OpenRouter: https://status.openrouter.ai/
4. Essayez de tester OpenRouter directement:
   ```bash
   curl -X POST https://openrouter.ai/api/v1/chat/completions \
     -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "google/gemini-2.0-flash-exp:free",
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

---

### Scénario 4: CORS Error (dans les logs du navigateur)

**Erreur dans la console:**
```
Access to XMLHttpRequest at 'https://api-eds...' from origin 'https://eds...'
has been blocked by CORS policy
```

**Solution:**
1. Ouvrez `backend/server.js`
2. Ajoutez votre domaine Frontend dans `corsOptions.origin`
3. Commitez et pushez
4. Redéployez le Backend sur Dokploy

---

## 📊 Checklist Complète

Avant de contacter le support, vérifiez:

- [ ] ✅ Le Backend est déployé et démarré sur Dokploy
- [ ] ✅ Les logs du Backend ne montrent pas d'erreurs
- [ ] ✅ `OPENROUTER_API_KEY` est définie et valide (commence par `sk-or-v1-`)
- [ ] ✅ `MONGODB_URI` est définie et MongoDB est accessible
- [ ] ✅ La route `/api/health` répond correctement
- [ ] ✅ Le Frontend peut s'authentifier (`/api/auth/login` fonctionne)
- [ ] ✅ Le domaine Frontend est dans la configuration CORS
- [ ] ✅ Le script de diagnostic `test-ai-endpoint.js` passe tous les tests

---

## 🚀 Après avoir corrigé le problème

1. **Redéployez le Backend** sur Dokploy
2. **Videz le cache du navigateur** (Ctrl+Shift+R ou Cmd+Shift+R)
3. **Testez avec une question simple**: "Bonjour"
4. **Vérifiez les logs** pour voir la réponse du serveur

---

## 📞 Besoin d'aide ?

Si après toutes ces vérifications le problème persiste:

1. Récupérez les logs du Backend (Dokploy → Logs → Copiez les 100 dernières lignes)
2. Exécutez le script de diagnostic: `node backend/test-ai-endpoint.js`
3. Prenez une capture d'écran de l'erreur dans le navigateur (Console DevTools)
4. Partagez ces informations pour une aide plus précise

---

## ✅ Succès !

Une fois que tout fonctionne, vous devriez voir:

**Dans le Dashboard:**
- L'agent IA répond "Bonjour [Votre Nom] ! 👋"
- Les questions obtiennent des réponses conversationnelles
- Les recherches fonctionnent ("Liste les pièces SAMSUNG")

**Dans les logs Backend:**
- Aucune erreur
- Des logs de requêtes AI avec succès
- Des temps de réponse entre 1-5 secondes

---

*Dernière mise à jour: 2026-01-19*
