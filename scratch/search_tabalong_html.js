import fs from 'fs';

function search() {
  const html = fs.readFileSync('scratch/tabalong_main.html', 'utf8');
  console.log('Tabalong HTML size:', html.length);
  
  // Search for typical coordinates pattern or camera objects
  // Latitude for Tabalong is around -1.6 to -2.3, Longitude is around 115.2 to 115.8
  const latRegex = /-?[12]\.[0-9]{4,}/g;
  const matches = html.match(latRegex) || [];
  console.log('Potential Latitude coordinates found:', [...new Set(matches)].slice(0, 10));

  // Search for m3u8
  const hlsRegex = /https?[^"'\s]*\.m3u8[^"'\s]*/gi;
  const hlsMatches = html.match(hlsRegex) || [];
  console.log('m3u8 stream URLs found in HTML:', [...new Set(hlsMatches)]);

  // Let's print out all JSON script tags or state variables
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    count++;
    const content = match[1].trim();
    if (content.length > 500 && (content.includes('latitude') || content.includes('longitude') || content.includes('stream') || content.includes('camera') || content.includes('data'))) {
      console.log(`Script ${count} (large) contains keywords. Size: ${content.length}`);
      console.log(content.substring(0, 1000));
      fs.writeFileSync(`scratch/tabalong_script_${count}.txt`, content, 'utf8');
    }
  }
}
search();
