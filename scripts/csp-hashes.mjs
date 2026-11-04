import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '../dist');
const headersFile = path.join(dist, '.htaccess');
const inlineScript =
  /<script(?![^>]*\ssrc=)(?![^>]*\stype="application\/(?:ld\+)?json")[^>]*>([\s\S]*?)<\/script>/g;
const hash = (text) =>
  `'sha256-${createHash('sha256').update(text).digest('base64')}'`;

const scripts = new Set();
for (const file of await readdir(dist, { recursive: true })) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(path.join(dist, file), 'utf8');
  for (const [, body] of html.matchAll(inlineScript))
    if (body) scripts.add(hash(body));
}

const headers = await readFile(headersFile, 'utf8');
const policy = /(Content-Security-Policy "[^"]*\bscript-src [^;"]*)/;
if (!policy.test(headers)) throw new Error('Missing Content-Security-Policy');
await writeFile(
  headersFile,
  headers.replace(policy, `$1 ${[...scripts].join(' ')}`),
);
