// Script pour basculer vers l'API mockée pour le dev
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiFilePath = join(__dirname, '../src/services/api.js');

const mockApiContent = `// Configuration pour le mode DEV/PROD
// MODE DEV : Mock API (pas besoin de MongoDB)
// MODE PROD : Real API (MongoDB requis)

// Pour développer en local sans MongoDB
export * from './apiMock';

// Pour utiliser l'API réelle (décommentez ci-dessus et commentez au-dessus)
// export * from './apiReal';

console.log('📡 API Mode: MOCK (Development) - No MongoDB needed');
`;

console.log('🔄 Switching to Mock API for development...');
writeFileSync(apiFilePath, mockApiContent, 'utf8');
console.log('✅ Switched to Mock API');
