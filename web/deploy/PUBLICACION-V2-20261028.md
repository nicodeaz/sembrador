# El Sembrador — segunda versión pública

Sitio: **https://elsembrador.okto.ie**. Versión vigente: **20261028-publica-2a**, publicada el 28/10/2026 a las 19:36 UTC (misma hora local de Irlanda en esta fecha).

## Resultado

Se reemplazó el maíz por el recorrido huevo → nacimiento → pollito → pollita → gallina → huevo, con retorno al origen. Las secciones tienen composiciones y colores propios; se conservó el logo original y se refinaron tipografías y botones. Las fuentes Fraunces y Manrope se sirven localmente con sus licencias.

Las fotos reales de Julio y de la granja **siguen pendientes de entrega**. La sección de Julio utiliza una pieza gráfica con el logo original, preparada para insertar su retrato real. La fotografía de granja actual está identificada como ilustrativa. No se fabricó la identidad de Julio ni se afirmó que fueran imágenes de la granja real.

## Despliegue

- Directorio: `/home/ubuntu/sites/el-sembrador-web/releases/20261028-publica-2a`.
- `current` apunta a esa versión.
- Contenedor/proyecto: `el-sembrador-web`.
- Imagen: `el-sembrador-web:20261028-publica-2a`.
- Puerto: `127.0.0.1:8086`.
- Paquete: solo `dist/` y `deploy/`, revisado para rechazar rutas fuera de esas carpetas y enlaces simbólicos.
- No se modificaron DNS, configuración del túnel, aplicación privada ni datos.
- Se conservaron las versiones anteriores. La versión intermedia `20261028-publica-2` se sustituyó por `2a` para corregir una superposición de flechas en las tarjetas de raciones a 320 px.

Comando desde la carpeta de la versión:

```sh
SEMBRADOR_WEB_RELEASE=20261028-publica-2a docker compose -f deploy/compose.yaml up -d --build --wait --wait-timeout 60
```

El contenedor quedó `running healthy`. SHA-256 del paquete local y remoto:

`e99af788c962697ee19113d93e05cac15070736ce4c2ece520a601ca5976abbf`

## Verificación

La revisión visual cubrió escritorio de 1280 px y móviles de 390 y 320 px: ciclo completo, retorno, menú, adaptación móvil y ausencia de desbordamiento horizontal. En 320 px se comprobó que las flechas de las cuatro tarjetas ya no intersectan sus títulos; el menú abre, cierra y navega a Julio. Se validaron diez enlaces de WhatsApp con el número correcto, un único H1 y JSON-LD válido. El contraste del texto principal supera 4,5:1 en las superficies comprobadas. Sin errores de consola en la revisión realizada por el agente principal. `npm run check` y `npm run build` finalizaron correctamente.

Después de publicar:

| Recurso | Resultado |
| --- | --- |
| HTML público | 200 e idéntico a `web/dist/index.html` |
| 16 solicitudes versionadas de CSS, JS, imágenes y fuentes | 200; cada versión en la URL coincide con el hash de su contenido |
| `robots.txt` y `sitemap.xml` | 200 |
| URL inexistente | 404 real |
| `/api/data.php` en la web pública | 404 |
| Aplicación de gestión `https://sembrador.okto.ie/` | 200 |
| API privada sin sesión | 401 |

SHA-256 del HTML publicado:

`753fde71b70d64da4915906e9607488db0afa7e86a74a15b71e38161d0eefd97`

El JSON-LD es válido; no quedan tokens ni referencias al maíz. Canonical, metadatos sociales y WhatsApp siguen configurados. El build usa versiones de contenido en las URLs, conservando nombres de archivo estables.

Search Console, la indexación efectiva y la localidad exacta siguen pendientes. La preparación técnica y el sitemap están publicados.
