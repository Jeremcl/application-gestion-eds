FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste des fichiers
COPY . .

# Créer le dossier uploads avec les permissions appropriées
RUN mkdir -p uploads && chmod 755 uploads

# Exposer le port
EXPOSE 5001

# Variable d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5001

# Démarrer l'application
CMD ["node", "server.js"]
