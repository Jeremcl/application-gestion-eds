# 📦 Import des Appareils de Prêt - Guide Dokploy

## 🎯 Objectif
Importer les appareils de prêt depuis le fichier CSV Notion vers la base de données MongoDB sur le VPS.

---

## 📁 Fichiers préparés

Les fichiers suivants sont prêts dans `backend/scripts/` :

1. **appareils-pret.csv** (9.6 KB)
   - Fichier CSV exporté depuis Notion
   - Contient 54 appareils de prêt

2. **importAppareilsPretVPS.js** (9.0 KB)
   - Script d'import configuré pour le VPS
   - Connexion directe à MongoDB du VPS

---

## 🚀 Étapes sur Dokploy

### Étape 1 : Accéder au conteneur Backend

1. Ouvrir Dokploy dans le navigateur
2. Aller dans le projet **Application gestion eds**
3. Cliquer sur le service **Backend**
4. Cliquer sur **Terminal** ou **Console**

### Étape 2 : Vérifier que vous êtes dans le bon dossier

```bash
pwd
# Devrait afficher quelque chose comme : /app/backend ou /app
```

Si vous n'êtes pas dans le dossier `/app` :
```bash
cd /app
```

### Étape 3 : Uploader les fichiers

**Option A - Via l'interface Dokploy (Recommandé)**

Si Dokploy a une fonction "Upload files" :
1. Aller dans **Files** ou **File Manager**
2. Naviguer vers `/app/backend/scripts/`
3. Uploader les 2 fichiers depuis votre machine locale :
   - `backend/scripts/appareils-pret.csv`
   - `backend/scripts/importAppareilsPretVPS.js`

**Option B - Via SCP depuis votre machine locale**

```bash
# Depuis votre machine Windows (PowerShell ou Git Bash)
scp "backend/scripts/appareils-pret.csv" user@votre-serveur:/chemin/vers/app/backend/scripts/
scp "backend/scripts/importAppareilsPretVPS.js" user@votre-serveur:/chemin/vers/app/backend/scripts/
```

**Option C - Via copier-coller dans le terminal**

Si aucune des options ci-dessus n'est disponible, créer les fichiers manuellement :

```bash
cd /app/backend/scripts/

# Créer le fichier CSV (copier le contenu depuis votre machine)
nano appareils-pret.csv
# Coller le contenu, puis Ctrl+X, Y, Enter

# Créer le script (copier le contenu depuis votre machine)
nano importAppareilsPretVPS.js
# Coller le contenu, puis Ctrl+X, Y, Enter
```

### Étape 4 : Vérifier que les fichiers sont bien uploadés

```bash
ls -lh /app/backend/scripts/ | grep appareils
```

Vous devriez voir :
```
-rw-r--r-- 1 root root 9.6K Jan 10 14:58 appareils-pret.csv
-rw-r--r-- 1 root root 9.0K Jan 10 14:55 importAppareilsPretVPS.js
```

### Étape 5 : Exécuter le script d'import

```bash
cd /app/backend
node scripts/importAppareilsPretVPS.js
```

### Étape 6 : Observer le résultat

Le script va afficher :

```
📡 Connexion à MongoDB...
✅ MongoDB connecté
📖 Lecture du fichier CSV des appareils de prêt...
📂 Chemin: /app/backend/scripts/appareils-pret.csv
📋 Total de lignes dans le CSV: 55
⏭️  Lignes ignorées (pas de type d'appareil): 1
📊 54 appareils valides trouvés dans le CSV

👀 Aperçu des 5 premiers appareils:
   1. Lave vaisselle   - Disponible - 0€
   2. seche linge electrolux  - Disponible - 0€
   3. Refrigérateur   - Disponible - 0€
   4. Lave linge   - Disponible - 0€
   5. seche linge   - Disponible - 0€

✅ Importé (ligne 2): Lave vaisselle
✅ Importé (ligne 3): seche linge electrolux
...
... (affichage limité aux 10 premiers)

============================================================
📊 RÉSUMÉ DE L'IMPORTATION
============================================================
✅ Appareils importés avec succès: 54
⏭️  Appareils déjà existants (doublons): 0
❌ Erreurs: 0
📝 Total traité: 54

✨ Importation terminée!
👋 Connexion MongoDB fermée
```

---

## ✅ Vérification post-import

### Vérifier dans l'application web

1. Aller sur l'application web
2. Cliquer sur **Appareils de prêt** dans le menu
3. Vérifier que les appareils apparaissent bien
4. Vérifier quelques appareils en détail :
   - Type d'appareil
   - Marque/Modèle
   - Statut (Disponible/Prêté/En maintenance)
   - Notes

### Vérifier via MongoDB (optionnel)

```bash
# Se connecter à MongoDB
docker exec -it <nom-conteneur-mongodb> mongosh

# Se connecter à la base
use eds22

# Compter les appareils
db.appareilsprets.countDocuments()
# Devrait retourner : 54

# Voir un exemple
db.appareilsprets.findOne()

# Quitter
exit
```

---

## 🔧 En cas de problème

### Erreur : "Fichier CSV introuvable"
- Vérifier que le fichier `appareils-pret.csv` est bien dans `/app/backend/scripts/`
- Vérifier les permissions : `chmod 644 /app/backend/scripts/appareils-pret.csv`

### Erreur : "MongoDB connection failed"
- Vérifier que MongoDB est démarré : `docker ps | grep mongo`
- Vérifier la connexion réseau entre les conteneurs
- L'URL de connexion est : `mongodb://eds22user:wdaujzphftw0scyq@application-gestion-eds-eds22mongodb-fzzvbu:27017/eds22`

### Erreur : "Duplicate key error"
- Certains appareils existent déjà avec le même numéro de série
- Le script ignore automatiquement les doublons
- Pour supprimer les doublons et réimporter : `db.appareilsprets.deleteMany({})`

---

## 📊 Mapping des données CSV → Application

| Colonne CSV | Champ Application | Notes |
|-------------|-------------------|-------|
| Type d'appareil | `type` | **Obligatoire** |
| Marque | `marque` | Optionnel |
| Modèle | `modele` | Optionnel |
| Numéro de série | `numeroSerie` | Unique, optionnel |
| État général | `etat` | Optionnel |
| Prix généré / Cout REE | `valeur` | Converti en nombre |
| Assigné à + Statut interne | `statut` | Disponible/Prêté/En maintenance |
| Plaque signalétique / PHOTOS | `photo` | Lien vers l'image |
| Numéro de prêt + Remarque + Dernier contrôle | `notes` | Texte libre combiné |

---

## 📝 Notes importantes

- Le script ignore les lignes sans "Type d'appareil"
- Les doublons sont détectés par "Numéro de série" (si présent)
- Le statut est automatiquement déterminé selon "Assigné à" et "Statut interne"
- Les appareils sans prix auront une valeur de 0€
- Les notes combinent plusieurs champs du CSV pour garder l'historique

---

## 🎉 Après l'import

Une fois l'import réussi, vous pouvez :
- Créer des prêts via l'interface web
- Modifier les appareils si besoin
- Suivre le statut des appareils en temps réel
- Voir l'historique des prêts pour chaque appareil

---

**Date de préparation** : 10 janvier 2025
**Préparé par** : Claude Code
**Fichiers prêts** : ✅ backend/scripts/appareils-pret.csv + importAppareilsPretVPS.js
