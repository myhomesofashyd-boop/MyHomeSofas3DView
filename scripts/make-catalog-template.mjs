import { writeFileSync, existsSync, readFileSync } from 'node:fs';

const HEADERS = [
  'product ID',
  'Model Name',
  'color name',
  'material',
  'technical specs',
  'price',
  'web category',
  'SEO keywords2',
];

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function readUrls() {
  const fromArgs = process.argv.slice(2);
  if (fromArgs.length) return fromArgs;
  if (!existsSync('urls.txt')) return [];

  return readFileSync('urls.txt', 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

const urls = readUrls();
const rows = [
  HEADERS,
  ...urls.map((url, index) => [
    `URL-${String(index + 1).padStart(3, '0')}`,
    '',
    '',
    '',
    url,
    '',
    '',
    '',
  ]),
];

writeFileSync('product-catalog-template.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'));
console.log(`Created product-catalog-template.csv with ${urls.length} URL row(s).`);
