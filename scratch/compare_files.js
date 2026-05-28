import fs from 'fs';
import path from 'path';

const files = [
  'cctv.tapinkab.go.id_1.txt',
  'cctv.tapinkab.go.id_2.txt',
  'cctv.tapinkab.go.id_3.txt'
];

for (const file of files) {
  const content = fs.readFileSync(path.join(process.cwd(), 'scratch', file), 'utf-8');
  const regex = /"lokasi":"(.*?)"/g;
  let matches;
  const names = [];
  while ((matches = regex.exec(content)) !== null) {
    names.push(matches[1]);
  }
  console.log(`${file} contains ${names.length} cameras:`, names.slice(0, 5));
}
