/** Indicadores e agregações usados em todo o site (sempre sobre os dados TRATADOS). */
import { MESES_DISPONIVEIS } from './clean';
import { mean, median } from './stats';
import type { Row, Status } from './types';
import { MOTIVOS } from './types';

/**
 * Base de cálculo da taxa de evasão:
 *  • "todas"      = evadidos ÷ todas as matrículas
 *  • "encerradas" = evadidos ÷ (concluídos + evadidos)  — ignora quem ainda está em andamento
 */
export type Base = 'todas' | 'encerradas';

export interface Resumo {
  n: number;
  concluidos: number;
  evadidos: number;
  andamento: number;
  taxaConclusao: number;
  taxaEvasao: number;
  taxaAndamento: number;
  taxaEvasaoEnc: number;
  medPct: number;
  medDias: number;
  mediaDias: number;
  medNota: number;
  mediaNota: number;
}

const conta = (rows: Row[], s: Status) => rows.filter((r) => r.status === s).length;

export function resumo(rows: Row[]): Resumo {
  const n = rows.length;
  const concluidos = conta(rows, 'Concluído');
  const evadidos = conta(rows, 'Evadido');
  const andamento = conta(rows, 'Em andamento');
  const notas = rows.filter((r) => r.status === 'Concluído' && r.nota != null).map((r) => r.nota as number);
  return {
    n,
    concluidos,
    evadidos,
    andamento,
    taxaConclusao: n ? concluidos / n : NaN,
    taxaEvasao: n ? evadidos / n : NaN,
    taxaAndamento: n ? andamento / n : NaN,
    taxaEvasaoEnc: concluidos + evadidos ? evadidos / (concluidos + evadidos) : NaN,
    medPct: median(rows.map((r) => r.pct)),
    medDias: median(rows.map((r) => r.dias)),
    mediaDias: mean(rows.map((r) => r.dias)),
    medNota: median(notas),
    mediaNota: mean(notas),
  };
}

export const taxaEvasao = (rows: Row[], base: Base): number => {
  const r = resumo(rows);
  return base === 'todas' ? r.taxaEvasao : r.taxaEvasaoEnc;
};

export interface GrupoLinha {
  nome: string;
  n: number;
  concluidos: number;
  evadidos: number;
  andamento: number;
  taxaEvasao: number;
  taxaEvasaoEnc: number;
  taxaConclusao: number;
  taxa: number; // taxa de evasão conforme a base escolhida
}

export function porGrupo(rows: Row[], chave: (r: Row) => string, ordem: readonly string[], base: Base): GrupoLinha[] {
  return ordem.map((nome) => {
    const sub = rows.filter((r) => chave(r) === nome);
    const s = resumo(sub);
    return {
      nome,
      n: s.n,
      concluidos: s.concluidos,
      evadidos: s.evadidos,
      andamento: s.andamento,
      taxaEvasao: s.taxaEvasao,
      taxaEvasaoEnc: s.taxaEvasaoEnc,
      taxaConclusao: s.taxaConclusao,
      taxa: base === 'todas' ? s.taxaEvasao : s.taxaEvasaoEnc,
    };
  });
}

/* ---------- Faixas de "dias até o primeiro acesso" ---------- */
export const FAIXAS_DIAS = [
  { id: '0', label: '0 dia', min: 0, max: 0 },
  { id: '1', label: '1 dia', min: 1, max: 1 },
  { id: '2-3', label: '2–3 dias', min: 2, max: 3 },
  { id: '4-7', label: '4–7 dias', min: 4, max: 7 },
  { id: '8+', label: '8+ dias', min: 8, max: Infinity },
] as const;

export const faixaDe = (dias: number): string =>
  FAIXAS_DIAS.find((f) => dias >= f.min && dias <= f.max)?.label ?? '';

export const porFaixaDias = (rows: Row[], base: Base): GrupoLinha[] =>
  porGrupo(rows, (r) => faixaDe(r.dias), FAIXAS_DIAS.map((f) => f.label), base);

/* ---------- Motivos de evasão ---------- */
export function motivos(rows: Row[]): { nome: string; n: number; pct: number }[] {
  const ev = rows.filter((r) => r.status === 'Evadido');
  return MOTIVOS.map((m) => {
    const n = ev.filter((r) => r.motivo === m).length;
    return { nome: m, n, pct: ev.length ? n / ev.length : 0 };
  }).sort((a, b) => b.n - a.n);
}

/* ---------- Série mensal (mês da matrícula) ---------- */
export interface Mes {
  mes: string;
  n: number;
  concluidos: number;
  evadidos: number;
  andamento: number;
  taxa: number;
}

export function porMes(rows: Row[], base: Base): Mes[] {
  return MESES_DISPONIVEIS.map((mes) => {
    const sub = rows.filter((r) => r.mes === mes);
    const s = resumo(sub);
    return {
      mes,
      n: s.n,
      concluidos: s.concluidos,
      evadidos: s.evadidos,
      andamento: s.andamento,
      taxa: base === 'todas' ? s.taxaEvasao : s.taxaEvasaoEnc,
    };
  });
}

/* ---------- Status x dispositivo (barras 100% empilhadas) ---------- */
export function statusPor(rows: Row[], chave: (r: Row) => string, ordem: readonly string[]) {
  return ordem.map((nome) => {
    const sub = rows.filter((r) => chave(r) === nome);
    const n = sub.length || 1;
    return {
      nome,
      n: sub.length,
      Concluído: (conta(sub, 'Concluído') / n) * 100,
      'Em andamento': (conta(sub, 'Em andamento') / n) * 100,
      Evadido: (conta(sub, 'Evadido') / n) * 100,
    };
  });
}
