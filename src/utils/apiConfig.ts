/**
 * Centralized API configuration for Pantry Guard
 * Automatically handles routing between Web (relative path) and Capacitor/APK (live cloud backend)
 */

export const DEFAULT_BACKEND_URL = 'https://pantryguard-0xux.onrender.com';

export function getCustomBackendUrl(): string | null {
  try {
    return localStorage.getItem('pantry_custom_backend_url') || null;
  } catch {
    return null;
  }
}

export function setCustomBackendUrl(url: string | null) {
  try {
    if (url && url.trim()) {
      localStorage.setItem('pantry_custom_backend_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('pantry_custom_backend_url');
    }
  } catch {}
}

export function getApiBaseUrl(): string {
  // 1. User manual override (if set)
  const custom = getCustomBackendUrl();
  if (custom) return custom;

  // 2. Running in native Capacitor app or localhost APK
  const isCapacitor =
    typeof window !== 'undefined' &&
    ((window as any).Capacitor !== undefined ||
      window.location.protocol.startsWith('capacitor') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  if (isCapacitor) {
    // In Android APK, localhost has no server. Connect to Render backend.
    return DEFAULT_BACKEND_URL;
  }

  // 3. Running in Web browser on Render or custom domain -> relative paths work directly
  return '';
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export async function testBackendConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    const res = await fetch(apiUrl('/api/health'), { signal: controller.signal });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { ok: true, message: `Conexión exitosa con el servidor en la nube (${latencyMs}ms)`, latencyMs };
    }
    return { ok: false, message: `El servidor respondió con código ${res.status}`, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      message: 'El servidor en Render puede estar suspendido por inactividad. El motor inteligente local está 100% activo en tu dispositivo.',
      latencyMs,
    };
  }
}
