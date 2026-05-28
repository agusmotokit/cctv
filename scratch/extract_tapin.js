import fs from 'fs';
import path from 'path';

async function extractPageData(url) {
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  const html = await res.text();
  
  // Find all matches of self.__next_f.push
  const regex = /self\.__next_f\.push\(\[\d+,"(.*?)"\]\)/g;
  let matches;
  let fullPayload = '';
  while ((matches = regex.exec(html)) !== null) {
    let part = matches[1];
    // Unescape unicode and other characters
    part = part.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    fullPayload += part;
  }
  
  // Let's write the raw payload to a debug file
  const filename = path.basename(url.split('?')[0] || 'index') + '_' + (url.split('page=')[1] || '1') + '.txt';
  fs.writeFileSync(path.join(process.cwd(), 'scratch', filename), fullPayload, 'utf-8');
  console.log(`Saved payload to scratch/${filename}`);

  // Let's find JSON lists in the payload
  // CCTV Tapin data matches: {"id":..., "uuid":..., "lokasi":..., "cctv":...}
  const cctvRegex = /\{"id":\d+,"uuid":"[a-f0-9-]+","lokasi":".*?","lat_lon":".*?","cctv":".*?"/g;
  const items = [];
  let itemMatch;
  
  // Let's also do a simple regex search for the json data block
  const startIdx = fullPayload.indexOf('{"code":200,"succees":false,"data":[');
  if (startIdx !== -1) {
    console.log(`Found data block in ${url}!`);
    // Find the end of this json block by matching brackets
    let depth = 1;
    let endIdx = startIdx + 36; // length of '{"code":200,"succees":false,"data":['
    while (depth > 0 && endIdx < fullPayload.length) {
      if (fullPayload[endIdx] === '[') depth++;
      else if (fullPayload[endIdx] === ']') depth--;
      endIdx++;
    }
    const jsonStr = fullPayload.slice(startIdx, endIdx);
    try {
      // Clean up the string (it might contain some next.js format escaping like \" or \n)
      const cleanJson = jsonStr.replace(/\\"/g, '"').replace(/\\n/g, '\n');
      const parsed = JSON.parse(cleanJson);
      console.log(`Successfully parsed JSON block from ${url}. Count: ${parsed.data.length}`);
      return parsed.data;
    } catch (e) {
      console.log(`Failed to parse json block: ${e.message}`);
    }
  }

  // Fallback: extract individual items using regex
  console.log(`No full JSON block parsed for ${url}, trying fallback regex...`);
  return [];
}

async function run() {
  const p1 = await extractPageData('https://cctv.tapinkab.go.id/');
  const p2 = await extractPageData('https://cctv.tapinkab.go.id/?page=2');
  const p3 = await extractPageData('https://cctv.tapinkab.go.id/?page=3');

  const allCctvs = new Map();
  for (const list of [p1, p2, p3]) {
    if (list) {
      for (const c of list) {
        allCctvs.set(c.id, c);
      }
    }
  }

  console.log(`Total unique CCTVs found: ${allCctvs.size}`);
  const listArray = Array.from(allCctvs.values());
  fs.writeFileSync(path.join(process.cwd(), 'scratch', 'tapin_all_cameras.json'), JSON.stringify(listArray, null, 2), 'utf-8');
  console.log('Saved all cameras to scratch/tapin_all_cameras.json');
}

run();
