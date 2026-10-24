/** Cronograma de referência do enunciado (seção 6). Datas em ISO. */
export type EntregaId = '1' | '2' | '3' | '4' | '5' | 'final';

export interface Entrega {
  id: EntregaId;
  rotulo: string; // "Entrega 1"
  data: string; // ISO
  titulo: string;
  etapa: string; // etapa(s) do enunciado
  pontos: number | null;
  trazer: string[]; // o que o professor espera ver
}

export const ENTREGAS: Entrega[] = [
  {
    id: '1',
    rotulo: 'Entrega 1',
    data: '2026-10-21',
    titulo: 'Grupo, base e pergunta de negócio',
    etapa: 'Etapa (a) · Contexto e pergunta de negócio',
    pontos: 1,
    trazer: [
      'Grupo formado e registrado (4 a 6 integrantes)',
      'Base de dados escolhida: BrightLearn',
      'Pergunta de negócio (rascunho)',
    ],
  },
  {
    id: '2',
    rotulo: 'Entrega 2',
    data: '2026-10-28',
    titulo: 'Base validada e limpeza (antes/depois)',
    etapa: 'Etapa (b) · Preparo e limpeza dos dados',
    pontos: 1,
    trazer: [
      'Base validada (conferida contra o enunciado e o dicionário)',
      'Problemas de limpeza identificados e diagnosticados',
      'Comparação antes/depois de cada tratamento, com média, mediana ou moda justificada',
    ],
  },
  {
    id: '3',
    rotulo: 'Entrega 3',
    data: '2026-11-04',
    titulo: 'As 4 perguntas de análise',
    etapa: 'Etapa (c) · Descritiva, diagnóstica, preditiva e prescritiva',
    pontos: 1,
    trazer: [
      'Rascunho das 4 perguntas — uma por tipo de análise',
      'Para cada pergunta, a ação/decisão que ela permite',
    ],
  },
  {
    id: '4',
    rotulo: 'Entrega 4',
    data: '2026-11-11',
    titulo: 'Gráficos esboçados e justificados',
    etapa: 'Etapa (d) · Dashboard (esboço)',
    pontos: 1,
    trazer: [
      'Pelo menos 3 gráficos esboçados para o dashboard',
      'Tipo de gráfico justificado pela tabela "pergunta → gráfico"',
      '1 KPI em destaque definido',
    ],
  },
  {
    id: '5',
    rotulo: 'Entrega 5',
    data: '2026-11-25',
    titulo: 'Documento v1 e ensaio da apresentação',
    etapa: 'Etapas (d) e (e) · Dashboard final e recomendação',
    pontos: 1,
    trazer: [
      'Primeira versão completa do documento escrito',
      'Ensaio cronometrado da apresentação',
      'Dashboard funcional e recomendação final',
    ],
  },
  {
    id: 'final',
    rotulo: 'Final',
    data: '2026-12-09',
    titulo: 'Apresentação e documento (PDF)',
    etapa: 'Entrega do trabalho · 15 pts escrito + 10 pts apresentação',
    pontos: null,
    trazer: [
      'Documento escrito em PDF (até 6 páginas, sem capa e referências)',
      'Apresentação de 5 a 15 minutos com todos os integrantes',
      'Registro do uso de IA no documento',
    ],
  },
];

/** Datas de orientação (sem checkpoint pontuado) */
export const ORIENTACOES = [
  { data: '2026-11-18', texto: 'Dashboard funcional · recomendação final (rascunho) — orientação, sem pontuação' },
  { data: '2026-12-02', texto: 'Revisão final, ajustes e último ensaio cronometrado (5 a 15 min) — orientação, sem pontuação' },
];

export type Situacao = 'passou' | 'hoje' | 'proxima' | 'futura';

const diaMs = 86_400_000;
const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Dias de hoje até a data (negativo = já passou). */
export function diasAte(dataIso: string, hoje = new Date()): number {
  const [y, m, d] = dataIso.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - inicioDoDia(hoje)) / diaMs);
}

export function situacoes(hoje = new Date()): Record<EntregaId, Situacao> {
  const out = {} as Record<EntregaId, Situacao>;
  let achouProxima = false;
  for (const e of ENTREGAS) {
    const d = diasAte(e.data, hoje);
    if (d < 0) out[e.id] = 'passou';
    else if (d === 0) {
      out[e.id] = 'hoje';
      achouProxima = true;
    } else if (!achouProxima) {
      out[e.id] = 'proxima';
      achouProxima = true;
    } else out[e.id] = 'futura';
  }
  return out;
}

export function textoPrazo(dataIso: string, hoje = new Date()): string {
  const d = diasAte(dataIso, hoje);
  if (d === 0) return 'é hoje';
  if (d === 1) return 'amanhã';
  if (d === -1) return 'foi ontem';
  if (d > 0) return `em ${d} dias`;
  return `há ${-d} dias`;
}
