# Importation de clients depuis un fichier CSV

## Instructions

### 1. Préparer votre fichier CSV

Placez votre fichier CSV dans ce dossier et nommez-le `clients.csv`

**Format attendu:**
- Séparateur: point-virgule (`;`)
- Encodage: UTF-8
- Première ligne: en-têtes des colonnes

**Colonnes obligatoires:**
- `nom`
- `prenom`
- `telephone`

**Colonnes optionnelles:**
- `adresse`
- `codePostal`
- `ville`
- `email`
- `notes`

### 2. Exemple de format CSV

Voir le fichier `clients.exemple.csv` pour un exemple de format correct:

```csv
nom;prenom;telephone;adresse;codePostal;ville;email;notes
Dupont;Jean;0612345678;123 Rue de la Paix;75001;Paris;jean.dupont@email.com;Client fidèle
Martin;Sophie;0698765432;45 Avenue Victor Hugo;69001;Lyon;sophie.martin@email.com;
```

### 3. Lancer l'importation

Depuis le dossier `backend`, exécutez:

```bash
npm run import-clients
```

### 4. Que fait le script?

- Lit le fichier `clients.csv` dans ce dossier
- Vérifie que les champs obligatoires sont présents
- Vérifie si le client existe déjà (nom + prénom + téléphone)
- Importe uniquement les nouveaux clients
- Affiche un résumé de l'importation

### 5. Gestion des erreurs

Si une ligne contient des erreurs (champs obligatoires manquants, format incorrect), elle sera ignorée et l'erreur sera affichée dans la console.

Les autres lignes continueront à être importées normalement.

### Notes importantes

- Les clients déjà existants (même nom, prénom et téléphone) ne seront pas importés en double
- Les champs vides sont acceptés pour les champs optionnels
- Le script ne supprime pas les clients existants
