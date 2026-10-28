# Acceso de producción

Versión activa: `20261028-acceso-simple-1`, publicada el 28/10/2026 en https://sembrador.okto.ie. La anterior `20261027-acceso-4` queda disponible para reversión del código.

El modo de producción es `email`; las instrucciones antiguas sobre PIN solo aplican al modo heredado. El correo autorizado es `agroserv.uruguay@gmail.com`. No se requiere PIN para ninguna vista o archivo.

Resend usa la misma cuenta administrativa, con dominio verificado `sembrador.okto.ie` y clave exclusiva `sembrador-production`, limitada a enviar desde ese dominio. Remitente: `El Sembrador <acceso@sembrador.okto.ie>`.

La credencial está fuera de las versiones, en `/home/ubuntu/sembrador-private/data/mail.json`, propietario 33:33 y permisos 600. No debe incorporarse a Git ni a archivos públicos.

Los códigos normalmente duran 10 minutos, son de un solo uso y permiten hasta cinco intentos. El 28/10/2026 a las 14:17 UTC se activó una ayuda puntual: códigos de hasta 60 minutos para el próximo ingreso. La ayuda se consume en la misma transacción que crea la sesión; se invalidan los demás códigos pendientes y los siguientes vuelven a durar 10 minutos. Si nadie entra, la ventana termina el 30/10/2026 a las 14:17 UTC. El estado vive en `access_help` dentro de SQLite y sobrevive a reinicios y despliegues. Repetir `deploy/enable-access-help.php` no reactiva una ayuda consumida o vencida.

La cookie privada dura 400 días y se renueva con el uso. Borrar datos del navegador, cerrar sesión o cambiar de teléfono requiere un código nuevo. Las sesiones sobreviven a despliegues porque se guardan en SQLite persistente. El navegador conserva la solicitud pendiente y su hora de vencimiento al volver del correo o recargar; no almacena el código. El formulario acepta pegar números separados por espacios y distingue código incorrecto, vencido y límite de intentos.

Validación del 28/10: `npm test` y `npm run release` superados. Se probó un ingreso tras 20 minutos, restauración automática del plazo normal, invalidación de códigos pendientes, límite de cinco intentos, reinicio, fin de ventana y persistencia de la pantalla. En navegador local se comprobó recarga, mensaje de código incorrecto e ingreso pegando un código con espacios, sin enviar correos reales. Producción responde 200 en la página y modo email, y 401 en datos e imágenes sin sesión. La huella de los registros y la cantidad de imágenes no cambiaron durante la publicación. Contenedor saludable y respaldos antes y después del cambio. Sigue pendiente el ingreso real del propietario; no se consumió su ayuda en las verificaciones.

Se generó un respaldo antes y después del despliegue. Copia local privada: `C:/Users/dev/.codex/private/sembrador/sembrador-respaldo-20261027-acceso-4.tar.gz`. SQLite incluye las imágenes; la configuración de correo se conserva por separado en la misma carpeta privada local.
