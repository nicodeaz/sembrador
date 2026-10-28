# Publicación de El Sembrador

Publicado el 27/10/2026 en **https://sembrador.okto.ie**, VPS Okto (alias SSH `okto-vps`). El usuario confirmó Okto como destino.

## Instalación vigente

- Imagen: `sembrador:20261027-movil-3`, PHP 8.4 + Apache; contenedor `sembrador-app`, puerto `127.0.0.1:8085`.
- Código: `/home/ubuntu/sites/sembrador/releases/20261027-movil-3`; enlace `/home/ubuntu/sites/sembrador/current`.
- Datos y hash del PIN: `/home/ubuntu/sembrador-private/data`, montados en `/var/lib/sembrador`.
- Respaldos: `/home/ubuntu/sembrador-private/backups`, montados en `/backups`.
- Entrada pública: Cloudflare Tunnel, regla exclusiva `sembrador.okto.ie -> localhost:8085`. Se conservó una copia de la configuración anterior en el servidor y se validó la nueva. Se usó una réplica temporal para reiniciar el túnel principal.
- Cron `/etc/cron.d/sembrador`: diario a las 03:17 UTC, sin borrado automático. La salida se registra por cron. No se configuró exportación automática fuera del VPS.
- Copia local autorizada y verificada el 27/10/2026: `C:/Users/dev/.codex/private/sembrador/respaldo-20261027-140052.tar.gz`. Incluye SQLite, JSON y hash del PIN. Las huellas SHA-256 del VPS y del archivo descargado coinciden; SQLite pasó `quick_check` y sus registros coinciden con el JSON. Esta descarga es puntual.
- La primera instalación quedó sin datos ficticios. El logo original es parte del código; los archivos cargados por el usuario se guardan en SQLite.

La comprobación de guardado mantuvo el mismo contenido, incrementó a revisión 1, recreó el contenedor y verificó que seguía en revisión 1. El PIN y la lectura autenticada siguieron funcionando. Ver [registro de verificación](VERIFICACION-20261027.md).

## Requisitos

- PHP 8.1 o posterior con PDO SQLite, Fileinfo, JSON y sesiones. En Okto se usa PHP 8.4.
- Apache con `mod_rewrite` y `AllowOverride All`, o reglas equivalentes en el servidor.
- HTTPS antes de entregar la aplicación; certificado válido para el subdominio.
- Directorio privado y persistente fuera de **todas** las carpetas públicas y de versiones, por ejemplo `/var/lib/el-sembrador`.

## Preparar la versión

```powershell
npm run release
npm test
```

`dist/` incluye frontend, PHP y reglas Apache. El empaquetador excluye datos, PINs, respaldos y `config.local.php`. Para un subdominio se compila con `/` (predeterminado). Para una subcarpeta, configurar `VITE_BASE_PATH=/sembrador/` en el entorno del proceso de compilación.

## Primera instalación

1. Crear la carpeta persistente, con propietario del usuario PHP y permisos 0700. Crear otra carpeta privada para respaldos.
2. Subir `dist/` a una carpeta de versión, por ejemplo `/srv/el-sembrador/releases/20261027/`. Apuntar el document root o un enlace `current` a esa carpeta.
3. Configurar `SEMBRADOR_DATA_DIR` en Apache/PHP. Si el hosting no permite variables, crear `api/config.local.php` con `<?php return ['data_dir' => '/ruta/privada/persistente', 'initial_pin' => 'PIN_ELEGIDO'];`. Ese archivo se crea en el servidor, nunca se incluye en Git ni en el paquete. Al cambiar de versión debe conservarse apuntando a la misma carpeta privada.
4. Elegir un PIN privado de seis dígitos y configurar `SEMBRADOR_INITIAL_PIN` para la primera entrada. No existe un PIN de producción predeterminado. Después de iniciar sesión por primera vez, quitar esa variable; el hash del PIN ya queda en la carpeta persistente.
5. Apuntar el registro DNS del subdominio al VPS confirmado, habilitar el sitio y HTTPS. `apache.conf.example` es una plantilla, no un sitio instalado. La configuración exacta depende del panel y servidor reales.
6. Verificar que `/api/data.php` devuelve 401 sin sesión y `Cache-Control: no-store`. Verificar que los archivos privados no tienen URL pública. Las reglas `.htaccess` deben estar activas.

Si PHP está detrás de un proxy TLS, configurar correctamente HTTPS en el servidor antes de habilitar acceso público para que la cookie lleve `Secure`. No confiar indiscriminadamente en cabeceras enviadas por el cliente.

## Conservar datos antiguos

Si se encuentran archivos `batches.json`, `records.json`, `pin.json` y `security.json` del backend anterior, copiarlos **una sola vez** a la carpeta privada antes del primer acceso. La API importa los dos primeros a SQLite sin eliminar los originales. No reemplazar un `farm.sqlite` existente. Los archivos corruptos producen un error, no una granja vacía.

Los datos que solo estaban en localStorage pertenecen al navegador y dominio antiguos. En ese navegador se pueden exportar desde la versión anterior y restaurar en “Respaldos y acceso”. La opción “Buscar datos de la versión anterior” funciona únicamente en el mismo origen; cambiar a un subdominio no permite leer el almacenamiento del dominio anterior.

## Actualizaciones siguientes

1. Generar un respaldo consistente antes del cambio:

```sh
SEMBRADOR_DATA_DIR=/var/lib/el-sembrador php /srv/el-sembrador/current/api/backup.php /var/backups/el-sembrador
```

2. Subir la nueva versión a otra carpeta y comprobar la configuración de PHP.
3. Cambiar el document root/enlace `current`. Mantener la misma `SEMBRADOR_DATA_DIR`.
4. Entrar, comprobar lotes, tareas y movimientos, y verificar un guardado. No copiar una base vacía sobre la existente.
5. Conservar temporalmente la versión anterior para volver atrás si hace falta. Las versiones anteriores al protocolo 3 no deben escribir contra esta API.

## Respaldos

Cada guardado conserva la versión anterior en SQLite (últimas 100 revisiones). Esto ayuda con correcciones, pero no protege ante pérdida del disco. `api/backup.php` genera una copia SQLite y un JSON portable; ejecutarlo diariamente con el programador del servidor y copiar los resultados a otra máquina o almacenamiento privado. El script no elimina respaldos automáticamente. Verificar la restauración de una copia antes de entregar el sistema.

La copia SQLite se genera mediante [VACUUM INTO](https://www.sqlite.org/lang_vacuum.html), que produce una instantánea consistente de la base activa. SQLite incluye también la tabla de imágenes; JSON contiene solo los registros de la granja. El archivo JSON de respaldo no contiene el PIN ni las imágenes. Para recuperar el acceso se conserva `pin.json` por separado en un respaldo privado o se establece un nuevo PIN por el procedimiento de administración.

## Verificación de entrega

- Crear lote activo y futuro; registrar compra, venta, alimento, baja y salida parcial/total.
- Comprobar cantidades, costos, historial y tarea de limpieza.
- Completar una tarea con fecha y costo reales.
- Recargar, cerrar sesión y entrar de nuevo.
- Interrumpir la conexión tras editar: el indicador debe seguir pendiente; al volver, debe confirmar el guardado.
- Abrir dos dispositivos: una edición obsoleta debe mostrar conflicto sin sobrescribir.
- Publicar otra carpeta de versión y comprobar que los mismos datos siguen disponibles.
- Descargar respaldo y restaurarlo primero en una instancia de prueba aislada.

Las pruebas automatizadas realizan migración JSON, reinicio de PHP, cambio de carpeta de versión, idempotencia, conflictos, validación, respaldo y bloqueo por PIN usando directorios temporales; nunca usan `api/data` real.

## Actualizar el contenedor de Okto

Construir la nueva imagen desde una carpeta de versión nueva con `SEMBRADOR_RELEASE` único. Antes del cambio ejecutar `sh /home/ubuntu/sites/sembrador/current/deploy/backup-server.sh`. Usar la misma configuración de volúmenes; nunca recrear ni vaciar las carpetas privadas. Ejecutar `docker compose -f deploy/compose.yaml up -d --wait` desde la nueva versión y actualizar `current` una vez verificada. No repetir `initialize.php` para cambiar el PIN. Conservar la imagen anterior para una reversión del código, sin retroceder los datos.

Referencias de runtime: [imagen oficial PHP](https://github.com/docker-library/php/blob/master/8.4/bookworm/apache/Dockerfile) y [validación de Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/).
