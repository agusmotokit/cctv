import fs from 'fs';

async function fetchTabalong() {
  const url = 'https://cctv.tabalongkab.go.id/?page=1';
  console.log('Fetching Tabalong page:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    fs.writeFileSync('scratch/tabalong_main.html', html, 'utf8');
    console.log('Saved Tabalong HTML, size:', html.length);

    // Let's see if there are any next.js script elements or JSON data elements, e.g. <script id="__NEXT_DATA__" type="application/json">
    if (html.includes('__NEXT_DATA__')) {
      console.log('Found NEXT_DATA in page!');
      const startIdx = html.indexOf('__NEXT_DATA__');
      const startTag = html.indexOf('>', startIdx) + 1;
      const endTag = html.indexOf('</script>', startTag);
      const jsonText = html.substring(startTag, endTag);
      fs.writeFileSync('scratch/tabalong_next_data.json', jsonText, 'utf8');
      console.log('Saved NEXT_DATA JSON, size:', jsonText.length);
      
      const nextData = JSON.parse(jsonText);
      console.log('Keys of nextData:', Object.keys(nextData));
      if (nextData.props) {
        console.log('Keys of nextData.props:', Object.keys(nextData.props));
        if (nextData.props.pageProps) {
          console.log('Keys of nextData.props.pageProps:', Object.keys(nextData.props.pageProps));
        }
      }
    } else {
      // Scan for script tags
      const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      let count = 0;
      while ((match = regex.exec(html)) !== null) {
        count++;
        if (match[0].includes('src=')) {
          console.log(`Script ${count} src:`, match[0]);
        } else {
          console.log(`Script ${count} inline snippet:`, match[1].trim().substring(0, 150));
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

fetchTabalong();
