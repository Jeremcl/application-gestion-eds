# Configuration Dokploy pour EDS22

## Backend

### Variables d'environnement requises

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=<votre-uri-mongodb>
JWT_SECRET=<votre-secret-jwt>
FRONTEND_URL=https://eds.srv1068230.hstgr.cloud
API_BASE_URL=https://api-eds.srv1068230.hstgr.cloud
```

### Volume persistant (IMPORTANT)

Le dossier `uploads` doit être persistant pour conserver les photos, PDFs et QR codes.

**Configuration dans Dokploy:**
1. Aller dans l'onglet "Volumes" ou "Mounts" de votre service backend
2. Ajouter un volume:
   - **Source**: Créer un nouveau volume nommé `eds-backend-uploads`
   - **Destination**: `/app/uploads`
   - **Type**: Volume

Cela garantira que les fichiers uploadés ne seront pas perdus lors des redémarrages.

### Ports

- **Port interne**: 5001
- **Port externe**: Configuré par Dokploy (généralement via reverse proxy)

---

## Frontend

### Variables d'environnement requises

```env
VITE_API_URL=https://api-eds.srv1068230.hstgr.cloud
VITE_MODE=real
```

### Build

Le frontend est un build statique Vite + React servi par Nginx.

---

## Déploiement

Après avoir modifié les variables d'environnement ou ajouté les volumes:

1. **Backend**: Redémarrer le service pour appliquer les changements
2. **Frontend**: Redéployer si les variables d'environnement ont changé
3. **Test**: Créer une nouvelle intervention de test avec dépôt atelier

---

## Dépannage

### Les photos ne s'affichent pas

- Vérifier que `API_BASE_URL` est bien définie dans le backend
- Vérifier que le volume est bien monté sur `/app/uploads`
- Créer une NOUVELLE intervention de test (les anciennes ont des URLs incorrectes)

### Erreur 404 sur les fichiers

- Vérifier que le backend est bien accessible à `https://api-eds.srv1068230.hstgr.cloud`
- Vérifier que la route `/uploads` fonctionne: `https://api-eds.srv1068230.hstgr.cloud/uploads/test`
- Vérifier les logs du backend pour voir si les fichiers sont bien créés

### Les fichiers disparaissent au redémarrage

- Le volume persistant n'est pas configuré correctement
- Suivre les instructions de configuration du volume ci-dessus
