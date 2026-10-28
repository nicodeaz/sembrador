# El Sembrador — presentación de la trayectoria de Julio

Sitio: **https://elsembrador.okto.ie**. Versión vigente: **20261028-publica-4**, publicada el 28/10/2026 a las 19:54 UTC (misma hora local de Irlanda en esta fecha).

## Cambio y fuente

Se actualizó únicamente el contenido de la sección de Julio en `web/index.html`. La fuente factual es el usuario, quien confirmó en este hilo que Julio empezó a trabajar con aves alrededor de los 20 años, conoce de cerca a los productores de Canelones, trabajó en Perú, participó en congresos internacionales y trabajó con El Poyote y San Isidro, entre otros.

No se infirió un total de años de trayectoria. La ubicación, contacto, animaciones e imágenes conservaron la versión anterior. Las fotos reales de Julio y la granja siguen pendientes.

## Publicación y comprobación

- Directorio: `/home/ubuntu/sites/el-sembrador-web/releases/20261028-publica-4`.
- Imagen y contenedor: `el-sembrador-web:20261028-publica-4`, contenedor `el-sembrador-web`, `running healthy`.
- `current` apunta a la versión 4; se conservaron las anteriores.
- Puerto: `127.0.0.1:8086`.
- No se modificaron DNS, túnel, aplicación privada ni datos.

El agente principal compiló y revisó la sección en escritorio de 1280 px y móvil de 390 px, con texto legible y sin desbordamiento. El paquete contiene solo `dist/` y `deploy/`, con validación de rutas y enlaces simbólicos.

SHA-256 del paquete local y remoto:

`56279265c6c0cc417c7cce77b27814b165b5c7fe93bf9ccf89245e32d5c2440d`

La verificación posterior confirmó HTML público 200, coincidencia exacta con el compilado y presencia de los seis datos biográficos. SHA-256 del HTML:

`942a57835d39dbc6f158f7ffb5c7122e9277a964f0ea96b640b5357f2b70f53f`

La API en la web pública devuelve 404; la aplicación de gestión devuelve 200 y su API sin sesión devuelve 401. Al ser un cambio de texto, no se repitió la batería de recursos estáticos ya verificada en la versión 3.

La revisión final del navegador público en `#julio` confirmó el texto actualizado y el diseño correcto. La pestaña quedó abierta como entrega; se restableció el tamaño normal del navegador y se detuvo el servidor local de prueba.
