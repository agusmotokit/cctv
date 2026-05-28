import fs from 'fs';

function extract() {
  const html = fs.readFileSync('scratch/tanahbumbu_main.html', 'utf8');
  
  // Find the data-page attribute
  const regex = /data-page='([^']+)'/;
  const match = html.match(regex);
  if (!match) {
    console.error('Failed to find data-page attribute!');
    return;
  }
  
  const rawData = match[1];
  // Decode HTML entities since Inertia encodes the JSON
  const decoded = rawData
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&#039;', "'");
    
  try {
    const parsed = JSON.parse(decoded);
    console.log('Keys of Inertia page data:', Object.keys(parsed));
    if (parsed.props) {
      console.log('Keys of props:', Object.keys(parsed.props));
      // Inertia sometimes nests data under props or page/cctvs
    }
    
    // Let's search inside parsed for arrays of cctvs
    // We saw `"cctvs":[{"id":8,...` in the raw HTML matching log
    let cctvs = [];
    if (parsed.props && parsed.props.cctvs) {
      cctvs = parsed.props.cctvs;
    } else if (parsed.cctvs) {
      cctvs = parsed.cctvs;
    } else if (parsed.props && parsed.props.errors) {
      // check other nested props
      for (const val of Object.values(parsed.props)) {
        if (Array.isArray(val) && val.length > 0 && val[0].latitude !== undefined) {
          cctvs = val;
          break;
        }
      }
    }
    
    console.log('Number of cctvs found:', cctvs.length);
    if (cctvs.length > 0) {
      console.log('Keys of first CCTV item:', Object.keys(cctvs[0]));
      console.log('First CCTV item details:', JSON.stringify(cctvs[0], null, 2));
      
      fs.writeFileSync('scratch/tanahbumbu_extracted.json', JSON.stringify(cctvs, null, 2), 'utf8');
      console.log('Saved extracted cctvs to scratch/tanahbumbu_extracted.json');
    } else {
      // If not directly found, dump the parsed object structure
      fs.writeFileSync('scratch/tanahbumbu_parsed.json', JSON.stringify(parsed, null, 2), 'utf8');
      console.log('Dumped parsed Inertia state to scratch/tanahbumbu_parsed.json');
    }
  } catch (err) {
    console.error('Failed to parse decoded JSON:', err.message);
    fs.writeFileSync('scratch/tanahbumbu_decoded.txt', decoded, 'utf8');
  }
}
extract();
