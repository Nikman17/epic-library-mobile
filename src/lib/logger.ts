import { storage } from '#imports';

// Persisted flag: logs are optional, enabled by default.
export const logsEnabledItem = storage.defineItem<boolean>('local:logsEnabled', { fallback: true });

type Listener = (lines: string[]) => void;

const MAX_LINES = 400;
let lines: string[] = [];
let enabled = true;
const listeners = new Set<Listener>();

logsEnabledItem.getValue().then((v) => { enabled = v; });
logsEnabledItem.watch((v) => { enabled = v ?? true; });

function notify() {
  const snapshot = [...lines];
  listeners.forEach((l) => l(snapshot));
}

export function log(msg: string) {
  if (!enabled) return;
  const d = new Date();
  const ts = d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  lines.push(`[${ts}] ${msg}`);
  console.log('[EGL] ' + msg); // also visible via adb logcat (GeckoConsole)
  if (lines.length > MAX_LINES) lines = lines.slice(-MAX_LINES);
  notify();
}

export function getLogLines(): string[] {
  return [...lines];
}

export function clearLogs() {
  lines = [];
  notify();
}

export function subscribeLogs(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export async function setLogsEnabled(v: boolean) {
  enabled = v;
  await logsEnabledItem.setValue(v);
}
