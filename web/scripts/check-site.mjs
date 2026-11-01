/** Validate a built public release and optionally its loopback preview; never follow CTAs. */
import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const site = new URL(config.siteUrl);
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const css = await readFile(path.join(dist, 'styles.css'), 'utf8');
const hash = content => createHash('sha256').update(content).digest('hex').slice(0, 12);
const attributes = tag => Object.fromEntries([...tag.matchAll(/\s([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1], match[3].replaceAll('&amp;', '&')]));
const tags = name => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(match => attributes(match[0]));
const builtAt = (await lstat(path.join(dist, 'index.html'))).mtimeMs;
for (const file of ['index.html', 'styles.css', 'main.js', 'site.config.json', 'scripts/build.mjs']) {
  assert.ok((await lstat(path.join(root, file))).mtimeMs <= builtAt, `Recompilar: ${file} cambió después del build.`);
}
assert.deepEqual(await readFile(path.join(dist, 'main.js')), await readFile(path.join(root, 'main.js')), 'main.js compilado no coincide con la fuente.');
assert.ok(!/\{\{[^}]+\}\}/.test(html), 'Variables pendientes en HTML.');
assert.match(tags('html')[0]?.lang || '', /^es(?:-[A-Za-z0-9]+)*$/, 'Falta idioma español.');
assert.ok(/<title>[^<]*El Sembrador[^<]*<\/title>/.test(html), 'Título ausente.');
assert.equal(tags('h1').length, 1, 'Debe existir un H1.');

const ids = [...html.matchAll(/\sid=(["'])([^"']+)\1/g)].map(match => match[2]);
assert.equal(new Set(ids).size, ids.length, 'Hay IDs repetidos.');
const idSet = new Set(ids);
const anchors = tags('a');
let internalLinks = 0, whatsappLinks = 0;
for (const anchor of anchors) {
  assert.ok(anchor.href, 'Enlace sin destino.');
  if (anchor.href.startsWith('#')) {
    assert.ok(idSet.has(decodeURIComponent(anchor.href.slice(1))), `Ancla ausente: ${anchor.href}`);
    internalLinks++;
  } else {
    const url = new URL(anchor.href, site);
    assert.equal(url.protocol, 'https:', 'CTA externo sin HTTPS.');
    assert.equal(url.hostname, 'wa.me', 'CTA externo inesperado.');
    assert.equal(url.pathname, `/${config.whatsapp}`, 'WhatsApp incorrecto.');
    if (url.searchParams.has('text')) assert.ok(url.searchParams.get('text').trim(), 'Consulta de WhatsApp vacía.');
    if (anchor.target === '_blank') assert.ok(/\bnoopener\b/.test(anchor.rel || '') && /\bnoreferrer\b/.test(anchor.rel || ''), 'CTA externo sin protección de ventana.');
    whatsappLinks++;
  }
}
assert.ok(whatsappLinks >= 1 && internalLinks >= 1, 'Faltan enlaces de contacto o navegación.');
const metadata = new Map(tags('meta').map(meta => [meta.name || meta.property, meta.content]));
assert.ok(metadata.get('description')?.includes('El Sembrador'), 'Descripción ausente.');
assert.ok(metadata.get('viewport')?.includes('width=device-width'), 'Viewport ausente.');
assert.equal(tags('link').find(link => link.rel === 'canonical')?.href, `${site.origin}/`, 'Canonical incorrecto.');
assert.equal(metadata.get('og:url'), `${site.origin}/`, 'Open Graph URL incorrecta.');
assert.equal(metadata.get('og:image:width'), '1200');
assert.equal(metadata.get('og:image:height'), '630');
assert.equal(metadata.get('twitter:card'), 'summary_large_image');
assert.equal(metadata.get('twitter:image'), metadata.get('og:image'), 'Tarjeta social inconsistente.');
assert.ok(config.indexable ? /^index,/.test(metadata.get('robots')) : /^noindex,/.test(metadata.get('robots')), 'Robots no coincide con la configuración.');
const schemaMatch = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
assert.ok(schemaMatch, 'Faltan datos estructurados.');
const schema = JSON.parse(schemaMatch[1]);
assert.equal(schema['@context'], 'https://schema.org');
const organization = schema['@graph'].find(item => item['@type'] === 'Organization');
assert.equal(organization?.url, `${site.origin}/`);
assert.equal(organization?.telephone, `+${config.whatsapp}`);
assert.equal(organization?.address?.addressCountry, 'UY');
assert.ok(schema['@graph'].some(item => item['@type'] === 'WebSite' && item.url === `${site.origin}/`));

const references = [...html.matchAll(/\s(?:src|href|data-src)=(["'])([^"']+)\1/g)].map(match => match[2]);
let responsiveCandidates = 0;
for (const image of tags('img')) {
  assert.ok('alt' in image, 'Imagen sin alt.');
  assert.ok(Number(image.width) > 0 && Number(image.height) > 0, 'Imagen sin dimensiones.');
  if (image.srcset) {
    assert.ok(image.sizes, 'Imagen responsive sin sizes.');
    for (const candidate of image.srcset.split(',')) {
      const [reference, descriptor] = candidate.trim().split(/\s+/);
      assert.match(descriptor, /^\d+w$/, 'Descriptor srcset incorrecto.');
      const width = reference.match(/-(480|800)\.webp/);
      if (width) assert.equal(descriptor, `${width[1]}w`);
      references.push(reference);
      responsiveCandidates++;
    }
  }
}
const deferred = tags('img').filter(image => image['data-src']);
assert.equal(deferred.length, 5, 'Se esperan cinco estados de la animación.');
assert.ok(deferred.every(image => !('src' in image)), 'El viajero debe cargar sus imágenes bajo demanda.');
references.push(metadata.get('og:image'), metadata.get('twitter:image'));
references.push(...[...css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)].map(match => match[1]));
const resourceUrls = new Set(['/']);
for (const reference of references) {
  if (!reference || reference.startsWith('#')) continue;
  const url = new URL(reference.replaceAll('&amp;', '&'), site);
  if (url.origin !== site.origin) continue;
  if (url.pathname === '/') continue;
  const relative = decodeURIComponent(url.pathname).slice(1);
  const file = path.resolve(dist, relative);
  assert.ok(file.startsWith(dist + path.sep), 'Recurso fuera de dist.');
  const contents = await readFile(file);
  if (/\.(?:js|css|png|webp|jpg|jpeg|svg|woff2?)$/.test(relative)) assert.equal(url.searchParams.get('v'), hash(contents), `Hash incorrecto: ${relative}`);
  resourceUrls.add(url.pathname + url.search);
}

const publishedFiles = [];
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), 'No se permiten enlaces simbólicos en el paquete.');
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await inspect(absolute);
    else {
      const relative = path.relative(dist, absolute).replaceAll('\\', '/');
      assert.ok(/^(?:index\.html|styles\.css|main\.js|robots\.txt|sitemap\.xml|assets\/[\w./-]+\.(?:png|webp|jpg|jpeg|avif|svg|gif|ico|woff2?|txt))$/.test(relative), `Archivo no público en dist: ${relative}`);
      assert.ok(!/(?:^|\/)(?:api|\.private|node_modules|deploy|config|data)(?:\/|\.)/i.test(relative), `Ruta privada en dist: ${relative}`);
      if (/\.(?:html|css|js|txt|xml)$/.test(relative)) {
        const content = await readFile(absolute, 'utf8');
        assert.ok(!/-----BEGIN [^-]*PRIVATE KEY-----|\b(?:api_key|initial_pin|SEMBRADOR_MAIL_CONFIG)\b|(?:^|["'\/])\.private\//m.test(content), `Marcador privado en archivo público: ${relative}`);
      }
      publishedFiles.push(relative);
    }
  }
}
await inspect(dist);
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
assert.ok(robots.includes('User-agent: *') && robots.includes('Allow: /'));
if (config.indexable) {
  assert.ok(robots.includes(`Sitemap: ${site.origin}/sitemap.xml`));
  assert.ok((await readFile(path.join(dist, 'sitemap.xml'), 'utf8')).includes(`<loc>${site.origin}/</loc>`));
  resourceUrls.add('/sitemap.xml');
}
resourceUrls.add('/robots.txt');
let localResponses = 0;
if (process.argv[2]) {
  const preview = new URL(process.argv[2]);
  assert.ok(preview.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(preview.hostname) && preview.pathname === '/' && !preview.search && !preview.hash && !preview.username && !preview.password, 'Usar únicamente el origen HTTP del servidor local.');
  for (const resource of resourceUrls) {
    const response = await fetch(new URL(resource, preview), { redirect: 'error', signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200, `Respuesta local incorrecta: ${resource}`);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(Number(response.headers.get('content-length')) > 0, `Recurso vacío: ${resource}`);
    await response.arrayBuffer();
    localResponses++;
  }
  for (const forbidden of ['/api/data.php', '/.private/', '/site.config.json', '/scripts/build.mjs']) {
    const response = await fetch(new URL(forbidden, preview), { redirect: 'error', signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 404, `El servidor expone una ruta no pública: ${forbidden}`);
    await response.arrayBuffer();
  }
}
console.log(JSON.stringify({ result: 'ok', internalLinks, whatsappLinks, responsiveCandidates, deferredImages: deferred.length, publishedFiles: publishedFiles.length, versionedResources: resourceUrls.size - (config.indexable ? 3 : 2), localResponses, excludedPrivateRoutes: localResponses ? 4 : 0 }, null, 2));