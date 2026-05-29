const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'bogorkab_home.html');
const content = fs.readFileSync(htmlPath, 'utf8');

console.log('Searching for __NEXT_DATA__ script block in bogorkab_home.html...');

const nextDataRegex = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i;
const match = content.match(nextDataRegex);

if (match) {
  console.log('Found __NEXT_DATA__! Writing to bogorkab_next_data.json');
  fs.writeFileSync(path.join(__dirname, 'bogorkab_next_data.json'), match[1]);
  
  // Try to parse and find cameras
  try {
    const data = JSON.parse(match[1]);
    console.log('Parsed successfully.');
    // Print the keys of pageProps or props
    const props = data.props || {};
    console.log('Props keys:', Object.keys(props));
    if (props.pageProps) {
      console.log('pageProps keys:', Object.keys(props.pageProps));
      // Let's dump some parts of pageProps
      fs.writeFileSync(path.join(__dirname, 'bogorkab_props.json'), JSON.stringify(props.pageProps, null, 2));
      console.log('Wrote pageProps to bogorkab_props.json');
    }
  } catch (err) {
    console.error('Failed to parse next data:', err.message);
  }
} else {
  console.log('__NEXT_DATA__ not found. Let us check for standard script blocks or other next assets.');
  // Check if there are other JS files we should fetch
}
