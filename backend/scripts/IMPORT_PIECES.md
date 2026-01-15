# 📦 Import des Pièces Détachées - Guide Dokploy

## 🎯 Objectif
Importer 413 pièces détachées depuis 3 fichiers CSV vers MongoDB sur le VPS.

---

## 📁 Fichiers préparés

Les fichiers suivants sont prêts dans le repo :

1. **backend/data/PD/BDD_Pieces_EDS22.csv** (42 KB)
   - 413 lignes de pièces physiques
   - Encodage: Latin-1
   - Délimiteur: point-virgule (`;`)

2. **backend/data/PD/Pièces(in).csv** (2.9 KB)
   - 123 types de pièces (table de correspondance)

3. **backend/data/PD/CONSTRUCTEUR(in).csv** (845 B)
   - 47 marques (table de correspondance)

4. **backend/scripts/importPieces.js**
   - Script local (MongoDB local)

5. **backend/scripts/importPiecesVPS.js**
   - Script VPS (MongoDB VPS avec authentification)

---

## 🚀 Étapes sur Dokploy

### Étape 1 : Installer les dépendances

⚠️ **IMPORTANT** : Les nouvelles dépendances `csv-parser` et `iconv-lite` doivent être installées.

```bash
cd /app/backend
npm install csv-parser iconv-lite
```

### Étape 2 : Vérifier que les fichiers sont présents

Les fichiers CSV et le script sont déjà dans le repo et déployés automatiquement :

```bash
ls -lh /app/backend/data/PD/
ls -lh /app/backend/scripts/ | grep importPieces
```

Vous devriez voir :
```
-rw-r--r-- 1 root root  42K Jan 15 XX:XX BDD_Pieces_EDS22.csv
-rw-r--r-- 1 root root 2.9K Jan 15 XX:XX Pièces(in).csv
-rw-r--r-- 1 root root  845 Jan 15 XX:XX CONSTRUCTEUR(in).csv
-rw-r--r-- 1 root root  12K Jan 15 XX:XX importPiecesVPS.js
```

### Étape 3 : Exécuter le script d'import

```bash
cd /app/backend
node scripts/importPiecesVPS.js
```

### Étape 4 : Observer le résultat

Le script va afficher :

```
📡 Connexion à MongoDB...
✅ MongoDB connecté

📖 Chargement des tables de correspondance...
✅ 123 types de pièces chargés
✅ 47 marques chargées

📖 Lecture du CSV des pièces...
✅ 413 lignes CSV chargées

🔄 Groupement des pièces...
✅ XXX groupes de pièces créés

🔨 Génération des documents...
✅ XXX documents générés

🔍 Validation...
✅ Validation OK

🗑️  Vidage de la collection pieces...
✅ X anciennes pièces supprimées

💾 Insertion en base...
✅ XXX pièces insérées

============================================================
📊 RÉSUMÉ DE L'IMPORT
============================================================

📥 CSV traité:
   Lignes CSV lues: 413

💾 MongoDB:
   Documents insérés: XXX

📊 Répartition par état:
   Fonctionnelles: XXX entrées
   Non contrôlées: XXX entrées
   HS: XXX entrées
   Quantité totale: 413 pièces physiques

✅ Import terminé avec succès !
============================================================

👋 Connexion MongoDB fermée
```

---

## 📋 Logique de l'import

### Regroupement des pièces

Le script regroupe les pièces **identiques** (même type + marque + référence) :
- **quantiteStock** = nombre d'exemplaires physiques
- Séparation par état : Fonctionnelle / Non contrôlée / HS

### États des pièces

| État CSV | Catégorie MongoDB | actif | Suffixe reference |
|----------|-------------------|-------|-------------------|
| "Neuve" | Fonctionnelle | true | *(aucun)* |
| "Contrôlée OK" | Fonctionnelle | true | *(aucun)* |
| "Non contrôlée" | Non contrôlée | true | `-NC` |
| "HS" | HS | false | `-HS` |

**Exemple** : La pièce avec référence `481010438414` peut avoir 3 entrées :
1. `481010438414` (Fonctionnelle) - quantité: 4
2. `481010438414-NC` (Non contrôlée) - quantité: 2
3. `481010438414-HS` (HS) - quantité: 1

### Champs de la base

- **reference** : Référence unique (+ suffixe si NC ou HS)
- **designation** : "{TYPE} - {MARQUE}"
- **marque** : Nom de la marque
- **modelesCompatibles** : Liste des modèles compatibles
- **quantiteStock** : Nombre d'exemplaires physiques
- **quantiteMinimum** : 5 (par défaut)
- **emplacement** : Zone de stockage
- **prixAchat / prixVente** : 0 (à remplir manuellement)
- **fournisseurRef** : Référence constructeur
- **actif** : true sauf si état HS

---

## ✅ Vérification post-import

### Vérifier dans l'application web

1. Aller sur l'application
2. Cliquer sur **Stock Pièces Détachées**
3. Vérifier que les pièces apparaissent
4. Vérifier les alertes stock critique (pièces < 5)

### Vérifier via MongoDB (optionnel)

```bash
docker exec -it <nom-conteneur-mongodb> mongosh

use eds22

# Compter les pièces
db.pieces.countDocuments()

# Voir un exemple
db.pieces.findOne()

# Vérifier la somme des quantités (doit = 413)
db.pieces.aggregate([
  { $group: { _id: null, total: { $sum: "$quantiteStock" } } }
])

exit
```

---

## 🔧 En cas de problème

### Erreur : "csv-parser not found"
**Solution** : Installer les dépendances
```bash
cd /app/backend
npm install csv-parser iconv-lite
```

### Erreur : "Fichier CSV introuvable"
**Solution** : Vérifier que les fichiers sont dans `/app/backend/data/PD/`

### Erreur : "MongoDB connection failed"
**Solution** : L'URI inclut déjà `?authSource=admin` (corrigé après le feedback de Comet)

### Erreur : "Duplicate key error"
**Solution** : La collection est vidée avant l'import, ce ne devrait pas arriver

### Somme des quantités ≠ 413
**Solution** : Certaines lignes ont été ignorées, vérifier les avertissements dans les logs

---

## 📝 Notes importantes

1. **Collection vidée** : ⚠️ Toutes les pièces existantes seront supprimées avant l'import
2. **Backup recommandé** : Si la collection contient déjà des données importantes
3. **Prix à 0** : Normal, ils seront remplis manuellement via l'interface
4. **Encodage Latin-1** : Nécessaire pour les caractères accentués français
5. **Délimiteurs différents** :
   - BDD_Pieces_EDS22.csv → `;`
   - Pièces(in).csv → `,`
   - CONSTRUCTEUR(in).csv → `,`

---

## 🎉 Après l'import

Les pièces sont maintenant disponibles dans l'application :
- Gestion du stock en temps réel
- Alertes automatiques si stock < 5
- Recherche par référence, désignation, marque
- Filtre par stock critique

---

**Date de préparation** : 15 janvier 2026
**Préparé par** : Claude Code
**Fichiers prêts** : ✅ CSV + Scripts d'import
