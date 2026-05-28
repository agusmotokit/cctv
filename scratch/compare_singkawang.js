import fs from 'fs';
import path from 'path';

const currentDb = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'server', 'data', 'cctvData.json'), 'utf-8')
);

const singkawangDb = currentDb.filter(c => c.city === 'Kota Singkawang' || c.id.startsWith('singkawang-'));
console.log(`Current DB has ${singkawangDb.length} Singkawang cameras.`);

const scraped = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'scratch', 'singkawang_cameras.json'), 'utf-8')
);
console.log(`Scraped list has ${scraped.length} Singkawang cameras.`);

// Let's print names of current vs scraped
console.log('--- Current DB names ---');
console.log(singkawangDb.map(c => c.name));

console.log('--- Scraped names ---');
console.log(scraped.map(c => c.name));
