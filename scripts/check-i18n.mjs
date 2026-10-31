import { readFileSync, readdirSync } from 'node:fs';

const codes = ['en', 'de'];
const en = JSON.parse(readFileSync('assets/i18n/en.json', 'utf8'));
const keys = Object.keys(en);
const pages = ['index.html', 'works.html', '404.html'];
let failures = 0;

for (const code of codes) {
  const data = JSON.parse(readFileSync(`assets/i18n/${code}.json`, 'utf8'));
  const missing = keys.filter((key) => !(key in data));
  const extra = Object.keys(data).filter((key) => !(key in en));
  const empty = keys.filter((key) => typeof data[key] !== 'string' || data[key].trim() === '');
  const dashes = Object.entries(data).filter(([, value]) => /[\u2014\u2013]/.test(value));

  const ok = !missing.length && !extra.length && !empty.length && !dashes.length;
  if (!ok) failures += 1;

  console.log(
    `${code}: ${ok ? 'OK' : 'FAIL'} keys=${Object.keys(data).length} missing=${missing.length} extra=${extra.length} empty=${empty.length} dashes=${dashes.length}`
  );

  if (missing.length) console.log(`  missing: ${missing.join(', ')}`);
  if (extra.length) console.log(`  extra: ${extra.join(', ')}`);
  if (empty.length) console.log(`  empty: ${empty.join(', ')}`);
  if (dashes.length) console.log(`  dashes: ${dashes.map(([key]) => key).join(', ')}`);
}

const html = pages.map((page) => readFileSync(page, 'utf8')).join('\n');
const attributes = [...html.matchAll(/data-i18n(?:-html|-aria-label|-alt)?="([^"]+)"/g)].map(
  (match) => match[1]
);
const uniqueAttributes = [...new Set(attributes)];
const missingAttributes = uniqueAttributes.filter((key) => !(key in en));

console.log(`\nHTML keys: ${uniqueAttributes.length} unique, ${missingAttributes.length} missing from en.json`);
if (missingAttributes.length) {
  failures += 1;
  console.log(`  missing: ${missingAttributes.join(', ')}`);
}

const js = readFileSync('assets/js/script.js', 'utf8');
if (js.includes('document.cookie') || js.includes('Set-Cookie')) {
  failures += 1;
  console.log('FAIL: cookie usage found');
} else {
  console.log('Cookies: none used in script.js');
}

const fileCount = readdirSync('assets/i18n').length;
console.log(`Locale files: ${fileCount}`);

if (failures) {
  process.exitCode = 1;
  console.log(`\n${failures} failure(s)`);
} else {
  console.log('\nAll locale checks passed');
}
