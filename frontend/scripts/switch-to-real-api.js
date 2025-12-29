// Script pour basculer vers l'API réelle avant le build
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiFilePath = join(__dirname, '../src/services/api.js');

const realApiContent = `// Configuration pour le mode DEV/PROD
// MODE DEV : Mock API (pas besoin de MongoDB)
// MODE PROD : Real API (MongoDB requis)

// Pour développer en local sans MongoDB
// export * from './apiMock';

// Pour utiliser l'API réelle
export * from './apiReal';

console.log('✅ API Mode: REAL (Production) - Connected to MongoDB');
`;

console.log('🔄 Switching to Real API for production build...');
writeFileSync(apiFilePath, realApiContent, 'utf8');
console.log('✅ Switched to Real API');
