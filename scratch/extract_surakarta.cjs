const fs = require('fs');

// Decode HTML entities
function htmlDecode(input) {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractData() {
  const html = fs.readFileSync('scratch/surakarta_home.html', 'utf-8');
  
  // Find <div id="app" data-page="..."
  const regex = /<div\s+id="app"\s+data-page="([^"]+)"/i;
  const match = html.match(regex);
  if (!match) {
    console.error('Could not find data-page attribute');
    return;
  }
  
  const decoded = htmlDecode(match[1]);
  try {
    const data = JSON.parse(decoded);
    console.log('Successfully parsed data-page JSON!');
    console.log('Keys:', Object.keys(data));
    if (data.props) {
      console.log('Props keys:', Object.keys(data.props));
      fs.writeFileSync('scratch/surakarta_props.json', JSON.stringify(data.props, null, 2), 'utf-8');
      console.log('Saved props to scratch/surakarta_props.json');
      
      // Let's look for anything with "cctv" or "stream" or "kamera" in props
      for (const key of Object.keys(data.props)) {
        const val = data.props[key];
        if (Array.isArray(val)) {
          console.log(`Array prop: ${key} (length: ${val.length})`);
          if (val.length > 0) {
            console.log(`Sample item from ${key}:`, val[0]);
          }
        } else if (val && typeof val === 'object') {
          console.log(`Object prop: ${key}`);
        } else {
          console.log(`Primitive prop: ${key} = ${val}`);
        }
      }
    }
  } catch (err) {
    console.error('JSON Parse error:', err.message);
  }
}

extractData();
