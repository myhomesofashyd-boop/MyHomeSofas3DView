import { existsSync, readFileSync, writeFileSync } from 'node:fs';

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

function stripHtml(value = '') {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function metaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]);
  }

  return '';
}

function readJsonLdProducts(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const products = [];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1].trim()));
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      const expanded = entries.flatMap((entry) => entry['@graph'] || entry);
      products.push(...expanded.filter((entry) => String(entry['@type'] || '').toLowerCase().includes('product')));
    } catch {
      // Some stores emit invalid JSON-LD. The meta fallbacks below still produce a useful row.
    }
  }

  return products;
}

function textBetween(html, selectorName) {
  const match = html.match(new RegExp(`<${selectorName}[^>]*>([\\s\\S]*?)<\\/${selectorName}>`, 'i'));
  return match ? decodeHtml(stripHtml(match[1])) : '';
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

function priceFromProduct(product) {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const price = offer?.price || offer?.lowPrice || product.price || '';
  const currency = offer?.priceCurrency || product.priceCurrency || '';
  return [currency, price].filter(Boolean).join(' ');
}

async function scrapeUrl(url, index) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 product catalog scraper',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const product = readJsonLdProducts(html)[0] || {};
  const title = product.name || metaContent(html, 'og:title') || textBetween(html, 'title');
  const description = product.description || metaContent(html, 'description') || metaContent(html, 'og:description');
  const keywords = metaContent(html, 'keywords');
  const category = product.category || metaContent(html, 'article:section') || '';
  const sku = product.sku || product.mpn || `WEB-${String(index + 1).padStart(3, '0')}`;
  const material = product.material || '';
  const color = Array.isArray(product.color) ? product.color.join(', ') : product.color || '';

  return [
    sku,
    title,
    color,
    material,
    description,
    priceFromProduct(product),
    category,
    keywords || [title, category, material, color].filter(Boolean).join(', '),
  ];
}

const urls = readUrls();
if (!urls.length) {
  console.error('Add URLs as arguments or put one URL per line in urls.txt.');
  process.exit(1);
}

const rows = [HEADERS];
for (const [index, url] of urls.entries()) {
  try {
    rows.push(await scrapeUrl(url, index));
    console.log(`Scraped ${url}`);
  } catch (error) {
    rows.push([`WEB-${String(index + 1).padStart(3, '0')}`, '', '', '', `Failed to scrape ${url}: ${error.message}`, '', '', '']);
    console.warn(`Failed ${url}: ${error.message}`);
  }
}

writeFileSync('product-catalog-scraped.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'));
console.log(`Created product-catalog-scraped.csv with ${rows.length - 1} product row(s).`);
