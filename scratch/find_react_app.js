import fs from 'fs';

async function checkSubpages() {
  const pages = ['peta', 'category_cctv', 'dashboard', 'live'];
  for (const page of pages) {
    const url = `https://atcs.dishubkotabaru.id/${page}`;
    console.log('Fetching subpage:', url);
    try {
      const res = await fetch(url);
      console.log(`  Status for ${page}:`, res.status);
      if (res.ok) {
        const html = await res.text();
        fs.writeFileSync(`scratch/kotabaru_${page}.html`, html, 'utf8');
        console.log(`  Saved to scratch/kotabaru_${page}.html, size: ${html.length}`);
        
        // Find if they contain script tags matching /apps/ or any react scripts
        const regex = /src="([^"]+)"/g;
        let match;
        const matches = [];
        while ((match = regex.exec(html)) !== null) {
          if (match[1].includes('apps/') || match[1].includes('js')) {
            matches.push(match[1]);
          }
        }
        console.log(`  Found scripts on ${page}:`, matches);
      }
    } catch (err) {
      console.error(`  Error for ${page}:`, err.message);
    }
  }
}

checkSubpages();
