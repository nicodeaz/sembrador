# El Sembrador — identidad de marca y escenas de la granja

Sitio: **https://elsembrador.okto.ie**. Versión vigente: **20261028-publica-5**, publicada el 28/10/2026 a las 21:02 UTC (misma hora local de Irlanda en esta fecha).

## Resultado publicado

La presentación conserva el logo original, usa Manrope con títulos fuertes y la paleta verde y naranja de El Sembrador. Las fotografías y los personajes están integrados en escenas propias: Julio frontal junto a su trayectoria, Tibu junto al contacto por WhatsApp y el chanchito en el entorno de la granja. Pelotón aparece como recuerdo. La galería independiente descartada no fue publicada.

Se mantiene un único recorrido huevo → nacimiento → pollito → pollita → gallina, hasta la granja. El diseño y las escenas tienen adaptación móvil y soporte para movimiento reducido.

Las imágenes provienen del archivo aportado por el usuario. Los personajes y fotografías preparados son ediciones con ImageGen integrado; las poses y algunos entornos fueron recompuestos. No se presentan como fotografías documentales intactas. El logo principal conserva su archivo original. La tarjeta social nueva mide 1200 × 630 y usa el retrato frontal y la paleta de marca. Prompts y fuentes permanecen en `web/design/`.

## Despliegue aislado

- Directorio: `/home/ubuntu/sites/el-sembrador-web/releases/20261028-publica-5`.
- Imagen: `el-sembrador-web:20261028-publica-5`.
- Contenedor: `el-sembrador-web`, `running healthy`.
- Puerto: `127.0.0.1:8086`.
- `current` apunta a la versión 5.
- Paquete limitado a `dist/` y `deploy/`, validado para rechazar rutas externas y enlaces simbólicos.
- Versiones anteriores conservadas. V4 permaneció disponible para restauración; no fue necesario restaurarla.
- No se modificaron DNS, túnel, aplicación privada ni datos.

SHA-256 del paquete final local y remoto:

`19d773b655c8a00c4116f312efd019717a842ed1bb7d91728c1968ca17fdfffb`

Comando ejecutado desde la carpeta de la versión:

```sh
SEMBRADOR_WEB_RELEASE=20261028-publica-5 docker compose -f deploy/compose.yaml up -d --build --wait --wait-timeout 60
```

## Verificación

Antes de publicar, el agente principal ejecutó `npm run check` y `npm run build` y revisó 1280, 900, 390 y 320 px. Todas las imágenes cargaron, no hubo desbordamiento horizontal ni errores, el menú móvil cerró correctamente y los destinos de WhatsApp conservaron el número confirmado.

La comprobación pública por HTTPS devolvió 200 y coincidencia de contenido para todos los siguientes archivos:

| Archivo | SHA-256 público y local |
| --- | --- |
| `index.html` | `867c10a19e86f9b4819d5325f68385fe57125ff3299844679568e98c5a7ce97b` |
| `styles.css` | `936dd10a45c9bf418d6754b0cac6d3afb3849cbc20b8f4778a8e43b7c4e42df3` |
| `main.js` | `6d27523d0fde389a053b4a5b9bac5b9a5915f2a77c8a86bffed5a5a34d694adc` |
| `assets/characters/julio-frente.webp` | `8c226794da00c0328a29e57fa2b1ae52399a2f0195f74b59d9f20ec616e97615` |
| `assets/characters/tibu.webp` | `51fd55bfe3a1b7b53bb525698aa4132a4759d3e113119dc0d6c17ca9f950afb7` |
| `assets/characters/chanchito.webp` | `585c4ebcc0a46a740e0ff76b5f3f0a72258fa1ee82973dc4401dce9fd5a280a0` |
| `assets/social-card.jpg` | `cae43e3f4c914c45f0d8bb3b737a4dd426b78b4c708124a26cd1cedfe39b2332` |

`robots.txt` y `sitemap.xml` devolvieron 200. Una URL inexistente y `/api/data.php` en la web pública devolvieron 404. La aplicación de gestión `https://sembrador.okto.ie/` siguió devolviendo 200 y su API sin sesión, 401.

La revisión final del navegador público confirmó la nueva marca y el retrato frontal de Julio con su remera, sin errores de consola. La pestaña quedó abierta en `#julio` como entrega; se cerró el servidor local de prueba.

Search Console e indexación efectiva siguen pendientes; los metadatos y sitemap están publicados.
