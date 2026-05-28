import fs from 'fs';
import path from 'path';

const chunkDir = path.join(process.cwd(), 'scratch', 'kutim_chunks');
const files = fs.readdirSync(chunkDir);

for (const file of files) {
  if (!file.endsWith('.js')) continue;
  const content = fs.readFileSync(path.join(chunkDir, file), 'utf-8');
  if (content.includes('78705:')) {
    console.log(`Found 78705 in ${file}`);
    // Print around the occurrence
    const idx = content.indexOf('78705:');
    console.log(content.slice(Math.max(0, idx - 100), idx + 800));
  }
}
