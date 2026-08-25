import fs from 'fs';

const content = fs.readFileSync('./src/types/supabase.ts', 'utf8');
const lines = content.split('\n');
const tables = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Row: {')) {
    tables.push(lines[i-1]?.trim());
  }
}
console.log('Tables:', tables);
