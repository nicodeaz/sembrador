# El Sembrador — recorrido lineal y datos confirmados

Sitio: **https://elsembrador.okto.ie**. Versión vigente: **20261028-publica-3**, publicada el 28/10/2026 a las 19:49 UTC (misma hora local de Irlanda en esta fecha).

## Cambios publicados

- Recorrido único: huevo → nacimiento → pollito → pollita → gallina. Termina en la granja; se retiraron el huevo final repetido y el reinicio.
- Nombre público confirmado: **Julio Díaz**.
- Ubicación confirmada: **San Antonio, Ruta 81, km 35,500, Uruguay**.
- Descripción SEO, datos de contacto y dirección `PostalAddress` actualizados. No se infirió departamento ni radio de atención.
- Tarjeta social de 1200 × 630 actualizada con Julio Díaz y revisada visualmente.

Las fotografías reales de Julio y de la granja siguen pendientes de entrega. La pieza de identidad conserva el logo original y la imagen de granja continúa señalada como ilustrativa. No se generó un retrato ficticio.

## Despliegue

- Directorio: `/home/ubuntu/sites/el-sembrador-web/releases/20261028-publica-3`.
- `current` apunta a esa versión.
- Contenedor/proyecto: `el-sembrador-web`.
- Imagen: `el-sembrador-web:20261028-publica-3`.
- Puerto: `127.0.0.1:8086`.
- Paquete limitado a `dist/` y `deploy/`, sin rutas externas ni enlaces simbólicos.
- Se conservaron todas las versiones anteriores.
- No se cambiaron DNS, túnel, aplicación privada ni datos.

Comando ejecutado desde la carpeta de la versión:

```sh
SEMBRADOR_WEB_RELEASE=20261028-publica-3 docker compose -f deploy/compose.yaml up -d --build --wait --wait-timeout 60
```

El contenedor quedó `running healthy`. SHA-256 del paquete local y remoto:

`d95b492a55798f1b445047bc78dc33a0ae82d0e202412ffc255eb13c60f7aace`

## Verificación

El agente principal revisó escritorio de 1280 px y móvil de 320 px: recorrido lineal, gallina final en la granja, ausencia del huevo repetido y reinicio, dirección legible, navegación de cuatro etapas y ausencia de desbordamiento, imágenes fallidas o errores de consola. La tarjeta social fue revisada visualmente. `npm run check` y `npm run build` finalizaron correctamente antes de publicar.

Antes de subir se comprobó que la tarjeta social compilada coincidía con la última fuente. Después de publicar:

| Recurso | Resultado |
| --- | --- |
| HTML público | 200 e idéntico a `web/dist/index.html` |
| 16 solicitudes versionadas de CSS, JS, imágenes y fuentes | 200; versiones de URL coinciden con los hashes del contenido |
| `robots.txt` y `sitemap.xml` | 200 |
| URL inexistente | 404 real |
| `/api/data.php` en la web pública | 404 |
| Aplicación de gestión `https://sembrador.okto.ie/` | 200 |
| API privada sin sesión | 401 |

SHA-256 del HTML público:

`ada9152b788c028b263b9474f118294bd6c8903d19fb481e532418b95fff6a25`

El JSON-LD contiene exactamente `Julio Díaz`, `Ruta 81, km 35,500`, `San Antonio` y país `UY`, sin `addressRegion` inferido. No quedan tokens, referencias al maíz ni elementos del reinicio o huevo final en el HTML publicado.

La revisión final en el navegador público confirmó el título, nombre, dirección y contacto actualizados, sin errores de consola. La pestaña pública quedó abierta en contacto y se detuvo el servidor de prueba local.

Search Console e indexación efectiva siguen pendientes. La preparación técnica y el sitemap están publicados.
