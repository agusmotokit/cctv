import fs from 'fs';

async function dump() {
  const url = 'https://atcs.dishubkotabaru.id/apps/i-v0.1.2.aaab8b2cac8c7485cebe.min.js';
  try {
    const res = await fetch(url);
    const text = await res.text();
    fs.writeFileSync('scratch/kotabaru_entry.js', text, 'utf8');
    console.log('Saved entry file, size:', text.length);

    // Let's print out all sections of the file that look like module definitions
    // Webpack modules are defined as number: (arguments) => { ... }
    const moduleRegex = /(\b\d+):/g;
    let match;
    const moduleIndices = [];
    while ((match = moduleRegex.exec(text)) !== null) {
      moduleIndices.push({ id: match[1], index: match.index });
    }
    
    console.log('Found modules in entry chunk:', moduleIndices.map(m => m.id));
    
    for (let i = 0; i < moduleIndices.length; i++) {
      const current = moduleIndices[i];
      const next = moduleIndices[i + 1];
      const start = current.index;
      const end = next ? next.index : text.length;
      const moduleContent = text.substring(start, end);
      console.log(`\n================ MODULE ${current.id} ================`);
      console.log(moduleContent.substring(0, 1500));
      if (moduleContent.length > 1500) {
        console.log(`... [Truncated ${moduleContent.length - 1500} chars]`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
dump();
