# El Sembrador · web pública

One page estática independiente de la aplicación de gestión. No requiere PHP, base de datos, cuentas ni formularios. Todos los contactos van al WhatsApp publicado de **Julio Díaz: 095 737 818**.

Publicada el **28/10/2026** en **https://elsembrador.okto.ie**, con indexación habilitada y HTTPS verificado. Versión vigente **`20261028-publica-5`**. Ver [registro de la versión vigente](deploy/PUBLICACION-V5-20261028.md).

El recorrido es lineal: **huevo → nacimiento → pollito → pollita → gallina**, y termina en la sección de la granja. No repite el huevo al final ni ofrece reinicio del ciclo. Tiene escenas propias para recría, nutrición, granja, Julio y contacto; conserva el logo original y usa Manrope local con la paleta verde y naranja de la marca. La animación se adapta a móvil y respeta la preferencia de movimiento reducido.

**Cambios preparados después de V5 (sin publicar todavía):** navegación pensada primero para el celular (encabezado fijo, menú a pantalla completa, barra inferior con las secciones y WhatsApp, textos de 10 px o más), hero con la foto real del campo con el caballo y la vaca desvaneciéndose hacia el texto, fondos de las etapas con las fotos reales tal cual (se abren cuando llega el personaje), movimiento de reposo de los personajes (el huevo se mece, el pollito salta, la pollita picotea, la gallina respira), logo sin recuadro y Tibu presentado como Jefe de Seguridad y Operaciones.

Datos confirmados por el usuario: **El Sembrador · Julio Díaz · San Antonio, Ruta 81, km 35,500 · Uruguay**. No se infirió departamento ni zona de cobertura adicional.

La presentación de Julio incorpora la trayectoria aportada por el usuario: comenzó con aves alrededor de los 20 años, conoce a los productores de Canelones, trabajó en Perú, participó en congresos internacionales y trabajó con El Poyote y San Isidro, entre otros. No se calculó ni afirmó un total de años de experiencia.

Desde esta carpeta, con Node.js:

```powershell
npm run check
npm run build
npm start
```

Vista local: http://127.0.0.1:8310. `PORT` permite cambiar el puerto. La compilación copia únicamente HTML, CSS, JS y recursos públicos a `web/dist/`; nunca incluye datos ni código de la aplicación de gestión.

## Publicación en Okto

1. Revisar `site.config.json`: `siteUrl` es `https://elsembrador.okto.ie`. `whatsapp` usa formato internacional sin `+` ni espacios.
2. `indexable` ya está en `true`; ejecutar `npm run build`. El modo público agrega sitemap y habilita la indexación. Para una futura vista de borrador no pública, usar `false` (`noindex, follow`).
3. Usar un sitio/contenedor propio, por ejemplo `el-sembrador-web`, separado de `sembrador-app`, y una ruta propia bajo `/home/ubuntu/sites/el-sembrador-web/`. No reutilizar los scripts de despliegue de la aplicación de gestión.
4. Subir solamente `dist/` y `deploy/` a una nueva carpeta de versión. Allí ejecutar `SEMBRADOR_WEB_RELEASE=<version> docker compose -f deploy/compose.yaml up -d --build --wait`. El contenedor `el-sembrador-web` sirve únicamente `dist/` en `127.0.0.1:8086` y no monta datos privados. El puerto estaba libre en la revisión del 28/10/2026; comprobarlo otra vez al desplegar.
5. La ruta `elsembrador.okto.ie → http://localhost:8086` y el DNS ya existen. Las actualizaciones normales de esta web no necesitan cambiar ni reiniciar el túnel. Los scripts de creación de la ruta se conservan solo como registro de la instalación inicial.
6. Verificar HTTPS, WhatsApp, vista móvil, imagen social, canonical, `robots.txt` y `sitemap.xml` en el dominio real. Después verificar la propiedad en Google Search Console y enviar el sitemap.

El HTML incluye títulos, descripción, enlaces canónicos, Open Graph, Twitter Card y datos estructurados. El contenido principal está disponible sin JavaScript. No se agregaron estadísticas, certificaciones, dirección ni área de servicio no verificadas. No se instaló Analytics: requiere un identificador real si se decide usarlo.

Google decide cuándo rastrear e indexar; la configuración técnica no garantiza posición ni indexación inmediata. Referencias: [SEO para desarrolladores](https://developers.google.com/search/docs/fundamentals/get-started-developers), [SEO y JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [indexación y rastreo](https://developers.google.com/search/help/crawling-index-faq).

## Imágenes y contenido

**Las fotografías de Julio, los animales y la granja fueron entregadas el 28/10/2026 y sus versiones preparadas están publicadas en V5.** El diseño se revisó a 1280, 900, 390 y 320 px antes de publicar.

El logo original se conserva intacto. La dirección publicada usa verde `#00643b`, naranja `#ff8708`, forest `#003e29`, crema `#fffaf0` y mint `#edf0e3`. Manrope se sirve localmente y los títulos usan peso 800: una sans serif de carácter cercano al logo, sin afirmar que sea su tipografía exacta. Ver [dirección de marca](design/brand-direction.txt).

La composición reparte las fotos entre las secciones y evita una galería independiente. Los pollitos acompañan recría; la rueda, el campo y El Tata forman la escena de la granja. Julio aparece junto a su trayectoria; Tibu, Jefe de Seguridad y Operaciones, acompaña el contacto por WhatsApp y el chanchito con lentes se integra en la granja. Pelotón tiene un pequeño recuerdo dentro de esa escena. El ciclo mantiene un solo recorrido hasta la gallina.

| Personaje | Recurso local | Prompt exacto y procedencia |
| --- | --- | --- |
| Julio frontal con remera de El Sembrador | `assets/characters/julio-frente.webp` | [characters-prompts.txt](design/characters-prompts.txt) |
| Tibu en contacto | `assets/characters/tibu.webp` | [tibu-character.txt](design/tibu-character.txt) |
| Chanchito con lentes | `assets/characters/chanchito.webp` | [pig-character.txt](design/pig-character.txt) |

Los tres personajes se prepararon con **ImageGen integrado**, a partir de las referencias reales, con poses o encuadres recompuestos y transparencia. Son ediciones, no fotografías documentales intactas. El logo representado sobre la remera no garantiza píxeles idénticos al original; el archivo original sigue siendo la marca principal. Las imágenes originales del usuario permanecen sin modificar.

Fondos con las fotos reales, sin retoques: la mitad derecha del hero usa `campo.webp` (caballo y vaca), recortada con menos cielo en `assets/hero/` mediante [photo-backgrounds.py](design/photo-backgrounds.py). Dentro del ciclo, el huevo va sobre un disco claro; el nacimiento usa `pollitas-recria.webp`, el pollito `pollitos.webp`, y la pollita y la gallina, el pasto de `el-tata.webp` con distinto encuadre. La gallina se muestra más grande. `assets/logo-clear.webp` es el logo original con el fondo blanco transparente, para que no muestre un recuadro sobre el crema; no se modificaron formas ni colores.

Las fotos preparadas están en `assets/photos/`. Como las fuentes eran capturas de Fotos del teléfono, se retiraron interfaz, márgenes y miniaturas mediante edición con ImageGen. También se quitó el chanchito de la foto de El Tata y a la persona de la foto de la rueda. Los detalles están en [photos-edits.txt](design/photos-edits.txt), [photos-preparation-a.txt](design/photos-preparation-a.txt) y [photos-preparation-b.txt](design/photos-preparation-b.txt). No publicar las capturas originales con su interfaz o tira de miniaturas.

La tarjeta social publicada está en `assets/social-card.jpg` (1200 × 630), con tipografía sans, paleta de marca y retrato frontal de Julio. Su hash público coincide con el archivo final verificado. Ver [prompt y procedencia](design/social-brand-prompt.txt).

Servicios y WhatsApp se verificaron contra los avisos comerciales existentes; el nombre público **Julio Díaz** y la ubicación **San Antonio, Ruta 81, km 35,500** fueron confirmados por el usuario. El alcance geográfico de la atención no se especificó.

El build agrega versiones de contenido a las URLs de CSS, JS, fuentes e imágenes. Al cambiar un archivo y recompilar, el navegador recibe su versión nueva sin renombrar los originales. El maíz y las antiguas fuentes Instrument Serif quedan fuera del paquete público.

Editar el contenido en `index.html`, la presentación en `styles.css` y las animaciones en `main.js`. Tras cualquier cambio, volver a compilar. Las fuentes se sirven localmente desde `assets/fonts/`.
