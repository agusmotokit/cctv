const fs = require('fs');

function findData() {
  const html = fs.readFileSync('scratch/surakarta_home.html', 'utf-8');
  
  // Find lines that have both a negative 7.something number and 110.something number
  const lines = html.split('\n');
  console.log(`Total HTML lines: ${lines.length}`);
  
  let found = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('-7.') && line.includes('110.')) {
      found++;
      if (found <= 10) {
        console.log(`Line ${i + 1}:`);
        console.log(line.trim().slice(0, 1000));
        console.log('---');
      }
    }
  }
  console.log(`Found ${found} matching lines.`);
}

findData();
