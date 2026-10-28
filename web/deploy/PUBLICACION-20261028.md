# Publicación de El Sembrador · 28/10/2026

Sitio público: **https://elsembrador.okto.ie**.

Versión: `20261028-publica-1`. Publicación completada el 28/10/2026, aproximadamente a las 18:33 UTC. Dominio elegido explícitamente por el usuario; revisión visual móvil/escritorio y compilación terminadas antes de publicar.

## Instalación aislada

- Servidor: alias SSH `okto-vps`.
- Directorio: `/home/ubuntu/sites/el-sembrador-web/releases/20261028-publica-1`.
- Enlace vigente: `/home/ubuntu/sites/el-sembrador-web/current`.
- Contenedor/proyecto: `el-sembrador-web`.
- Imagen: `el-sembrador-web:20261028-publica-1`.
- Puerto: `127.0.0.1:8086 → 80`.
- Contenedor estático Nginx con filesystem de solo lectura y temporales en memoria. No monta archivos, bases de datos ni respaldos de la aplicación de gestión.
- Paquete: únicamente `web/dist/` y `web/deploy/`. SHA-256 local y remoto idéntico: `c29f613f56e6ff6368d2b1d0509b80f6b1d8841a52c0fc7628325eed7800695a`.

Comando ejecutado desde la carpeta de versión:

```sh
SEMBRADOR_WEB_RELEASE=20261028-publica-1 docker compose -f deploy/compose.yaml up -d --build --wait
```

El contenedor pasó a `healthy`. Se comprobaron HTML, robots, sitemap e imagen social por loopback antes de habilitar la entrada pública.

## Ruta y DNS

Se agregó una sola regla: `elsembrador.okto.ie → http://localhost:8086`, antes de la regla final 404. El script `configure-route.py` guardó el archivo anterior en el servidor:

`/etc/cloudflared/config.yml.before-elsembrador-web-20261028T183311Z`

Se validó la configuración con `cloudflared tunnel ... ingress validate`. La comprobación posterior confirmó que, al retirar exactamente la nueva regla, el archivo coincide byte a byte con el anterior. No se cambiaron otras rutas.

Como usuario `ubuntu`, se creó el CNAME sin sobrescribir registros existentes:

```sh
cloudflared tunnel route dns d239fecd-0a9f-4b2e-a5ea-a3cfce63f674 elsembrador.okto.ie
```

`activate-route.sh` inició una réplica temporal del conector en `127.0.0.1:20242`, esperó que estuviera lista y reinició el principal. Tras verificar `/ready` en `127.0.0.1:20241`, detuvo la réplica. El principal quedó saludable y la unidad temporal inactiva. No se mostraron ni descargaron credenciales.

## Verificación pública

Todas las solicitudes se hicieron por HTTPS con validación normal del certificado:

| Recurso | Resultado |
| --- | --- |
| `/` | 200, HTML igual a la versión local comprobada |
| `/robots.txt` | 200, permite rastreo y declara sitemap |
| `/sitemap.xml` | 200, URL canónica correcta |
| `/assets/social-card.jpg` | 200, JPEG de 164.283 bytes |
| `/assets/farm-editorial.webp` | 200, WebP de 340.490 bytes |
| `/assets/maize-float.png` | 200, PNG de 795.682 bytes |
| `/pagina-inexistente-verificacion` | 404 real |
| `/api/data.php` en la web pública | 404; no se publicó el backend privado |
| `https://sembrador.okto.ie/` | 200, aplicación existente disponible |
| `https://sembrador.okto.ie/api/data.php` sin sesión | 401, acceso privado preservado |

SHA-256 del HTML local y público: `2b68d4c9d650be32370197972b8389f52fa961da783c180dbe9e041c3f7293ea`.

Se verificaron canonical, datos estructurados, `index, follow, max-image-preview:large`, URL absoluta de la imagen social y WhatsApp `https://wa.me/59895737818`. No quedan tokens de compilación ni `noindex` en el HTML publicado.

La revisión en navegador cubrió escritorio de 1280/1440 px y móvil de 390/320 px: sin desbordamiento horizontal, enlaces y menú funcionales. La URL de producción se abrió y mostró la versión correcta sin errores de consola. La comprobación local validó los siete enlaces de WhatsApp, JSON-LD, un único H1, canonical y recursos. El servidor local de vista previa se detuvo; el navegador de producción quedó abierto como entrega.

## Pendiente de contenido

Las imágenes generadas son ilustrativas; se sustituirán con las fotos reales que entregue el usuario. La localidad y el alcance geográfico siguen pendientes de confirmación. No se verificó una propiedad de Google Search Console ni se solicitó indexación manual: la preparación técnica y el sitemap están publicados, pero el rastreo y la indexación dependen de Google.
