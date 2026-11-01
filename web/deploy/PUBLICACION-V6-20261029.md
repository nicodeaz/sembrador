# El Sembrador — ajustes finales de la web pública

Sitio: **https://elsembrador.okto.ie**. Versión publicada el **29/10/2026**: **`20261029-publica-6`**. Verificación pública completada a las **15:04:47 UTC**.

## Resultado publicado

La portada explica directamente la recría y venta de pollitas, las raciones para aves y ovinos y el asesoramiento de Julio Díaz. Las tarjetas de ración indican que abren una consulta por WhatsApp; la trayectoria de Julio se presenta después de su servicio actual. Se conservan el contacto y los datos comerciales confirmados.

Los fondos conectan las escenas con variaciones de verde y crema. Se ajustaron sombras, luz, encuadres y posición de los personajes mediante CSS, manteniendo los archivos de imágenes originales. El chanchito queda dentro de su escena y se mejoran los encuadres de Pelotón, Julio y Tibu.

El recorrido huevo → nacimiento → pollito → pollita → gallina calcula rutas que evitan textos y enlaces. Si el espacio disponible no permite una ruta legible, usa un fundido entre escenas. El personaje que viaja se carga bajo demanda únicamente desde 1100 px y cuando no se solicita movimiento reducido; en pantallas menores se animan las imágenes locales de cada escena. Se conserva la preferencia de movimiento reducido y se restablecen las transformaciones al cambiarla.

Se generaron 18 variantes WebP de 480 y 800 px para nueve fotos/personajes, con calidad 82 y transparencia conservada. Se publican las 17 utilizadas en `srcset`; el detalle de pollitos solo necesita la variante de 480 px. Las nueve variantes de 480 px suman 660.670 bytes frente a 2.677.074 bytes de sus originales (75,3 % menos); las de 800 px suman 1.546.346 bytes (42,2 % menos). Son comparaciones entre archivos, no una medición de descarga total de la página. La compilación valida y versiona también `data-src` y excluye recursos sin uso.

## Despliegue

- Directorio: `/home/ubuntu/sites/el-sembrador-web/releases/20261029-publica-6`.
- `current`: `/home/ubuntu/sites/el-sembrador-web/current`, apuntando a ese directorio.
- Imagen: `el-sembrador-web:20261029-publica-6`.
- Contenedor: `el-sembrador-web`, saludable, publicado en `127.0.0.1:8086`.
- Paquete: `dist/` más `deploy/Dockerfile`, `deploy/compose.yaml` y `deploy/nginx.conf`; los documentos y scripts de mantenimiento no se despliegan.
- La versión anterior `20261028-publica-5` se conserva para revertir el código si fuera necesario.

SHA-256 del paquete:

`d5392f339ede83497242f37fdf4e26e2c6e665b0eed084c0ec9f0cfa685248ce`

## Verificación

`npm run check`, `npm run build` y `node scripts/check-site.mjs http://127.0.0.1:8310/` superados. El verificador confirmó 18 anclas, 10 enlaces WhatsApp, SEO y JSON-LD, 25 candidatos responsive, cinco imágenes diferidas y 37 recursos versionados. Los 40 GET locales de la página y sus recursos respondieron 200; las cuatro rutas locales de API, carpeta privada, configuración y scripts respondieron 404.

La revisión en navegador cubrió 390, 320, 900 y 1280 px: sin desbordamiento horizontal, menú móvil operativo, recorrido continuo hasta la gallina y consola sin errores. El soporte de movimiento reducido y su restablecimiento se revisaron en el código; no se registró una emulación de esa preferencia en el navegador.

Los **41 archivos publicados** respondieron 200 por HTTPS y sus SHA-256 coincidieron con los archivos locales. Evidencia local: `.test-artifacts/publica-6-verification.json`, registrada el `2026-10-29T15:04:47.508Z`.

| Archivo | SHA-256 local y público |
| --- | --- |
| `index.html` | `7f2260a45d1a8a0a6550bd9e104a4f2722101715eaf39c1e9da9d3010ffdbd41` |
| `styles.css` | `02b23ffe259ec4257aa8ccfbc0d3efab781ec9eb7b47dd3a6a9d8d0f664aab19` |
| `main.js` | `a30e0c07a7b0243cf51227692850c2d72d1d6f9702d8f4a84a6eebd872c2c7c5` |
| `assets/social-card.jpg` | `cae43e3f4c914c45f0d8bb3b737a4dd426b78b4c708124a26cd1cedfe39b2332` |

La aplicación de gestión `https://sembrador.okto.ie/` siguió respondiendo 200 y su API sin sesión, 401. `/api/data.php` en la web pública respondió 404.

## Pendiente

La vinculación y verificación en Google Search Console y el envío del sitemap siguen pendientes. V6 no realizó esos pasos ni confirma indexación efectiva. Canonical, metadatos, robots y sitemap están publicados.
