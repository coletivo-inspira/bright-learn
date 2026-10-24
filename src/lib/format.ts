const cache = new Map<number, Intl.NumberFormat>();

function nf(d: number): Intl.NumberFormat {
  let f = cache.get(d);
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
    cache.set(d, f);
  }
  return f;
}

/** 1234.5 -> "1.234,5" (pt-BR). null/NaN -> "—" */
export function fmtN(v: number | null | undefined, d = 0): string {
  if (v == null || Number.isNaN(v)) return '—';
  return nf(d).format(v);
}

/** razão 0.301 -> "30,1%" */
export function fmtPct(r: number | null | undefined, d = 1): string {
  if (r == null || Number.isNaN(r)) return '—';
  return `${nf(d).format(r * 100)}%`;
}

/** valor já em % (ex.: 85.8) -> "85,8%" */
export function fmtPctPonto(v: number | null | undefined, d = 1): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${nf(d).format(v)}%`;
}

/** "2026-04-12" -> "12/04/2026" */
export function fmtData(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2026-04" -> "abr/26" */
export function fmtMes(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MESES[Number(m) - 1]}/${y.slice(2)}`;
}

/** "2026-04" -> "abr/2026" */
export function fmtMesLongo(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MESES[Number(m) - 1]}/${y}`;
}
