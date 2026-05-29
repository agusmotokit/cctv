const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFilePath = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\189d8ffe-dc82-4354-8ab9-e5677c375e4e\\.system_generated\\logs\\transcript.jsonl";

async function searchLogs() {
  const fileStream = fs.createReadStream(logFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('cctvnusantara.online') || line.includes('nusantara')) {
      // Parse JSON and show content/thinking
      try {
        const obj = JSON.parse(line);
        console.log(`--- Match at line ${lineCount} (${obj.source} - ${obj.type}) ---`);
        if (obj.content) {
          console.log("Content:", obj.content.slice(0, 300));
        }
        if (obj.thinking) {
          console.log("Thinking:", obj.thinking.slice(0, 300));
        }
      } catch (err) {
        console.log(`Line ${lineCount}:`, line.slice(0, 300));
      }
    }
  }
}

searchLogs();
