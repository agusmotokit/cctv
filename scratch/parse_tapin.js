import fs from 'fs';
import path from 'path';

const files = [
  'cctv.tapinkab.go.id_1.txt',
  'cctv.tapinkab.go.id_2.txt',
  'cctv.tapinkab.go.id_3.txt'
];

const allCctvs = new Map();

for (const file of files) {
  const filePath = path.join(process.cwd(), 'scratch', file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Use regex to find all objects inside "data": [...]
  // E.g., {"id":52,"uuid":"3aca7029-79d4-4507-a1a3-6ad90dea32f0","lokasi":"Simpang 3 RTH","lat_lon":"0,0","cctv":"/api/stream.m3u8?src=simp3_tiga_rth&mp4=aac","status":1,"created_at":"2025-12-25T15:09:28.000000Z","updated_at":"2025-12-29T17:21:06.000000Z","cameraId":null,"camId":null,"cameraName":null,"isPTZ":null,"streamingURL":null}
  // Let's match any {"id":\d+,"uuid":"[a-f0-9-]{36}",...} block
  const regex = /\{"id":\d+,"uuid":"[a-f0-9-]{36}".*?\}/g;
  const matches = content.match(regex);
  if (matches) {
    console.log(`Found ${matches.length} matches in ${file}`);
    for (const match of matches) {
      try {
        const clean = match.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\u0026/g, '&');
        const parsed = JSON.parse(clean);
        allCctvs.set(parsed.id, parsed);
      } catch (err) {
        // Try cleaning and parsing again if there's any remaining next.js weirdness
        console.error(`Failed parsing item: ${err.message}`);
      }
    }
  } else {
    console.log(`No matches in ${file}`);
  }
}

console.log(`Total unique CCTVs: ${allCctvs.size}`);
const list = Array.from(allCctvs.values());
console.log('Sample item:', list[0]);

fs.writeFileSync(
  path.join(process.cwd(), 'scratch', 'tapin_cameras.json'),
  JSON.stringify(list, null, 2),
  'utf-8'
);
console.log('Saved to scratch/tapin_cameras.json');
