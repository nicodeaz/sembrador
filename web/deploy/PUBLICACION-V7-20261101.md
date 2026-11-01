# El Sembrador — animación del recorrido en celulares

Sitio: **https://elsembrador.okto.ie**. Versión publicada el **01/11/2026**: **`20261101-publica-7`**.

## Cambio

El personaje del recorrido huevo → nacimiento → pollito → pollita → gallina ahora acompaña el scroll también en celulares y tablets (menos de 1100 px). Antes, en esos anchos solo se animaban las imágenes dentro de cada escena.

En pantallas angostas el texto ocupa toda la columna y no hay un corredor libre entre escenas, así que el personaje sale de su escena, espera en una insignia redonda abajo a la izquierda (crema, con borde verde, espejo del botón de WhatsApp) mientras pasa el texto, cambia ahí a la etapa siguiente y vuela a la escena próxima. La insignia no intercepta toques. En escritorio (1100 px o más) se mantienen las rutas que evitan textos y el fundido de respaldo de V6, sin cambios. Se conserva la preferencia de movimiento reducido.

Archivos modificados: `main.js` (carga del personaje en cualquier ancho y fase de insignia) y `styles.css` (se quita el ocultamiento por debajo de 900 px y se agrega el estilo de la insignia).

## Despliegue

- Directorio: `/home/ubuntu/sites/el-sembrador-web/releases/20261101-publica-7`.
- `current` apunta a ese directorio.
- Imagen: `el-sembrador-web:20261101-publica-7`; contenedor `el-sembrador-web`, saludable, en `127.0.0.1:8086`.
- Paquete: `dist/` más `deploy/Dockerfile`, `deploy/compose.yaml` y `deploy/nginx.conf`. SHA-256: `f8d198b569f6bf9749a58e7ca99755670dbf10af2ed1734369136d144dce629f`.
- `20261029-publica-6` se conserva para revertir.

## Verificación

`npm run check`, `npm run build` y `node scripts/check-site.mjs` superados (18 anclas, 10 enlaces WhatsApp, 25 candidatos responsive, 41 archivos publicados, 37 recursos versionados, 4 rutas privadas en 404).

Revisión en navegador a 390, 320, 820 y 1440 px: el personaje recorre egg → insignia → nacimiento/pollito → insignia → pollita → insignia → gallina en los anchos angostos; en 1440 px nunca entra en modo insignia. Sin desbordamiento horizontal ni errores en consola. Los anchos angostos se probaron en un iframe del tamaño indicado, no en un teléfono físico.

Los **41 archivos publicados** respondieron por HTTPS con SHA-256 idéntico a los locales:

| Archivo | SHA-256 |
| --- | --- |
| `index.html` | `84ae53523fca4d7b758100d357dfd782e37c9d50ac6fd3e3c8911fdb662ed1a5` |
| `styles.css` | `780ecc183b50c5af06e50925a1ab078382bf7de88746ef517eb46927a3e96632` |
| `main.js` | `a6637c17c40c757044df681514e0aedc2ba86bd9caddf895d6e11cf8fc66ae68` |

`https://sembrador.okto.ie/` respondió 200 y su API sin sesión, 401. `/api/data.php` en la web pública respondió 404.

## Pendiente

Vincular y verificar la propiedad en Google Search Console y enviar `sitemap.xml`. Requiere la cuenta de Google del propietario; no se hizo en V7.
