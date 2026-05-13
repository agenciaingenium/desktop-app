const ALLOWED_PROTOCOLS = ['https:', 'http:', 'mailto:'];

export function openExternal(url: string): Promise<void> {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      console.warn(`[shell] Blocked openExternal for disallowed protocol: ${parsed.protocol}`);
      return Promise.resolve();
    }
    return window.station.shell.openExternal(url);
  } catch (e) {
    console.warn('[shell] Blocked openExternal for invalid URL:', url, e);
    return Promise.resolve();
  }
}