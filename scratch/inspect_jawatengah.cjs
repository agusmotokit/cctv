const fs = require('fs');
const path = require('path');

function inspectFile(filename, keywords) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`\nFile ${filename} not found.`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n========================================`);
  console.log(`Inspecting ${filename} (Size: ${content.length} bytes)`);
  console.log(`========================================`);

  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    const scriptContent = match[1];
    count++;
    const matchesKeyword = keywords.some(k => scriptContent.includes(k));
    if (matchesKeyword) {
      console.log(`\nScript #${count} (Length: ${scriptContent.length}):`);
      console.log(scriptContent.substring(0, 1500));
      if (scriptContent.length > 1500) console.log('... [truncated] ...');
    }
  }

  // Also print any iframe tags
  const iframeRegex = /<iframe\b[^>]*>/gi;
  const iframes = content.match(iframeRegex) || [];
  if (iframes.length > 0) {
    console.log(`\nIframe tags (${iframes.length} found):`);
    console.log(iframes.slice(0, 15));
  }
}

inspectFile('magelangkota_home.html', ['marker', 'cctv', 'lat', 'lng', 'm3u8']);
inspectFile('pekalongankab_home.html', ['marker', 'cctv', 'lat', 'lng', 'iframe', 'src']);
