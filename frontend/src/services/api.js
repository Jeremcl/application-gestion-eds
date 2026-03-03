// Configuration pour le mode DEV/PROD
// MODE DEV : Mock API (pas besoin de MongoDB)
// MODE PROD : Real API (MongoDB requis)

// Pour développer en local sans MongoDB
export * from './apiMock';

// Pour utiliser l'API réelle (décommentez ci-dessus et commentez au-dessus)
// export * from './apiReal';

console.log('📡 API Mode: MOCK (Development) - No MongoDB needed');
