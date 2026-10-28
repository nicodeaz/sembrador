// Capa de caché local de El Sembrador.
//
// El servidor (api/*.php) es la fuente de verdad de lotes y registros; esto
// acá es solo una copia local para que la app siga funcionando si se corta
// la conexión a mitad de una sesión ya desbloqueada (ver App.tsx). El PIN ya
// no vive acá: se verifica y guarda del lado del servidor.
//
// 1) Las claves están versionadas/namespaced (`sembrador:v1:*`) para que una
//    futura migración de esquema no choque con datos viejos sin querer.
// 2) Lotes y registros tienen un respaldo espejo que se usa para
//    auto-recuperación si la copia local se corrompe o el JSON.parse falla.
// 3) Los datos ya guardados bajo las claves antiguas (sin prefijo) se migran
//    una sola vez a las nuevas claves versionadas.
// 4) Los errores de localStorage (modo privado, cuota excedida, etc.) no
//    rompen la app: se degradan en silencio en vez de tirar una excepción.

const NS = 'sembrador:v1:';

const LEGACY_KEY_MAP: Record<string, string> = {
  [`${NS}batches`]: 'sembrador_batches',
  [`${NS}records`]: 'sembrador_records',
  [`${NS}darkmode`]: 'sembrador_darkmode',
};

function backupKey(key: string): string {
  return `${key}:backup`;
}

function isStorageAvailable(): boolean {
  try {
    const testKey = `${NS}__test__`;
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const storageAvailable = isStorageAvailable();

/** Migra una clave legacy sin prefijo a su clave versionada, una sola vez. */
function migrateLegacyKey(key: string): void {
  if (!storageAvailable) return;
  const legacyKey = LEGACY_KEY_MAP[key];
  if (!legacyKey) return;

  try {
    const alreadyMigrated = window.localStorage.getItem(key);
    if (alreadyMigrated !== null) return;

    const legacyValue = window.localStorage.getItem(legacyKey);
    if (legacyValue !== null) {
      window.localStorage.setItem(key, legacyValue);
    }
  } catch {
    // Si falla la migración simplemente seguimos con los defaults.
  }
}

/** Lee y parsea JSON desde una clave versionada, con recuperación desde respaldo. */
export function readJSON<T>(key: string, fallback: T): T {
  if (!storageAvailable) return fallback;
  migrateLegacyKey(key);

  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // Copia principal corrupta: intentamos recuperar del respaldo abajo.
  }

  try {
    const rawBackup = window.localStorage.getItem(backupKey(key));
    if (rawBackup !== null) {
      return JSON.parse(rawBackup) as T;
    }
  } catch {
    // Ni el respaldo sirve, usamos el valor por defecto.
  }

  return fallback;
}

/** Lee un string plano (no JSON) desde una clave versionada. */
export function readString(key: string, fallback: string): string {
  if (!storageAvailable) return fallback;
  migrateLegacyKey(key);

  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? raw : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Guarda JSON en una clave versionada y actualiza su respaldo espejo.
 * Nunca lanza: si localStorage falla (privado, cuota, etc.) el cambio
 * solo vive en memoria durante la sesión en vez de romper la app.
 */
export function writeJSON<T>(key: string, value: T, keepBackup = false): void {
  if (!storageAvailable) return;
  try {
    const serialized = JSON.stringify(value);
    if (keepBackup) {
      const previous = window.localStorage.getItem(key);
      if (previous !== null) {
        window.localStorage.setItem(backupKey(key), previous);
      }
    }
    window.localStorage.setItem(key, serialized);
  } catch {
    // Se degrada en silencio (ver comentario arriba).
  }
}

/** Guarda un string plano en una clave versionada. */
export function writeString(key: string, value: string): void {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Se degrada en silencio.
  }
}

export const STORAGE_KEYS = {
  batches: `${NS}batches`,
  records: `${NS}records`,
  darkMode: `${NS}darkmode`,
} as const;
