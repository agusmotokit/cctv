import fs from 'fs';

function printCode() {
  const text = fs.readFileSync('scratch/tanahbumbu_app.js', 'utf8');
  const index = 776381;
  const start = Math.max(0, index - 2500);
  const end = Math.min(text.length, index);
  console.log('Snippet from 773881 to 776381:');
  console.log(text.substring(start, end));
}
printCode();
