const fs = require('fs');

function scanJS() {
  const js = fs.readFileSync('scratch/surakarta_app.js', 'utf-8');
  
  console.log('File size:', js.length, 'bytes');

  // Let's search if the word 'Agas' or 'Balaikota' is in the JS code
  console.log('Includes "Agas"?', js.includes('Agas') || js.includes('AGAS'));
  console.log('Includes "Balaikota"?', js.includes('Balaikota') || js.includes('BALAIKOTA'));

  // Search for coordinate patterns: -7.xxxx and 110.xxxx in close proximity
  const regex = /(-7\.\d{4,})\D+?(110\.\d{4,})|({.*?lat.*?:.*?-7\..*?lng.*?:.*?110\..*?})/g;
  const matches = [];
  let match;
  while ((match = regex.exec(js)) !== null) {
    matches.push(match[0]);
  }
  console.log(`Found ${matches.length} coordinate-like patterns.`);
  if (matches.length > 0) {
    console.log('Sample patterns:', matches.slice(0, 10));
  }
}

scanJS();
