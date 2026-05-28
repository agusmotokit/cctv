const fs = require('fs');

function inspect() {
  const html = fs.readFileSync('scratch/pemalang_home.html', 'utf-8');
  
  // Find where id="video115" is and print the 1000 characters before and after it.
  const idx = html.indexOf('id="video115"');
  if (idx !== -1) {
    console.log('--- CONTEXT AROUND video115 ---');
    console.log(html.slice(idx - 600, idx + 600));
  } else {
    console.log('Could not find video115 in HTML');
  }
}

inspect();
