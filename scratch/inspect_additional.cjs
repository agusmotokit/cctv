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

  // Show script tags containing keywords
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    const scriptContent = match[1];
    count++;
    const matchesKeyword = keywords.some(k => scriptContent.includes(k));
    if (matchesKeyword) {
      console.log(`\nScript #${count} (Length: ${scriptContent.length}):`);
      console.log(scriptContent.substring(0, 1000));
      if (scriptContent.length > 1000) console.log('... [truncated] ...');
    }
  }

  // Also print any static script source tags
  const srcRegex = /<script\b[^>]*src=["']([^"']+)["']/gi;
  const srcs = [];
  while ((match = srcRegex.exec(content)) !== null) {
    srcs.push(match[1]);
  }
  if (srcs.length > 0) {
    console.log('\nScript sources:', srcs);
  }
}

inspectFile('indramayukab_home.html', ['marker', 'cctv', 'lat', 'lng', 'm3u8']);
inspectFile('sukabumikab_home.html', ['marker', 'cctv', 'lat', 'lng', 'm3u8']);
inspectFile('tasikmalayakab_home.html', ['marker', 'cctv', 'lat', 'lng', 'm3u8', 'assets', 'chunk']);
inspectFile('tasikmalayakota_home.html', ['marker', 'cctv', 'lat', 'lng', 'm3u8']);
