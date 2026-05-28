const fs = require('fs');

function parseHtml() {
  const html = fs.readFileSync('scratch/surakarta_home.html', 'utf-8');
  
  console.log('--- IFRAMES ---');
  const iframeRegex = /<iframe[^>]*src="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = iframeRegex.exec(html)) !== null) {
    console.log(match[1]);
  }

  console.log('\n--- SCRIPTS WITH SRC ---');
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*>/gi;
  const scriptUrls = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptUrls.push(match[1]);
    console.log(match[1]);
  }

  console.log('\n--- VIDEO/STREAM HINTS ---');
  const streamRegex = /(https?:\/\/[^\s"'`<>]+?\.(?:m3u8|mp4|flv))/gi;
  while ((match = streamRegex.exec(html)) !== null) {
    console.log(match[1]);
  }

  console.log('\n--- COORD HINTS ---');
  // Surakarta center is roughly -7.56, 110.82
  const coordRegex = /(-7\.\d+|110\.\d+)/g;
  const coordMatches = html.match(coordRegex);
  if (coordMatches) {
    console.log(`Found ${coordMatches.length} coordinate-like numbers:`);
    console.log(Array.from(new Set(coordMatches)).slice(0, 30));
  } else {
    console.log('No coordinate-like numbers found.');
  }

  // Check if there is any inline script or JSON config
  console.log('\n--- SCRIPT TAGS LENGTH ---');
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineCount = 0;
  while ((match = inlineScriptRegex.exec(html)) !== null) {
    inlineCount++;
    const content = match[1];
    if (content.length > 500) {
      console.log(`Inline script #${inlineCount} length: ${content.length}`);
      if (content.includes('marker') || content.includes('cameras') || content.includes('data')) {
        console.log(`Snippet:\n${content.slice(0, 500)}`);
      }
    }
  }
}

parseHtml();
