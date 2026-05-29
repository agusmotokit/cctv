const fs = require('fs');
const path = require('path');

const htmlFilePath = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\189d8ffe-dc82-4354-8ab9-e5677c375e4e\\.system_generated\\steps\\14694\\content.md";
const outputFilePath = path.join(__dirname, 'makassar_cameras.json');

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

function parseHtml() {
  const content = fs.readFileSync(htmlFilePath, 'utf-8');
  const cameras = [];

  // Match the anchor elements. Example pattern:
  // <a href="http://makassar.cctv.nusantarainfrastructure.com/hls/d45176dd724517c015a9fa0eaeeee711.m3u8"
  // ...
  // <p class="font-medium text-white truncate group-hover:text-blue-300 transition-colors duration-200">
  //     AIPI B
  // </p>
  // ...
  // <p class="text-xs text-gray-500 mt-1 truncate">
  //     -5.120170, 119.442350
  // </p>

  // We can match them by splitting or regex. Let's use a regex loop for the links and text blocks.
  const anchorRegex = /<a\s+href="(http:\/\/makassar\.cctv\.nusantarainfrastructure\.com\/hls\/[a-f0-9]+\.m3u8)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = anchorRegex.exec(content)) !== null) {
    const streamUrl = match[1];
    const innerHtml = match[2];

    // Extract name
    const nameMatch = innerHtml.match(/<p class="font-medium text-white[^>]*>([\s\S]*?)<\/p>/);
    // Extract coordinates
    const coordMatch = innerHtml.match(/<p class="text-xs text-gray-500[^>]*>([\s\S]*?)<\/p>/);

    if (nameMatch && coordMatch) {
      const rawName = nameMatch[1].trim();
      const coordStr = coordMatch[1].trim();
      const [latStr, lngStr] = coordStr.split(',').map(s => s.trim());

      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const name = toTitleCase(rawName);

      if (!isNaN(lat) && !isNaN(lng)) {
        // Generate a unique-looking base slug for the ID
        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const id = `sul-makassar-${baseSlug}`;

        cameras.push({
          id,
          name,
          city: "Kota Makassar",
          province: "Sulawesi Selatan",
          lat,
          lng,
          streamUrl,
          category: "traffic",
          status: "online",
          description: `Pantauan arus lalu lintas secara real-time di ${name}, Kota Makassar.`
        });
      }
    }
  }

  // De-duplicate IDs just in case
  const finalCameras = [];
  const seenIds = new Set();
  for (const cam of cameras) {
    let uniqueId = cam.id;
    let suffix = 1;
    while (seenIds.has(uniqueId)) {
      uniqueId = `${cam.id}-${suffix}`;
      suffix++;
    }
    seenIds.add(uniqueId);
    cam.id = uniqueId;
    finalCameras.push(cam);
  }

  fs.writeFileSync(outputFilePath, JSON.stringify(finalCameras, null, 2), 'utf-8');
  console.log(`Successfully parsed ${finalCameras.length} cameras for Makassar and saved to scratch/makassar_cameras.json`);
}

parseHtml();
