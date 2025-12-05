import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const rootEnvPath = path.join(rootDir, '.env');
const serverEnvPath = path.join(rootDir, 'server', '.env');

const readText = (p) => {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return ''; }
};
const writeText = (p, t) => fs.writeFileSync(p, t, 'utf-8');

const parseEnv = (text) => {
  const obj = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const valRaw = line.slice(eq + 1).trim();
    const val = valRaw.replace(/^['"]|['"]$/g, '');
    if (key) obj[key] = val;
  }
  return obj;
};

const rootEnvText = readText(rootEnvPath);
const serverEnvText = readText(serverEnvPath);

if (!rootEnvText) {
  console.error('Root .env not found at', rootEnvPath);
  process.exit(1);
}
if (!serverEnvText) {
  console.error('Server .env not found at', serverEnvPath);
  process.exit(1);
}

const rootEnv = parseEnv(rootEnvText);
const serverEnv = parseEnv(serverEnvText);

const mapPairs = [
  ['VITE_STRIPE_PRICE_STARTER', 'STRIPE_PRICE_STARTER'],
  ['VITE_STRIPE_PRICE_PRO', 'STRIPE_PRICE_PRO'],
  ['VITE_STRIPE_PRICE_PREMIUM', 'STRIPE_PRICE_PREMIUM'],
  ['VITE_STRIPE_PRICE_STARTER_YEARLY', 'STRIPE_PRICE_STARTER_YEARLY'],
  ['VITE_STRIPE_PRICE_PRO_YEARLY', 'STRIPE_PRICE_PRO_YEARLY'],
  ['VITE_STRIPE_PRICE_PREMIUM_YEARLY', 'STRIPE_PRICE_PREMIUM_YEARLY'],
];

const updates = {};
for (const [frontKey, backKey] of mapPairs) {
  const v = rootEnv[frontKey];
  if (typeof v === 'string' && v.length) {
    if (serverEnv[backKey] !== v) updates[backKey] = v;
  }
}

if (!Object.keys(updates).length) {
  console.log('No env sync needed. Server .env already matches root .env for Stripe price IDs.');
  process.exit(0);
}

const serverLines = serverEnvText.split(/\r?\n/);
const seen = new Set();
const newLines = serverLines.map((raw) => {
  const eq = raw.indexOf('=');
  if (eq === -1) return raw;
  const key = raw.slice(0, eq).trim();
  if (key in updates) {
    seen.add(key);
    return `${key}=${updates[key]}`;
  }
  return raw;
});

for (const k of Object.keys(updates)) {
  if (!seen.has(k)) newLines.push(`${k}=${updates[k]}`);
}

writeText(serverEnvPath, newLines.join('\n'));
console.log('Updated server .env keys:', Object.keys(updates).join(', '));