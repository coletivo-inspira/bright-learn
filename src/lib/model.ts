/**
 * ANÁLISE PREDITIVA — regressão logística simples (explicável).
 *
 * Alvo: Evadido (1) × Concluído (0). Quem está "Em andamento" ainda não tem desfecho,
 * então fica fora do treino e é justamente quem recebe a previsão.
 *
 * Variáveis (todas fáceis de explicar a quem não é de dados):
 *   • demorou 8+ dias para o 1º acesso (sim/não)
 *   • categoria do curso (Marketing é a referência)
 *   • usa celular como dispositivo principal (sim/não)
 *
 * Validação: validação cruzada em 5 partes (a linha i vai para a parte i % 5, com as
 * matrículas ordenadas por ID) — sempre dá o mesmo resultado, sem sorteio.
 */
import { ROWS } from './clean';
import type { Categoria, Dispositivo, Row } from './types';

export const LIMIAR_DIAS = 8;
const CATS_DUMMY: Categoria[] = ['Idiomas', 'Design', 'Negócios', 'Tecnologia'];

export const NOMES_COEF = [
  'Intercepto',
  `Demorou ${LIMIAR_DIAS}+ dias p/ 1º acesso`,
  'Idiomas (vs. Marketing)',
  'Design (vs. Marketing)',
  'Negócios (vs. Marketing)',
  'Tecnologia (vs. Marketing)',
  'Celular (vs. computador/tablet)',
];

export interface Entrada {
  categoria: Categoria;
  dispositivo: Dispositivo;
  dias: number;
}

function vetor(e: Entrada): number[] {
  return [
    1,
    e.dias >= LIMIAR_DIAS ? 1 : 0,
    ...CATS_DUMMY.map((c) => (e.categoria === c ? 1 : 0)),
    e.dispositivo === 'Celular' ? 1 : 0,
  ];
}

const sigmoide = (z: number) => 1 / (1 + Math.exp(-z));
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

/** Resolve A·x = b por eliminação de Gauss com pivotamento parcial. */
function resolve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((l, i) => [...l, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/** Newton-Raphson (IRLS) com pequena regularização L2 para estabilidade. */
function ajusta(X: number[][], y: number[], l2 = 1e-3, iter = 30): number[] {
  const p = X[0].length;
  let beta = new Array<number>(p).fill(0);
  for (let it = 0; it < iter; it++) {
    const prob = X.map((x) => sigmoide(dot(x, beta)));
    const H: number[][] = Array.from({ length: p }, (_, i) =>
      Array.from({ length: p }, (_, j) => (i === j ? l2 : 0)),
    );
    const g = beta.map((b) => -l2 * b);
    X.forEach((x, k) => {
      const w = prob[k] * (1 - prob[k]);
      for (let i = 0; i < p; i++) {
        g[i] += x[i] * (y[k] - prob[k]);
        for (let j = 0; j < p; j++) H[i][j] += w * x[i] * x[j];
      }
    });
    const passo = resolve(H, g);
    beta = beta.map((b, i) => b + passo[i]);
  }
  return beta;
}

/** AUC (probabilidade de um evadido receber risco maior que um concluído), empates = 0,5. */
export function auc(y: number[], p: number[]): number {
  let ganhos = 0;
  let pares = 0;
  for (let i = 0; i < y.length; i++) {
    if (y[i] !== 1) continue;
    for (let j = 0; j < y.length; j++) {
      if (y[j] !== 0) continue;
      pares++;
      if (p[i] > p[j]) ganhos += 1;
      else if (p[i] === p[j]) ganhos += 0.5;
    }
  }
  return pares ? ganhos / pares : NaN;
}

const entradaDe = (r: Row): Entrada => ({ categoria: r.categoria, dispositivo: r.dispositivo, dias: r.dias });

/* ---------- Treino ---------- */
const treino = ROWS.filter((r) => r.status !== 'Em andamento').sort((a, b) => (a.id < b.id ? -1 : 1));
const X = treino.map((r) => vetor(entradaDe(r)));
const y: number[] = treino.map((r) => (r.status === 'Evadido' ? 1 : 0));

const COEF = ajusta(X, y);

/** Probabilidade prevista de evasão (0–1). */
export const prever = (e: Entrada): number => sigmoide(dot(vetor(e), COEF));

/* ---------- Validação cruzada (5 partes) ---------- */
const pCV = new Array<number>(treino.length).fill(0);
for (let f = 0; f < 5; f++) {
  const tr = treino.map((_, i) => i).filter((i) => i % 5 !== f);
  const te = treino.map((_, i) => i).filter((i) => i % 5 === f);
  const b = ajusta(
    tr.map((i) => X[i]),
    tr.map((i) => y[i]),
  );
  for (const i of te) pCV[i] = sigmoide(dot(X[i], b));
}

/** Calibração: divide as previsões (da validação cruzada) em 3 faixas de risco. */
function calibracao() {
  const ordem = pCV.map((p, i) => ({ p, y: y[i] })).sort((a, b) => a.p - b.p);
  const k = Math.ceil(ordem.length / 3);
  return ['Risco baixo', 'Risco médio', 'Risco alto'].map((nome, g) => {
    const fatia = ordem.slice(g * k, (g + 1) * k);
    return {
      nome,
      n: fatia.length,
      previsto: fatia.reduce((s, v) => s + v.p, 0) / fatia.length,
      observado: fatia.reduce((s, v) => s + v.y, 0) / fatia.length,
    };
  });
}

export const MODELO = {
  nomes: NOMES_COEF,
  coef: COEF,
  nTreino: treino.length,
  base: y.reduce((s, v) => s + v, 0) / y.length, // taxa de evasão entre encerradas
  auc: auc(y, pCV),
  acuracia: pCV.reduce((s, p, i) => s + ((p >= 0.5 ? 1 : 0) === y[i] ? 1 : 0), 0) / pCV.length,
  calibracao: calibracao(),
};

/* ---------- Pontuação de quem ainda está em andamento ---------- */
export interface Pontuada {
  row: Row;
  risco: number;
}

export const EM_ANDAMENTO: Pontuada[] = ROWS.filter((r) => r.status === 'Em andamento')
  .map((row) => ({ row, risco: prever(entradaDe(row)) }))
  .sort((a, b) => b.risco - a.risco);

/** Quantas das matrículas em andamento devem evadir, em média, segundo o modelo. */
export const EVASOES_ESPERADAS = EM_ANDAMENTO.reduce((s, v) => s + v.risco, 0);
