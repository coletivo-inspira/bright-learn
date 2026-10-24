/** Cores dos gráficos (variáveis CSS, mudam junto com o tema claro/escuro). */
export const COR = {
  brand: 'var(--brand)',
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  info: 'var(--info)',
  bad: 'var(--bad)',
  neutro: 'var(--line)',
  muted: 'var(--muted)',
};

export const COR_STATUS: Record<string, string> = {
  Concluído: COR.ok,
  'Em andamento': COR.info,
  Evadido: COR.bad,
};

/** Paleta categórica (motivos de evasão etc.) */
export const PALETA = ['#4f46e5', '#f59e0b', '#0ea5e9', '#e11d48', '#10b981', '#8b5cf6'];
