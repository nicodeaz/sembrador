# El Sembrador

Aplicación en español para organizar la granja y las ventas de ración, preparada para celular y escritorio. Publicada en https://sembrador.okto.ie el 27/10/2026.

- Lotes por galpón, llegadas previstas, salidas parciales y completas e historial.
- Cantidad de pollitas, edad al llegar y actual, bajas, alimentación en kilos y costos por lote.
- Compras semanales de maíz, soja y ración; kilos o bolsas con peso explícito; consumos ligados al precio de cada compra, ventas y elaboración.
- Calendario mensual de llegadas, retiros y trabajos, filtrado por galpón; fechas previstas, fechas reales y costos.
- Cuentas por mes, sin duplicar la compra del alimento al asignarlo a un lote.
- PIN de seis dígitos verificado en el servidor, respaldos e importación de versiones anteriores.
- Biblioteca de logo, etiquetas, flyers y aviso de servicios; carga privada de imágenes/PDF, descarga y compartir desde el celular.

## Persistencia

PHP guarda la granja en SQLite dentro de SEMBRADOR_DATA_DIR, una carpeta privada fuera del directorio público y de las carpetas de versiones. El frontend conserva copias y cambios pendientes por pestaña. Solo muestra «Guardado» cuando el servidor confirma. Las revisiones impiden sobrescribir cambios de otro dispositivo y las últimas 100 revisiones se conservan como respaldo interno.

Hace falta conexión para verificar el acceso al iniciar. Si se corta durante una sesión, se conservan los cambios pendientes en ese navegador y se reintenta al reconectar. No borrar el almacenamiento del navegador mientras haya cambios pendientes. Los respaldos diarios del VPS se ejecutan a las 03:17 UTC. El 27/10/2026, con autorización explícita del usuario, se descargó y verificó una copia en su carpeta privada local. No hay descarga local ni eliminación de copias automáticas.

## Desarrollo

Requisitos: Node.js y PHP 8.1+ con PDO SQLite.

- `npm install`: instalar dependencias.
- `npm run dev`: Vite, puerto 3000; API hacia SEMBRADOR_API_TARGET (por defecto XAMPP: http://localhost/sembrador).
- `npm run lint`: comprobar TypeScript.
- `npm test`: pruebas de cálculos y API con datos temporales.
- `npm run release`: compilar frontend + PHP en dist/, excluyendo datos y configuración privada.
- `node scripts/preview.mjs`: vista previa ficticia de dist/ en http://127.0.0.1:8307. PIN de prueba: 742913. No reutilizarlo en producción.

Con XAMPP, configurar SEMBRADOR_DATA_DIR (por ejemplo C:/xampp/sembrador-data) y un PIN inicial privado en el entorno de PHP o api/config.local.php. Ese archivo nunca se versiona. VITE_BASE_PATH permite compilar para una subcarpeta; / corresponde a un subdominio.

## Publicación y recuperación

Seguir [la guía de despliegue](deploy/README.md). El destino confirmado es Okto: contenedor `sembrador-app`, subdominio https://sembrador.okto.ie y datos externos en `/home/ubuntu/sembrador-private/data`. Se verificaron HTTPS, acceso y persistencia al recrear el contenedor.

Los datos que solo estaban en otro navegador/dominio requieren exportarse desde allí o localizar un respaldo. Cambiar de subdominio no permite leer automáticamente ese almacenamiento. Si existe JSON del backend anterior, la API lo migra conservando los archivos originales.

## Código principal

- src/FarmApp.tsx y src/components/FarmWorkspace.tsx: pantallas y formularios actuales.
- src/utils/useFarm.ts: carga, guardado, pendientes y conflictos.
- src/utils/farm.ts: validación, stock, movimientos y costos.
- api/lib/farm_store.php: SQLite, migración, validación y revisiones.
- api/backup.php: respaldo consistente por línea de comandos; SQLite incluye imágenes y JSON incluye solo registros.
- api/media.php: biblioteca autenticada en la misma base SQLite, independiente de las revisiones de registros.
- tests/: cálculos, autenticación y persistencia entre versiones.

Las vistas antiguas se conservan; la entrada actual es FarmApp desde src/main.tsx. No se insertan datos de ejemplo en producción.

## Flyers pendientes

Cuatro piezas: ración ovina peletizada, ovina no peletizada, ponedoras y recría. El logo original del repositorio ya está disponible en Compartir. Faltan la etiqueta de referencia y el aviso usado en la revista avícola para preparar las piezas y su contenido. No inventar precios, composición nutricional ni contacto.
