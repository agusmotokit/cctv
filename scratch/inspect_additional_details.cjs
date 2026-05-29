const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 1. Inspect Sukabumi Kab script #3 in full
const sukabumiHtml = fs.readFileSync(path.join(__dirname, 'sukabumikab_home.html'), 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(sukabumiHtml)) !== null) {
  count++;
  if (count === 3) {
    console.log('\n========================================');
    console.log('SUKABUMIKAB FULL SCRIPT #3:');
    console.log('========================================');
    console.log(match[1]);
  }
}

// 2. Search for allCctvData or AJAX in Indramayu Kab
const indramayuHtml = fs.readFileSync(path.join(__dirname, 'indramayukab_home.html'), 'utf8');
console.log('\n========================================');
console.log('INDRAMAYUKAB AJAX/DATA SEARCH:');
console.log('========================================');
// Find any axios.get or fetch or JSON arrays
const indramayuScripts = [];
const scriptRegex2 = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
while ((match = scriptRegex2.exec(indramayuHtml)) !== null) {
  indramayuScripts.push(match[1]);
}
indramayuScripts.forEach((script, idx) => {
  if (script.includes('axios') || script.includes('fetch') || script.includes('allCctvData') || script.includes('get-cctv') || script.includes('api')) {
    console.log(`\nScript #${idx + 1} matches:`);
    // Print context or lines containing keywords
    const lines = script.split('\n');
    lines.forEach((line, lIdx) => {
      if (line.includes('axios') || line.includes('fetch') || line.includes('allCctvData') || line.includes('api') || line.includes('data')) {
        console.log(`  Line ${lIdx + 1}: ${line.trim()}`);
      }
    });
  }
});

// 3. Download Tasikmalaya Kab JS bundle
const tasikUrl = 'https://cctv.tasikmalayakab.go.id/assets/index-D1yzcvXd.js';
console.log('\n========================================');
console.log(`DOWNLOADING TASIKMALAYAKAB JS BUNDLE: ${tasikUrl}`);
console.log('========================================');
fetch(tasikUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
})
.then(res => res.text())
.then(text => {
  fs.writeFileSync(path.join(__dirname, 'tasikmalayakab_bundle.js'), text);
  console.log(`Saved ${text.length} bytes to tasikmalayakab_bundle.js`);
})
.catch(err => {
  console.error('Failed to download Tasikmalaya Kab JS:', err.message);
});
