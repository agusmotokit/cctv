import fs from 'fs';
import path from 'path';

const chunks = [
  'cc759f7c2413b7ff.js',
  '551399eb035777b6.js',
  'turbopack-bc07edf50ab07cf4.js',
  '4fd93823156e59e8.js',
  '32f48eeb9e7df534.js',
  '1b307012e163d3a8.js'
];

const destDir = path.join(process.cwd(), 'scratch', 'tapin_chunks');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function download() {
  for (const chunk of chunks) {
    const url = `https://cctv.tapinkab.go.id/_next/static/chunks/${chunk}`;
    const destPath = path.join(destDir, chunk);
    console.log(`Downloading ${url} -> ${destPath}`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed to download ${chunk}: ${res.status}`);
        continue;
      }
      const text = await res.text();
      fs.writeFileSync(destPath, text, 'utf-8');
    } catch (err) {
      console.error(`Error downloading ${chunk}: ${err.message}`);
    }
  }
  console.log('All downloads finished.');
}

download();
