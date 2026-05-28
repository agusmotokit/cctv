import fs from 'fs';

function extract() {
  const html = fs.readFileSync('scratch/kotabaru_peta.html', 'utf8');
  const inlineRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = inlineRegex.exec(html)) !== null) {
    if (!match[0].includes('src=')) {
      count++;
      console.log(`--- Inline Script #${count} ---`);
      console.log(match[1].trim());
    }
  }
}
extract();
