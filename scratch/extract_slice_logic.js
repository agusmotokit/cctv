import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.join(process.cwd(), 'scratch', 'tapin_chunks', '1b307012e163d3a8.js'), 'utf-8');
const idx = 519356;
console.log(content.slice(idx - 4000, idx));
