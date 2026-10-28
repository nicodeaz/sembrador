# El Sembrador

Aplicación en español para una granja familiar. Priorizar formularios claros, botones grandes, uso en celular y confirmación real del guardado.

## Arquitectura vigente

React 19 + TypeScript + Vite, con backend PHP 8.1+ y SQLite. src/main.tsx carga FarmApp.tsx. FarmWorkspace.tsx contiene Inicio, Lotes, Raciones, Calendario, Cuentas y Compartir. FarmCalendar, RearingOverview y MediaLibrary separan calendario, recría y material comercial. src/farm.css usa variables para temas claro y oscuro. Las vistas antiguas se conservan, pero no son la entrada activa.

FarmData versión 3 contiene batches, records, departures, tasks y movements. Batch.barn es opcional para compatibilidad; los nombres de galpón son editables. StockMovement.purchaseId vincula un consumo con una compra; corregirla recalcula los costos ligados. Validar cantidad disponible y fecha. No insertar datos de ejemplo en producción. Conservar registros antiguos y unidades; nunca convertir bolsas a kilos sin conocer su peso.

useFarm.ts serializa guardados, mantiene revisiones, reintenta operaciones idempotentes y conserva pendientes por pestaña. Solo mostrar «Guardado» tras confirmación del servidor. No resolver conflictos sobrescribiendo automáticamente.

api/lib/farm_store.php valida y guarda la granja en una transacción SQLite. Los datos y el hash del PIN viven en SEMBRADOR_DATA_DIR, carpeta absoluta fuera del directorio público y de las versiones. Las migraciones deben ser aditivas y conservar las fuentes. No convertir corrupción en arrays vacíos. No cachear /api/ en el service worker.

## Costos

Compras y ventas son movimientos comerciales. El consumo descuenta stock y se asigna al lote, sin sumar la compra otra vez como egreso. En elaboración se descuentan ingredientes, se agrega ración y solo el costo adicional es un egreso. Trabajos pendientes tienen costo previsto; terminados tienen costo real. Salidas parciales reducen cantidad presente y el cierre conserva el historial.

La biblioteca de imágenes está en la tabla SQLite media, protegida por PIN; no incluirla en localStorage ni en FarmData/JSON. El logo original está en public/logo-original.png. El respaldo SQLite contiene registros e imágenes; el JSON solamente registros.

## Comandos

- npm run lint: TypeScript.
- npm test: cálculos, migración, API, PIN, conflictos, idempotencia, respaldos, reinicio y cambio de versión con datos temporales.
- npm run release: compilar y copiar solo código PHP + frontend a dist/.
- node scripts/preview.mjs: instancia local ficticia en puerto 8307. No reutilizar el PIN de prueba en producción.

api/config.local.php es privado del servidor; nunca incluirlo en Git ni en el paquete. No modificar datos reales en pruebas. Ver deploy/README.md antes de publicar. Producción confirmada: https://sembrador.okto.ie, SSH okto-vps, contenedor sembrador-app (loopback 8085), releases en /home/ubuntu/sites/sembrador/releases, current apunta a 20261027-recria-1. Datos fuera de releases: /home/ubuntu/sembrador-private/data. Cron diario 03:17 UTC, sin borrado automático. No mostrar credenciales del túnel ni exportar respaldos sin autorización. El PIN inicial fue entregado fuera del repositorio, en la carpeta privada del propietario.
