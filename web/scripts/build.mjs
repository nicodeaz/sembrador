import { readFile, writeFile, mkdir, readdir, lstat, copyFile, rm, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const stage = path.join(root, '.dist-building');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const site = new URL(config.siteUrl);
if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash || site.pathname !== '/') {
  throw new Error('siteUrl debe ser un origen HTTPS, sin ruta, credenciales ni parámetros.');
}
if (!/^598\d{8}$/.test(config.whatsapp)) throw new Error('whatsapp debe ser un número uruguayo internacional de 11 dígitos, sin + ni espacios.');
if (typeof config.indexable !== 'boolean') throw new Error('indexable debe ser true o false.');
const siteUrl = site.origin;
const description = 'El Sembrador: recría de pollitas, raciones balanceadas y asesoramiento avícola de Julio Díaz en San Antonio, Ruta 81, km 35,500, Uruguay.';
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'El Sembrador',
      url: `${siteUrl}/`, description, telephone: `+${config.whatsapp}`,
      logo: `${siteUrl}/assets/logo.webp`,
      address: { '@type': 'PostalAddress', streetAddress: 'Ruta 81, km 35,500', addressLocality: 'San Antonio', addressCountry: 'UY' },
      contactPoint: { '@type': 'ContactPoint', name: 'Julio Díaz', telephone: `+${config.whatsapp}`, contactType: 'customer service', availableLanguage: 'es' },
    },
    {
      '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`,
      name: 'El Sembrador', inLanguage: 'es-UY', publisher: { '@id': `${siteUrl}/#organization` },
    },
  ],
};
const replacements = {
  SITE_URL: siteUrl,
  WHATSAPP: config.whatsapp,
  ROBOTS: config.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow',
  STRUCTURED_DATA: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
};
let html = await readFile(path.join(root, 'index.html'), 'utf8');
for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(`{{${token}}}`, value);
if (/\{\{[^}]+\}\}/.test(html)) throw new Error('Quedan variables sin sustituir en index.html.');
if (!html.includes(replacements.ROBOTS)) throw new Error('Falta la etiqueta robots en el HTML.');
if (!html.includes('application/ld+json')) throw new Error('Faltan los datos estructurados.');
let css = await readFile(path.join(root, 'styles.css'), 'utf8');

// Only public source files and assets enter the release. Never copy the parent project.
const publicExtensions = new Set(['.png', '.webp', '.jpg', '.jpeg', '.avif', '.svg', '.gif', '.ico', '.woff2', '.woff', '.txt']);
const assets = [];
const omittedAssets = new Set(['logo-original.png', 'logo-large.webp', 'farm-editorial.webp', 'maize-float.png', 'instrument-serif.woff2', 'instrument-serif-italic.woff2', 'instrument-serif-license.txt', 'fraunces-variable.woff2', 'fraunces-italic.woff2', 'fraunces-license.txt']);
async function collectAssets(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || omittedAssets.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`No se permiten enlaces simbólicos: ${absolute}`);
    if (entry.isDirectory()) await collectAssets(absolute);
    else if (publicExtensions.has(path.extname(entry.name).toLowerCase())) assets.push(path.relative(root, absolute));
  }
}
await collectAssets(path.join(root, 'assets'));
const files = new Set(['index.html', 'styles.css', 'main.js', ...assets].map(file => file.replaceAll('\\', '/')));
if (!files.has('assets/social-card.jpg')) throw new Error('Falta la imagen para compartir assets/social-card.jpg.');
const references = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(match => match[1]);
for (const match of html.matchAll(/srcset\s*=\s*["']([^"']+)["']/g)) {
  references.push(...match[1].split(',').map(item => item.trim().split(/\s+/)[0]));
}
references.push(...[...css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)].map(match => match[1]));
for (const reference of references) {
  if (/^(?:https?:|data:|mailto:|tel:|#|\/\/)/i.test(reference)) continue;
  const normalized = reference.split(/[?#]/)[0].replace(/^\.\//, '').replace(/^\//, '');
  if (normalized && !files.has(normalized)) throw new Error(`Recurso local ausente o no permitido: ${reference}`);
}
for (const file of ['main.js', ...assets]) {
  if (!(await lstat(path.join(root, file))).isFile()) throw new Error(`No es un archivo normal: ${file}`);
}

// Keep stable filenames for already-open pages, but refresh every changed public resource.
const fingerprints = new Map();
const fingerprint = content => createHash('sha256').update(content).digest('hex').slice(0, 12);
for (const file of ['main.js', ...assets]) {
  fingerprints.set(file.replaceAll('\\', '/'), fingerprint(await readFile(path.join(root, file))));
}
function versionReference(reference) {
  let relative = reference;
  if (reference.startsWith(`${siteUrl}/`)) relative = reference.slice(siteUrl.length + 1);
  else if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(reference)) return reference;
  const pathname = relative.split(/[?#]/)[0].replace(/^\.\//, '').replace(/^\//, '');
  const hash = fingerprints.get(pathname);
  if (!hash) return reference;
  const fragmentIndex = reference.indexOf('#');
  const fragment = fragmentIndex < 0 ? '' : reference.slice(fragmentIndex);
  const withoutFragment = fragmentIndex < 0 ? reference : reference.slice(0, fragmentIndex);
  const queryIndex = withoutFragment.indexOf('?');
  const base = queryIndex < 0 ? withoutFragment : withoutFragment.slice(0, queryIndex);
  const parameters = new URLSearchParams(queryIndex < 0 ? '' : withoutFragment.slice(queryIndex + 1).replaceAll('&amp;', '&'));
  parameters.set('v', hash);
  return `${base}?${parameters.toString()}${fragment}`;
}
css = css.replace(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g, (_, reference) => `url("${versionReference(reference)}")`);
fingerprints.set('styles.css', fingerprint(css));
html = html.replace(/\b(src|href|content)(\s*=\s*)(["'])([^"']+)\3/g,
  (_, attribute, equals, quote, reference) => `${attribute}${equals}${quote}${versionReference(reference)}${quote}`);
html = html.replace(/\bsrcset(\s*=\s*)(["'])([^"']+)\2/g, (_, equals, quote, value) => {
  const candidates = value.split(',').map(candidate => {
    const [reference, ...descriptor] = candidate.trim().split(/\s+/);
    return [versionReference(reference), ...descriptor].join(' ');
  });
  return `srcset${equals}${quote}${candidates.join(', ')}${quote}`;
});

// Destructive operations are restricted to these exact generated children of web/.
if (path.dirname(output) !== root || path.dirname(stage) !== root || path.basename(stage) !== '.dist-building') throw new Error('Ruta de compilación inválida.');
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
await writeFile(path.join(stage, 'index.html'), html);
await writeFile(path.join(stage, 'styles.css'), css);
for (const file of ['main.js', ...assets]) {
  await mkdir(path.dirname(path.join(stage, file)), { recursive: true });
  await copyFile(path.join(root, file), path.join(stage, file));
}
let robots = 'User-agent: *\nAllow: /\n';
if (config.indexable) {
  robots += `\nSitemap: ${siteUrl}/sitemap.xml\n`;
  await writeFile(path.join(stage, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>\n`);
}
await writeFile(path.join(stage, 'robots.txt'), robots);
await rm(output, { recursive: true, force: true });
await rename(stage, output);
console.log(`Web compilada en ${output}`);
console.log(`Destino: ${siteUrl} | Indexación: ${config.indexable ? 'habilitada' : 'borrador (noindex)'} | ${assets.length} recursos públicos`);
