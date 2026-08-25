import fs from 'fs';

const content = fs.readFileSync('./src/types/supabase.ts', 'utf8');
const tableMatches = content.match(/public:\s*\{\s*Tables:\s*\{([^}]+)\}/s);
if (tableMatches) {
  console.log('Tables in types:', tableMatches[1]);
} else {
  // Let's find all table names
  const regex = /^\s{6}([a-zA-Z0-9_]+):\s*\{\s*Row:/gm;
  let match;
  const tables = [];
  while ((match = regex.exec(content)) !== null) {
    tables.push(match[1]);
  }
  console.log('Tables found:', tables);
}
