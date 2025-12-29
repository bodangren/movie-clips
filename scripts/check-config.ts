import { config } from '../src/config';

console.log('--- Config Check ---');
console.log(`Project ID: ${config.google.projectId}`);
console.log(`Location: ${config.google.location}`);
console.log(`Movies Path: ${config.paths.movies}`);
console.log(`API Key set: ${!!config.google.apiKey}`);
