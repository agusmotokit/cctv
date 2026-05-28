const fs = require('fs');

function parseHtml() {
  const html = fs.readFileSync('scratch/pemalang_home.html', 'utf-8');
  
  console.log('--- IFRAMES ---');
  const iframeRegex = /<iframe[^>]*src="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = iframeRegex.exec(html)) !== null) {
    console.log(match[1]);
  }

  console.log('\n--- SCRIPTS WITH SRC ---');
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*>/gi;
  while ((match = scriptRegex.exec(html)) !== null) {
    console.log(match[1]);
  }

  console.log('\n--- INLINE SCRIPT HINTS ---');
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineCount = 0;
  while ((match = inlineScriptRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.includes('marker') || content.includes('L.map') || content.includes('lat') || content.includes('lng') || content.includes('video') || content.includes('m3u8') || content.includes('stream') || content.includes('cameras')) {
      inlineCount++;
      console.log(`Inline Script #${inlineCount} snippet:`);
      console.log(content.trim().slice(0, 1000));
      console.log('------------------------------');
    }
  }

  console.log('\n--- VIDEO/STREAM HINTS ---');
  const streamRegex = /(https?:\/\/[^\s"'`<>]+?\.(?:m3u8|mp4|flv))/gi;
  while ((match = streamRegex.exec(html)) !== null) {
    console.log(match[1]);
  }
}

parseHtml();
