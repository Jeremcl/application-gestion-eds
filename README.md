# EDS22 - Application de Gestion Réparation Électroménager

Application web MERN complète pour EDS22, entreprise de réparation d'électroménager à Guingamp (22).

## 🎨 Design

- **Couleur principale** : #2D5A3D (Vert EDS22)
- **Style** : Glass Morphism + Minimal Tech
- **Typographie** : Inter (Google Fonts)
- **Animations** : 60fps fluides
- **Interface** : Premium, style Linear/Notion/Vercel

## 🚀 Fonctionnalités

### Dashboard
- Métriques temps réel (interventions, CA, clients)
- **Assistant IA central** - Hub interactif avec suggestions intelligentes
- Graphiques et statistiques
- Alertes visuelles

### Gestion Clients
- CRUD complet avec pagination
- Recherche en temps réel
- Historique des appareils
- Fiches clients détaillées

### Interventions
- Vue liste et Kanban (drag-drop)
- 7 statuts de suivi
- Calculs automatiques (coûts, garantie)
- Filtres par statut et technicien

### Stock Pièces
- Inventaire complet
- Alertes stock critique
- Recherche et filtres
- Gestion des emplacements

### Facturation
- Génération factures/devis
- Suivi paiements
- Calcul TVA automatique
- Historique complet

## 📋 Prérequis

- Node.js >= 16.x
- MongoDB >= 6.x
- npm ou yarn

## 🛠️ Installation

### 1. Cloner le projet

Le projet est déjà dans le répertoire actuel.

### 2. Installation Backend

```bash
cd backend
npm install
```

### 3. Installation Frontend

```bash
cd frontend
npm install
```

### 4. Configuration

Le fichier `.env` est déjà configuré dans `backend/.env` avec :
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/eds22
JWT_SECRET=eds22_production_secret_2025
NODE_ENV=development
```

### 5. Démarrage MongoDB

Assurez-vous que MongoDB est en cours d'exécution :
```bash
# Windows (si installé en service)
net start MongoDB

# macOS/Linux
mongod
```

### 6. Initialiser la base de données

```bash
cd backend
npm run seed
```

Cette commande créera :
- 1 utilisateur admin
- 10 clients
- 15 interventions
- 20 pièces détachées
- 2 factures

## 🚀 Lancement de l'application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Le serveur API démarre sur http://localhost:5001

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
L'application démarre sur http://localhost:3000

## 🔐 Connexion

Utilisez ces identifiants pour vous connecter :

### 👑 Administrateur
- **Email** : admin@eds22.com
- **Mot de passe** : admin123

### 👨‍🔧 Techniciens
- **Jérémy**
  - Email : jeremy@eds22.com
  - Mot de passe : jeremy123

- **Stéphane**
  - Email : stephane@eds22.com
  - Mot de passe : stephane123

- **Anne Laure**
  - Email : annelaure@eds22.com
  - Mot de passe : annelaure123

## 📁 Structure du Projet

```
Application gestion eds/
├── backend/
│   ├── config/
│   │   └── seed.js              # Données de test
│   ├── middleware/
│   │   └── auth.js              # Authentification JWT
│   ├── models/
│   │   ├── User.js
│   │   ├── Client.js
│   │   ├── Intervention.js
│   │   ├── Piece.js
│   │   ├── Facture.js
│   │   └── AIConversation.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── interventions.js
│   │   ├── pieces.js
│   │   ├── factures.js
│   │   └── ai.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx        # Header + Sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Gestion authentification
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx     # Dashboard avec IA
│   │   │   ├── Clients.jsx
│   │   │   ├── Interventions.jsx
│   │   │   ├── Stock.jsx
│   │   │   └── Facturation.jsx
│   │   ├── services/
│   │   │   └── api.js            # Appels API
│   │   ├── styles/
│   │   │   └── index.css         # Design system EDS22
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🎯 Fonctionnalités Principales

### Assistant IA
- Positionnement central sur le dashboard (60% largeur)
- Interface conversationnelle avec suggestions intelligentes
- Réponses contextuelles basées sur les données
- Historique des conversations

### Calculs Automatiques
- Coût intervention = forfait + pièces + main d'œuvre
- Garantie = date réalisation + 3 mois
- Numéros auto-incrémentés (INT-2025-XXXX, FAC-2025-XXXX)
- TVA 20% sur factures

### Alertes Stock
- Badge rouge sur navigation si pièces < minimum
- Page dédiée aux alertes critiques
- Notifications visuelles

## 🎨 Design System

### Couleurs Principales
- Primary 500 : #2D5A3D (Vert EDS22)
- Gradient : linear-gradient(135deg, #2D5A3D 0%, #4A7C5D 50%, #66A182 100%)
- Glass morphism avec backdrop-filter blur(12px)

### Composants
- Cards avec effet glass
- Buttons avec animations hover
- Tables avec effets de hover
- Forms avec validation visuelle
- Badges de statut colorés

## 🔧 Technologies

### Backend
- Express.js - Framework web
- MongoDB + Mongoose - Base de données
- JWT - Authentification
- bcryptjs - Hash des mots de passe

### Frontend
- React 18 - UI Library
- React Router - Navigation
- Vite - Build tool
- Axios - HTTP client
- Lucide React - Icons

## 📊 Données de Test

L'application est pré-chargée avec :
- 10 clients de Guingamp et environs
- 15 interventions avec différents statuts
- 3 techniciens : Pierre Moreau, Marie Leroux, Jean Dupuis
- 20 pièces détachées avec emplacements
- Stock critique pour démonstration des alertes

## 🚦 Statuts d'Intervention

1. Demande
2. Planifié
3. En cours
4. Diagnostic
5. Réparation
6. Terminé
7. Facturé

## 💡 Astuces

- Utilisez la recherche globale en header pour trouver rapidement clients/interventions
- Les alertes stock apparaissent automatiquement si quantité < minimum
- L'assistant IA répond aux questions sur stats, clients, interventions et stock
- Les animations sont optimisées pour 60fps

## 🐛 Dépannage

### MongoDB ne démarre pas
```bash
# Vérifier le statut
# Windows
sc query MongoDB

# macOS/Linux
brew services list
```

### Port déjà utilisé
Modifiez les ports dans :
- `backend/.env` - PORT=5001
- `frontend/vite.config.js` - port: 3000

### Erreur d'authentification
Assurez-vous que JWT_SECRET est bien défini dans `backend/.env`

## 📝 License

Propriété de EDS22 - Tous droits réservés

## 👨‍💻 Support

Pour toute question ou assistance, contactez l'équipe de développement.

---

**Développé avec ❤️ pour EDS22 Guingamp**
