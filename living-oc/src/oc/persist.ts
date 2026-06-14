import type { OC } from './oc';

const KEY = 'zealwish.living-oc.v1';

export function serializeOc(oc: OC): string { return JSON.stringify(oc); }
export function deserializeOc(json: string): OC { return JSON.parse(json) as OC; }
export function saveOc(oc: OC) { localStorage.setItem(KEY, serializeOc(oc)); }
export function loadOc(): OC | null {
  const v = localStorage.getItem(KEY);
  return v ? deserializeOc(v) : null;
}
export function exportOcFile(oc: OC) {
  const blob = new Blob([serializeOc(oc)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${oc.name}-${oc.handle.replace('@', '')}.json`; a.click();
  URL.revokeObjectURL(url);
}
