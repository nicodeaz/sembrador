# Verificación de El Sembrador · 27/10/2026

## Resultado

Aplicación publicada en https://sembrador.okto.ie con HTTPS, PIN privado y base externa al código. Primera instalación vacía: no se importaron datos ficticios ni se recuperaron datos del servidor anterior.

## Pruebas automatizadas

`npm test`: 9 casos de dominio y 10 casos API (el ejecutor contabiliza además el contenedor de pruebas API). Todos aprobados. `npm run release`: TypeScript y compilación aprobados.

- Stock, elaboración, venta y consumo, sin duplicar gastos.
- Compras a distinto precio; corrección de precio y recálculo de consumos relacionados; rechazo de consumos mayores a la compra o anteriores a ella.
- Cantidad de aves, salidas parciales, cierre, reapertura por corrección y edad de lotes finalizados.
- Fechas previstas y reales del calendario; trabajo completado con fecha real.
- Migración de JSON anterior y rechazo de importaciones inválidas.
- Autenticación, PIN, bloqueo progresivo, revisiones, conflicto entre dispositivos e idempotencia.
- Imágenes privadas: formato comprobado, escritura desde el mismo origen, reintento sin duplicados, conservación después de reiniciar y cambiar la carpeta de código.
- Copias JSON y SQLite; SQLite conserva la biblioteca de imágenes.

## Uso en navegador local con datos ficticios

- Lote de 150 aves, galpón grande 1, llegada 1/10/2026, $50 por ave: $7.500 iniciales. Retiro orientativo a las 16 semanas: 21/1/2027, editable.
- Compra de 4 bolsas de 25 kg por $1.200: 100 kg, $12/kg.
- Consumo de 10 kg vinculado a esa compra: $120; costo del lote $7.620. Datos conservados al recargar.
- Calendario de noviembre en pantalla de 390 × 844: llegada prevista del día 3 y selector por galpón.
- Logo original y logo cargado de prueba: carga confirmada en servidor, preparación para compartir y opción de descarga. No se enviaron archivos a contactos.
- La prueba anterior cubrió salida total, tarea de limpieza, costo real y saldo de ingresos/gastos.

## Verificación en Okto

- `/`: HTTP 200 y título correcto por HTTPS.
- `/api/data.php` y `/api/media.php`: 401 sin autenticación, `Cache-Control: no-store`.
- `/api/config.php` y `/api/lib/auth.php`: 403.
- Inicio de sesión con el PIN inicial y cookie Secure + HttpOnly.
- Guardado del mismo contenido existente: revisión 1. Contenedor recreado con la misma carpeta de datos: revisión 1 conservada y acceso correcto.
- Contenedor saludable; respaldos iniciales generados; cron activo a las 03:17 UTC.
- PIN inicial entregado al propietario fuera del repositorio y del directorio público. No hay PIN de producción en el código.
- Respaldo del 27/10/2026 14:00:52 UTC descargado, con autorización explícita, en `C:/Users/dev/.codex/private/sembrador/respaldo-20261027-140052.tar.gz`. SHA-256 local y remoto coincidentes: `f3394aa3a9511510293d3c9adfb26be9127aafb5d1988b7e991dd5bf961e1e71`. SQLite íntegro, JSON coincidente y hash de acceso presente. No se imprimieron datos privados.

## Pendiente

- Etiqueta de referencia y aviso de revista aportados por el usuario para crear los cuatro flyers y presentar los servicios con datos reales.
- Primera carga de lotes, compras y trabajos reales con el padre; comprobar compartir nativo en su teléfono concreto.
- La descarga local realizada es puntual; no está programada una copia automática fuera del VPS. No hay política de eliminación automática de respaldos.

Las capturas del navegador se inspeccionaron en la sesión; el entorno impidió guardarlas como archivos locales. No se generaron capturas simuladas.
