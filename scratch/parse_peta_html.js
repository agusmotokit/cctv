import fs from 'fs';

function parse() {
  const html = fs.readFileSync('scratch/kotabaru_peta.html', 'utf8');
  console.log('HTML length:', html.length);
  
  // Find all iframes
  const iframeRegex = /<iframe[^>]*>/gi;
  const iframes = html.match(iframeRegex) || [];
  console.log('Iframes found:', iframes);
  
  // Find all divs with ids or classes that look like map or player
  const divRegex = /<div\b[^>]*>/gi;
  const divs = html.match(divRegex) || [];
  const interestingDivs = divs.filter(d => 
    d.includes('map') || d.includes('player') || d.includes('video') || d.includes('cctv')
  );
  console.log('Interesting divs:', interestingDivs.slice(0, 10));

  // Find all occurrences of "apps/"
  let idx = -1;
  while ((idx = html.indexOf('apps/', idx + 1)) !== -1) {
    console.log('apps/ ref:', html.substring(idx - 50, idx + 100));
  }
}
parse();
