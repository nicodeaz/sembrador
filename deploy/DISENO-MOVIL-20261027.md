# Diseño móvil y biblioteca interna

- Identidad verde y naranja con el logo original de animales; texto blanco en navegación, filtros y día seleccionado.
- Resumen general con todos los lotes, alimento, stock, cuentas, llegadas, salidas e historial; diferencia explícita entre costos reales y previstos.
- Navegación móvil en una fila: Resumen, Lotes, Raciones, Calendario y Más. Más contiene Cuentas, Archivos y Respaldos. Las cuentas también tienen acceso desde el resumen.
- Fichas de lotes y consumo semanal en celular, sin tablas horizontales. Controles táctiles grandes, teclado numérico y acciones de formularios accesibles.
- Biblioteca interna con vista ampliada y descarga, sin controles para compartir. Imágenes cargadas en SQLite privado; no se incluyen en assets públicos.
- Cinco flyers de raciones de 25 kg: ovina peletizada, ración para ovejas, ponedoras, recría y BB. Las dos ovejas son cara mora. Se conserva el logo original.
- Aviso de servicios mejorado a color, aviso original de revista y referencia original de ovejas conservados en la biblioteca. Contacto del aviso: Julio Santiago Díaz, 095 737 818.
- Archivos finales locales en `.private/flyers`, excluidos de Git y con acceso HTTP denegado por `.private/.htaccess`. Generados con la herramienta integrada image_gen; instrucciones de generación en esa carpeta.
- Importación idempotente mediante la API autenticada; se verifica SHA-256 de cada imagen y respuesta 401 sin sesión. No cambia registros ni revisión de la granja.
- Compilación TypeScript y release correctas. Pruebas de dominio/API de la revisión de diseño: 9 pruebas de dominio y 10 casos API, todos correctos.

La publicación conserva volúmenes de datos/PIN y genera un respaldo antes de actualizar. No se envió material a contactos ni se habilitó una biblioteca pública.
