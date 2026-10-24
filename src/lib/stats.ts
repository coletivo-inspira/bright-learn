/** Estatística básica, escrita à mão para o grupo conseguir explicar cada conta. */

export const sum = (a: number[]): number => a.reduce((s, v) => s + v, 0);

export function mean(a: number[]): number {
  return a.length ? sum(a) / a.length : NaN;
}

/** Quantil por interpolação linear (mesmo método do pandas/Excel INC). */
export function quantile(a: number[], q: number): number {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export const median = (a: number[]): number => quantile(a, 0.5);

/** Moda (valor mais frequente). Em empate, devolve o menor. */
export function mode<T extends string | number>(a: T[]): T | null {
  if (!a.length) return null;
  const c = new Map<T, number>();
  for (const v of a) c.set(v, (c.get(v) ?? 0) + 1);
  let best: T | null = null;
  let bestN = 0;
  for (const [v, n] of c) {
    if (n > bestN || (n === bestN && best !== null && v < best)) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

/** Desvio padrão amostral. */
export function stdev(a: number[]): number {
  if (a.length < 2) return NaN;
  const m = mean(a);
  return Math.sqrt(sum(a.map((v) => (v - m) ** 2)) / (a.length - 1));
}

/** Assimetria (skewness de Fisher-Pearson ajustada, igual ao pandas). */
export function skewness(a: number[]): number {
  const n = a.length;
  if (n < 3) return NaN;
  const m = mean(a);
  const s = stdev(a);
  const m3 = sum(a.map((v) => ((v - m) / s) ** 3));
  return (n / ((n - 1) * (n - 2))) * m3;
}

/** Cerca superior de Tukey: Q3 + 1,5 × IQR. */
export function cercaSuperior(a: number[]): number {
  const q1 = quantile(a, 0.25);
  const q3 = quantile(a, 0.75);
  return q3 + 1.5 * (q3 - q1);
}

/** Função de distribuição normal padrão (aproximação de Abramowitz-Stegun). */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Teste z para a diferença entre duas proporções (x1/n1 contra x2/n2).
 * Devolve a diferença, o z e o p-valor bilateral. p < 0,05 = diferença pouco provável de ser só acaso.
 */
export function testeDuasProporcoes(x1: number, n1: number, x2: number, n2: number) {
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pool = (x1 + x2) / (n1 + n2);
  const ep = Math.sqrt(pool * (1 - pool) * (1 / n1 + 1 / n2));
  const z = (p1 - p2) / ep;
  return { p1, p2, dif: p1 - p2, z, p: 2 * (1 - normalCdf(Math.abs(z))) };
}

/** Conta ocorrências e devolve ordenado do maior para o menor. */
export function contar<T extends string>(a: T[]): { nome: T; n: number }[] {
  const c = new Map<T, number>();
  for (const v of a) c.set(v, (c.get(v) ?? 0) + 1);
  return [...c.entries()].map(([nome, n]) => ({ nome, n })).sort((x, y) => y.n - x.n);
}
