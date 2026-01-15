# 📋 BRIEF TECHNIQUE - Import des pièces détachées EDS22

## 🎯 OBJECTIF

Créer un script d'import Node.js pour intégrer 413 pièces détachées depuis des fichiers CSV vers MongoDB, en respectant la structure existante du modèle `Piece.js` de l'application MERN EDS22.

**Stratégie d'import** : VIDER la collection `pieces` avant l'import (import propre depuis zéro).

---

## 📦 FICHIERS SOURCES

### Localisation
```
backend/data/PD/
├── BDD_Pieces_EDS22.csv          (413 lignes - base principale)
├── Pièces(in).csv                (123 types de pièces)
└── CONSTRUCTEUR(in).csv          (47 marques)
```

### 1. Base de données des pièces
**Fichier** : `backend/data/PD/BDD_Pieces_EDS22.csv`
- 413 lignes de pièces physiques
- Chaque ligne = 1 exemplaire physique avec son code-barre unique
- **Encodage** : Latin-1 (caractères accentués : `\xe8`, `\xe9`, `\xf4`, etc.)
- **Délimiteur** : Point-virgule (`;`)

**Colonnes** :
```
- Id
- Code Barre (identifiant physique unique, à ignorer après comptage)
- Type de pièce (code numérique → à mapper avec Pièces(in).csv)
- Marque (code numérique → à mapper avec CONSTRUCTEUR(in).csv)
- Référence constructeur (référence technique de la pièce)
- Code absolu darty/SDS (code alternatif)
- Modèle ou chassis (modèles compatibles, parfois multiples séparés par "-")
- Etat actuel de la pièce (Neuve / Contrôlée OK / Non contrôlée / HS)
- Localisation (emplacement physique, ex: "Zone 2 D07")
- Commentaire (texte libre, parfois contient des prix)
```

### 2. Table de correspondance des types
**Fichier** : `backend/data/PD/Pièces(in).csv`
- 123 types de pièces
- **Format** : `"Type de pièce,""Numéro"""`
- **Délimiteur** : Virgule (`,`)
- **Exemples** : 
  - `91` → `"CARTE DE PUISSANCE NON CONFIGUREE"`
  - `93` → `"CARTE DE PUISSANCE"`
  - `111` → `"CARTE DE PUISSANCE COMMANDE COMBINEE"`

### 3. Table de correspondance des marques
**Fichier** : `backend/data/PD/CONSTRUCTEUR(in).csv`
- 47 marques
- **Format** : `"Marque,""Numéro"""`
- **Délimiteur** : Virgule (`,`)
- **Exemples** : 
  - `2` → `"BOSCH"`
  - `8` → `"WHIRLPOOL"`
  - `6` → `"SAMSUNG"`
  - `13` → `"BRANDT"`

**Note** : Le numéro 9 est absent dans les marques.

---

## 🎨 STRUCTURE CIBLE - Modèle MongoDB

```javascript
// Modèle existant : server/models/Piece.js
const pieceSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true
  },
  marque: String,
  modelesCompatibles: [String],
  quantiteStock: {
    type: Number,
    required: true,
    default: 0
  },
  quantiteMinimum: {
    type: Number,
    default: 5
  },
  emplacement: String,
  prixAchat: {
    type: Number,
    required: true
  },
  prixVente: {
    type: Number,
    required: true
  },
  fournisseur: String,
  fournisseurRef: String,
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // dateCreation / dateModification automatiques
});
```

---

## 🔧 LOGIQUE MÉTIER - Règles de transformation

### 1️⃣ IDENTIFICATION DES PIÈCES IDENTIQUES

**Principe** : Plusieurs exemplaires physiques (codes-barres différents) = 1 seule entrée MongoDB

**Clé d'unicité** : Une pièce est identique si :
```
(Type de pièce identique) ET 
(Marque identique) ET 
(Référence constructeur identique OU Code absolu darty/SDS identique)
```

**Résultat** : `quantiteStock` = nombre d'exemplaires identiques

**Exemple concret** :
```csv
Ligne 2:  Type=91, Marque=8, Ref="481010438414", État="Non contrôlée"
Ligne 18: Type=91, Marque=8, Ref="481010438414", État="HS"
Ligne 51: Type=91, Marque=8, Ref="481010438414", État="Non contrôlée"

→ 2 entrées MongoDB distinctes (pas 3 !)
  1. Ref="481010438414-NC" : quantiteStock=2, actif=true (Non contrôlée)
  2. Ref="481010438414-HS" : quantiteStock=1, actif=false (HS)
```

### 2️⃣ GESTION DES ÉTATS (RÈGLE CRITIQUE)

**4 états dans le CSV** :
- `"Neuve"` = pièce neuve jamais utilisée
- `"Contrôlée OK"` = pièce testée et fonctionnelle
- `"Non contrôlée"` = pièce pas encore testée (statut inconnu)
- `"HS"` = Hors service, défectueuse

**⚠️ RÈGLE IMPORTANTE** : La même pièce technique avec des états différents = **entrées MongoDB SÉPARÉES**

**Regroupement par catégorie d'état** :

| État dans CSV | Catégorie MongoDB | Champ `actif` | Suffixe reference |
|--------------|-------------------|---------------|-------------------|
| "Neuve" | Fonctionnelle | `true` | *(aucun)* |
| "Contrôlée OK" | Fonctionnelle | `true` | *(aucun)* |
| "Non contrôlée" | Non contrôlée | `true` | `-NC` |
| "HS" | HS | `false` | `-HS` |

**Logique de groupement** :
1. **Catégorie "Fonctionnelle"** : Regroupe `"Neuve"` + `"Contrôlée OK"`
   - `actif: true`
   - `reference` sans suffixe
   - Sommer les quantités des deux états
   
2. **Catégorie "Non contrôlée"** : Reste séparée
   - `actif: true`
   - `reference` avec suffixe `-NC`
   
3. **Catégorie "HS"** : Reste séparée
   - `actif: false`
   - `reference` avec suffixe `-HS`

**Exemple de résultat** :
```javascript
// Résistance Whirlpool avec 7 exemplaires au total
[
  {
    reference: "481010438414",
    designation: "CARTE DE PUISSANCE NON CONFIGUREE - WHIRLPOOL",
    quantiteStock: 4,  // 2 neuves + 2 contrôlées OK
    actif: true,
    emplacement: "Zone 2 D07"
  },
  {
    reference: "481010438414-NC",
    designation: "CARTE DE PUISSANCE NON CONFIGUREE - WHIRLPOOL",
    quantiteStock: 2,  // 2 non contrôlées
    actif: true,
    emplacement: "Zone 2 C03"
  },
  {
    reference: "481010438414-HS",
    designation: "CARTE DE PUISSANCE NON CONFIGUREE - WHIRLPOOL",
    quantiteStock: 1,  // 1 HS
    actif: false,
    emplacement: "Zone 2 C07"
  }
]
```

### 3️⃣ MAPPING DES CHAMPS CSV → MongoDB

| Champ CSV | → | Champ MongoDB | Règle de transformation |
|-----------|---|---------------|-------------------------|
| `Type de pièce` (code) | → | partie de `designation` | Mapper via Pièces(in).csv |
| `Marque` (code) | → | `marque` + partie de `designation` | Mapper via CONSTRUCTEUR(in).csv |
| `Référence constructeur` | → | `reference` (base) | Clé unique (+ suffixe état si nécessaire) |
| `Code absolu darty/SDS` | → | `reference` (fallback) | Si ref constructeur vide |
| N/A | → | `designation` | Format : "{TYPE} - {MARQUE} - {REF}" |
| `Modèle ou chassis` | → | `modelesCompatibles` | Split par "-" si contient tirets |
| Comptage occurrences | → | `quantiteStock` | Nombre de lignes identiques |
| `Localisation` | → | `emplacement` | Tel quel (ex: "Zone 2 D07") |
| `Référence constructeur` | → | `fournisseurRef` | Copie de la référence |
| N/A | → | `prixAchat` | **null** (champ obligatoire mais laissé vide) |
| N/A | → | `prixVente` | **null** (champ obligatoire mais laissé vide) |
| N/A | → | `fournisseur` | **null** |
| N/A | → | `quantiteMinimum` | `5` (valeur par défaut) |
| `Etat actuel de la pièce` | → | `actif` | true sauf si "HS" |

**Notes importantes** :
- **NE PAS** parser les commentaires pour extraire les prix
- **NE PAS** stocker les codes-barres individuels (juste les utiliser pour compter)
- Les prix restent `null` - ils seront remplis manuellement plus tard dans l'interface

### 4️⃣ GÉNÉRATION DE LA DESIGNATION

**Format** : `"{TYPE} - {MARQUE} - {REFERENCE}"`

**Exemples** :
```javascript
Type=91, Marque=8, Ref="481010438414"
→ "CARTE DE PUISSANCE NON CONFIGUREE - WHIRLPOOL - 481010438414"

Type=93, Marque=13, Ref="AS0020703"
→ "CARTE DE PUISSANCE - BRANDT - AS0020703"

Type=111, Marque=6, Ref="DC94-06270A"
→ "CARTE DE PUISSANCE COMMANDE COMBINEE - SAMSUNG - DC94-06270A"
```

**Si type ou marque inconnu** :
```javascript
Type=999 (inexistant), Marque=8, Ref="ABC123"
→ "Type inconnu - WHIRLPOOL - ABC123"

Type=91, Marque=9 (absent), Ref="ABC123"
→ "CARTE DE PUISSANCE NON CONFIGUREE - Marque inconnue - ABC123"
```

### 5️⃣ GESTION DES CAS PARTICULIERS

#### A) Référence constructeur manquante

**Si `Référence constructeur` est vide** :
1. Utiliser `Code absolu darty/SDS` comme `reference`
2. Si les deux sont vides : générer `"UNKNOWN-{id_csv}"`

**Exemple** :
```csv
Ligne 106: Type=46, Marque=33, Ref="", Code darty="", Modèle="NC"
→ reference: "UNKNOWN-106"
```

#### B) Type ou Marque inconnu

**Si code non trouvé dans les tables** :
- Type inconnu → `"Type inconnu"` dans designation
- Marque inconnue → `"Marque inconnue"` dans designation
- Logger un warning

#### C) Modèles compatibles multiples

**Format dans CSV** : `"91609667500-91609825100"` (séparés par tiret)

**Transformation** :
```javascript
Input CSV : "91609667500-91609825100"
Output MongoDB : ["91609667500", "91609825100"]

Input CSV : "TW814EU"
Output MongoDB : ["TW814EU"]

Input CSV : "" ou "NC"
Output MongoDB : []
```

#### D) Emplacements multiples

**Si plusieurs exemplaires avec emplacements différents** :
- Prendre le **premier emplacement** rencontré
- OU concaténer avec " / " : `"Zone 2 D07 / Zone 2 B03"`

**Choix recommandé** : Prendre le premier (plus simple)

---

## 🛠️ SCRIPT D'IMPORT À CRÉER

### Fichier : `server/scripts/importPieces.js`

**Architecture du script** :

```javascript
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const Piece = require('../models/Piece');

// Configuration
const CSV_PIECES = './data/PD/BDD_Pieces_EDS22.csv';
const CSV_TYPES = './data/PD/Pièces(in).csv';
const CSV_MARQUES = './data/PD/CONSTRUCTEUR(in).csv';

// Étapes principales
async function main() {
  try {
    // 1. Connexion MongoDB
    await connectDB();
    
    // 2. Chargement des tables de correspondance
    const typesMap = await loadTypesMapping();
    const marquesMap = await loadMarquesMapping();
    
    // 3. Lecture et parsing du CSV principal
    const csvData = await loadPiecesCSV();
    
    // 4. Groupement par clé + état
    const groupedPieces = groupPiecesByKeyAndState(csvData, typesMap, marquesMap);
    
    // 5. Génération des documents MongoDB
    const documents = generateMongoDocuments(groupedPieces);
    
    // 6. Validation
    validateDocuments(documents);
    
    // 7. VIDER la collection (Option A)
    await Piece.deleteMany({});
    console.log('✅ Collection pieces vidée');
    
    // 8. Insertion en base
    const result = await Piece.insertMany(documents, { ordered: false });
    
    // 9. Rapport final
    printReport(result, csvData.length);
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}
```

---

## 📝 DÉTAIL DES ÉTAPES

### Étape 1 : Connexion MongoDB

```javascript
async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eds22';
  await mongoose.connect(mongoURI);
  console.log('✅ Connecté à MongoDB');
}
```

### Étape 2 : Chargement des tables de correspondance

```javascript
async function loadTypesMapping() {
  const map = new Map();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_TYPES)
      .pipe(csv({ separator: ',' }))
      .on('data', (row) => {
        // Format: "Type de pièce,""Numéro"""
        // Extraire le numéro entre guillemets
        const numero = extractNumber(row);
        const type = extractType(row);
        map.set(numero, type);
      })
      .on('end', () => {
        console.log(`✅ ${map.size} types chargés`);
        resolve(map);
      })
      .on('error', reject);
  });
}

async function loadMarquesMapping() {
  const map = new Map();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_MARQUES)
      .pipe(csv({ separator: ',' }))
      .on('data', (row) => {
        const numero = extractNumber(row);
        const marque = extractMarque(row);
        map.set(numero, marque);
      })
      .on('end', () => {
        console.log(`✅ ${map.size} marques chargées`);
        resolve(map);
      })
      .on('error', reject);
  });
}
```

### Étape 3 : Lecture du CSV principal (ENCODAGE LATIN-1)

```javascript
async function loadPiecesCSV() {
  const data = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PIECES)
      .pipe(iconv.decodeStream('latin1'))  // IMPORTANT: Latin-1 !
      .pipe(csv({ separator: ';' }))        // IMPORTANT: point-virgule !
      .on('data', (row) => {
        data.push({
          id: row.Id,
          codeBarre: row['Code Barre'],
          typePiece: row['Type de pièce'],
          marque: row['Marque'],
          refConstructeur: row['Référence constructeur'],
          codeDarty: row['Code absolu darty/ SDS'],
          modele: row['Modèle ou chassis'],
          etat: row['Etat actuel de la pièce'],
          localisation: row['Localisation'],
          commentaire: row['Commentaire']
        });
      })
      .on('end', () => {
        console.log(`✅ ${data.length} lignes CSV chargées`);
        resolve(data);
      })
      .on('error', reject);
  });
}
```

### Étape 4 : Groupement par clé + état

```javascript
function groupPiecesByKeyAndState(csvData, typesMap, marquesMap) {
  const groups = new Map();
  const errors = [];
  
  for (const row of csvData) {
    try {
      // Mapper type et marque
      const typeNom = typesMap.get(row.typePiece) || 'Type inconnu';
      const marqueNom = marquesMap.get(row.marque) || 'Marque inconnue';
      
      // Déterminer la référence unique
      const refBase = row.refConstructeur || row.codeDarty || `UNKNOWN-${row.id}`;
      
      // Générer la clé unique (sans état)
      const key = `${row.typePiece}-${row.marque}-${refBase}`;
      
      // Catégoriser l'état
      const etatCategorie = categorizeEtat(row.etat);
      
      // Créer la clé complète (avec état)
      const fullKey = `${key}|${etatCategorie}`;
      
      // Initialiser ou incrémenter
      if (!groups.has(fullKey)) {
        groups.set(fullKey, {
          refBase,
          typeNom,
          marqueNom,
          etatCategorie,
          quantite: 0,
          emplacements: [],
          modeles: new Set(),
          commentaires: []
        });
      }
      
      const group = groups.get(fullKey);
      group.quantite++;
      group.emplacements.push(row.localisation);
      
      // Ajouter modèles compatibles
      if (row.modele && row.modele !== 'NC') {
        row.modele.split('-').forEach(m => group.modeles.add(m.trim()));
      }
      
      if (row.commentaire) {
        group.commentaires.push(row.commentaire);
      }
      
    } catch (error) {
      errors.push({ ligne: row.id, erreur: error.message });
    }
  }
  
  if (errors.length > 0) {
    console.warn(`⚠️  ${errors.length} erreurs de parsing:`);
    errors.slice(0, 10).forEach(e => console.warn(`  - Ligne ${e.ligne}: ${e.erreur}`));
  }
  
  return groups;
}

function categorizeEtat(etatCSV) {
  const etatNormalized = (etatCSV || '').trim();
  
  if (etatNormalized === 'Neuve' || etatNormalized === 'Contrôlée OK') {
    return 'Fonctionnelle';
  } else if (etatNormalized === 'Non contrôlée') {
    return 'Non contrôlée';
  } else if (etatNormalized === 'HS') {
    return 'HS';
  } else {
    return 'Non contrôlée';  // Par défaut
  }
}
```

### Étape 5 : Génération des documents MongoDB

```javascript
function generateMongoDocuments(groups) {
  const documents = [];
  
  for (const [fullKey, group] of groups) {
    const { refBase, typeNom, marqueNom, etatCategorie } = group;
    
    // Générer la reference avec suffixe si nécessaire
    let reference = refBase;
    if (etatCategorie === 'Non contrôlée') {
      reference = `${refBase}-NC`;
    } else if (etatCategorie === 'HS') {
      reference = `${refBase}-HS`;
    }
    
    // Générer la designation
    const designation = `${typeNom} - ${marqueNom} - ${refBase}`;
    
    // Déterminer actif
    const actif = etatCategorie !== 'HS';
    
    // Premier emplacement (ou concaténation)
    const emplacement = group.emplacements[0] || '';
    
    // Document MongoDB
    documents.push({
      reference,
      designation,
      marque: marqueNom,
      modelesCompatibles: Array.from(group.modeles),
      quantiteStock: group.quantite,
      quantiteMinimum: 5,
      emplacement,
      prixAchat: null,      // Obligatoire mais laissé null
      prixVente: null,      // Obligatoire mais laissé null
      fournisseur: null,
      fournisseurRef: refBase,
      actif
    });
  }
  
  console.log(`✅ ${documents.length} documents générés`);
  return documents;
}
```

### Étape 6 : Validation

```javascript
function validateDocuments(documents) {
  const errors = [];
  const references = new Set();
  
  for (const doc of documents) {
    // Vérifier unicité de reference
    if (references.has(doc.reference)) {
      errors.push(`Doublon: reference "${doc.reference}"`);
    }
    references.add(doc.reference);
    
    // Vérifier champs obligatoires
    if (!doc.reference) errors.push('reference manquante');
    if (!doc.designation) errors.push('designation manquante');
    if (doc.quantiteStock < 1) errors.push(`quantiteStock invalide: ${doc.quantiteStock}`);
  }
  
  if (errors.length > 0) {
    console.error('❌ Erreurs de validation:');
    errors.slice(0, 20).forEach(e => console.error(`  - ${e}`));
    throw new Error('Validation échouée');
  }
  
  console.log('✅ Validation OK');
}
```

### Étape 7 : Vidage de la collection

```javascript
// Dans la fonction main()
await Piece.deleteMany({});
console.log('✅ Collection pieces vidée');
```

### Étape 8 : Insertion

```javascript
const result = await Piece.insertMany(documents, { ordered: false });
console.log(`✅ ${result.length} pièces insérées`);
```

### Étape 9 : Rapport final

```javascript
function printReport(insertResult, csvLineCount) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT D\'IMPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📥 CSV traité:`);
  console.log(`  - Lignes CSV lues: ${csvLineCount}`);
  
  console.log(`\n💾 MongoDB:`);
  console.log(`  - Documents insérés: ${insertResult.length}`);
  
  // Stats par état
  const stats = {
    fonctionnelles: 0,
    nonControlees: 0,
    hs: 0,
    quantiteTotale: 0
  };
  
  insertResult.forEach(doc => {
    stats.quantiteTotale += doc.quantiteStock;
    
    if (doc.reference.endsWith('-HS')) {
      stats.hs++;
    } else if (doc.reference.endsWith('-NC')) {
      stats.nonControlees++;
    } else {
      stats.fonctionnelles++;
    }
  });
  
  console.log(`\n📊 Répartition par état:`);
  console.log(`  - Fonctionnelles: ${stats.fonctionnelles} entrées`);
  console.log(`  - Non contrôlées: ${stats.nonControlees} entrées`);
  console.log(`  - HS: ${stats.hs} entrées`);
  console.log(`  - Quantité totale: ${stats.quantiteTotale} pièces physiques`);
  
  console.log('\n✅ Import terminé avec succès !');
  console.log('='.repeat(60) + '\n');
}
```

---

## ⚙️ DÉPENDANCES NPM REQUISES

Ajouter au `package.json` :
```json
{
  "dependencies": {
    "csv-parser": "^3.0.0",
    "iconv-lite": "^0.6.3"
  }
}
```

Installation :
```bash
npm install csv-parser iconv-lite
```

---

## 🚨 GESTION DES ERREURS

### Erreurs bloquantes (arrêt du script)

- ❌ Impossible de lire les fichiers CSV
- ❌ Impossible de se connecter à MongoDB
- ❌ Erreur de parsing des tables de correspondance
- ❌ Validation échouée (references dupliquées, champs manquants)

### Erreurs non bloquantes (logger et continuer)

- ⚠️  Ligne CSV mal formatée → skip et logger
- ⚠️  Type ou Marque inconnu → utiliser "inconnu" et logger
- ⚠️  Référence manquante → générer UNKNOWN-{id} et logger
- ⚠️  État inconnu → traiter comme "Non contrôlée" et logger

**Format du log d'erreur** :
```javascript
{
  ligne: 42,
  codeBarre: "0000365907",
  erreur: "Type de pièce '999' introuvable dans la table de correspondance",
  action: "Type remplacé par 'Type inconnu'"
}
```

---

## 🎯 EXEMPLE DE RÉSULTATS ATTENDUS

### Document MongoDB #1 : Pièce fonctionnelle
```javascript
{
  _id: ObjectId("..."),
  reference: "481010438414",
  designation: "CARTE DE PUISSANCE NON CONFIGUREE - WHIRLPOOL - 481010438414",
  marque: "WHIRLPOOL",
  modelesCompatibles: ["AWA", "DOMINO", "TCV"],
  quantiteStock: 3,
  quantiteMinimum: 5,
  emplacement: "Zone 2 D07",
  prixAchat: null,
  prixVente: null,
  fournisseur: null,
  fournisseurRef: "481010438414",
  actif: true,
  createdAt: ISODate("2025-01-15T..."),
  updatedAt: ISODate("2025-01-15T...")
}
```

### Document MongoDB #2 : Même pièce, état HS
```javascript
{
  _id: ObjectId("..."),
  reference: "481010438414-HS",
  designation: "CARTE DE PUISSANCE NON CONFIGUREE - WHIRLPOOL - 481010438414",
  marque: "WHIRLPOOL",
  modelesCompatibles: [],
  quantiteStock: 1,
  quantiteMinimum: 5,
  emplacement: "Zone 2 C07",
  prixAchat: null,
  prixVente: null,
  fournisseur: null,
  fournisseurRef: "481010438414",
  actif: false,
  createdAt: ISODate("2025-01-15T..."),
  updatedAt: ISODate("2025-01-15T...")
}
```

---

## 📊 VÉRIFICATIONS POST-IMPORT

Créer un script de vérification : `server/scripts/verifyImport.js`

```javascript
async function verifyImport() {
  await connectDB();
  
  const stats = {
    total: await Piece.countDocuments(),
    actives: await Piece.countDocuments({ actif: true }),
    hs: await Piece.countDocuments({ actif: false }),
    sansRef: await Piece.countDocuments({ 
      reference: /^UNKNOWN-/ 
    }),
    sansPrix: await Piece.countDocuments({ 
      $or: [
        { prixAchat: null },
        { prixVente: null }
      ]
    })
  };
  
  // Vérifier somme des quantités
  const pieces = await Piece.find();
  const totalQuantite = pieces.reduce((sum, p) => sum + p.quantiteStock, 0);
  
  console.log('📊 VÉRIFICATIONS POST-IMPORT');
  console.log(`  - Documents en base: ${stats.total}`);
  console.log(`  - Pièces actives: ${stats.actives}`);
  console.log(`  - Pièces HS: ${stats.hs}`);
  console.log(`  - Pièces sans référence: ${stats.sansRef}`);
  console.log(`  - Pièces sans prix: ${stats.sansPrix}`);
  console.log(`  - Quantité totale: ${totalQuantite} (attendu: 413)`);
  
  if (totalQuantite !== 413) {
    console.warn('⚠️  La somme des quantités ne correspond pas au nombre de lignes CSV !');
  }
}
```

---

## ✅ CHECKLIST DE VALIDATION

Avant de considérer l'import comme réussi :

- [ ] Les 3 fichiers CSV sont bien dans `backend/data/PD/`
- [ ] Connexion MongoDB établie
- [ ] 413 lignes CSV parsées sans erreur fatale
- [ ] Tables de correspondance chargées (123 types, 47 marques)
- [ ] Groupement par pièce identique effectué
- [ ] Séparation par état respectée (Fonctionnelle / Non contrôlée / HS)
- [ ] Tous les documents ont `reference` et `designation` remplis
- [ ] Aucune erreur de validation (pas de doublons de `reference`)
- [ ] Collection vidée avant insertion (Option A confirmée)
- [ ] Insertion MongoDB réussie sans erreur
- [ ] Somme des `quantiteStock` = 413
- [ ] Rapport détaillé affiché avec statistiques
- [ ] Log des erreurs/warnings généré si applicable

---

## 🚀 COMMANDES D'EXÉCUTION

```bash
# Depuis le dossier backend/
node server/scripts/importPieces.js

# Puis vérification
node server/scripts/verifyImport.js
```

---

## 📝 NOTES IMPORTANTES

1. **Encodage critique** : Le CSV principal est en Latin-1, pas UTF-8
2. **Délimiteurs différents** : 
   - BDD_Pieces_EDS22.csv → point-virgule (`;`)
   - Pièces(in).csv → virgule (`,`)
   - CONSTRUCTEUR(in).csv → virgule (`,`)
3. **Prix non remplis** : C'est normal, ils seront saisis manuellement plus tard
4. **Codes-barres ignorés** : Utilisés seulement pour compter, pas stockés
5. **États séparés** : Une même pièce technique peut avoir 3 entrées distinctes
6. **Reference avec suffixe** : `-NC` ou `-HS` pour éviter les doublons
7. **Collection vidée** : ATTENTION, toutes les pièces actuelles seront supprimées
8. **Backup recommandé** : Faire un `mongodump` avant si la collection contient déjà des données importantes

---

## 🔧 DÉPANNAGE

### Problème : Erreur d'encodage (caractères bizarres)
**Solution** : Vérifier que `iconv-lite` est bien installé et que l'encodage est `latin1`

### Problème : Somme des quantités ≠ 413
**Solution** : Vérifier la logique de groupement, certaines lignes ont peut-être été skipées

### Problème : Erreur "Duplicate key error"
**Solution** : Des `reference` sont identiques, vérifier la logique des suffixes `-NC` et `-HS`

### Problème : Types ou Marques "inconnus"
**Solution** : Vérifier le parsing des tables de correspondance (format avec guillemets spécial)

---

**Fin du brief technique** 🚀

**Note finale pour Claude Code** : Ce brief est exhaustif. En cas de doute sur un cas particulier non documenté, privilégier la simplicité et logger un warning plutôt que de faire échouer l'import. L'objectif est d'avoir 413 pièces en base avec les bonnes quantités et les bons états.
