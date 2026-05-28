import fs from 'fs';
import path from 'path';

const chunks = [
  'webpack-42d17420a140e770.js',
  'fd9d1056-f001ceeffabc4bd6.js',
  '2117-24627bc70f308784.js',
  'main-app-5294d1645fe5526e.js',
  'a4634e51-99c61b8e7d707a09.js',
  '6300-7285bc2973a205ce.js',
  '7514-101b952b308632a1.js',
  '4172-48eed4d4b568c22a.js',
  '7838-160e8aa50d19eb5a.js',
  '6008-2ead02a091e969b3.js',
  '8680-89a346c1f6a79280.js',
  '1561-e97bc79fdb535889.js',
  '2938-a9c546ceff4b9c70.js',
  '7835-b71ee1517bb9bd93.js',
  '3903-c3bbc590867c70d2.js',
  '9862-592f863c63196bf2.js',
  'app/map/page-4d33722226950364.js',
  '7648-bb2db628b778d5c4.js',
  '2861-350691d105781bfa.js',
  '3109-5e0e890616a79a08.js',
  '1159-5db4f22a9d3c23a7.js',
  'app/map/layout-fefc9dae68fdac84.js',
  'app/layout-b521c9a1d27810f9.js'
];

const destDir = path.join(process.cwd(), 'scratch', 'kutim_chunks');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function download() {
  for (const chunk of chunks) {
    const url = `https://cctv.kutaitimurkab.go.id/_next/static/chunks/${chunk}`;
    const destPath = path.join(destDir, path.basename(chunk));
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
