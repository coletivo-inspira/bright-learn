/**
 * Números-chave das análises diagnóstica e prescritiva.
 * Ficam num lugar só para que Entrega 3, Entrega 5 e a página final nunca divirjam.
 */
import { ROWS } from './clean';
import { resumo } from './analytics';
import { LIMIAR_DIAS } from './model';
import { testeDuasProporcoes } from './stats';
import type { Row } from './types';

const evadidos = (rows: Row[]) => rows.filter((r) => r.status === 'Evadido').length;
const taxa = (rows: Row[]) => evadidos(rows) / rows.length;

const geral = resumo(ROWS);

/**
 * DENOMINADOR: quem está "Em andamento" ainda não concluiu nem evadiu, então as taxas
 * de evasão das comparações usam só as matrículas ENCERRADAS (concluídos + evadidos).
 */
const encerradas = ROWS.filter((r) => r.status !== 'Em andamento');

/* ---------- grupos de comparação (só encerradas) ---------- */
const tarde = encerradas.filter((r) => r.dias >= LIMIAR_DIAS);
const cedo = encerradas.filter((r) => r.dias < LIMIAR_DIAS);
const idiomas = encerradas.filter((r) => r.categoria === 'Idiomas');
const outrasCategorias = encerradas.filter((r) => r.categoria !== 'Idiomas');
const celular = encerradas.filter((r) => r.dispositivo === 'Celular');
const outrosDispositivos = encerradas.filter((r) => r.dispositivo !== 'Celular');

const motivosInformados = ROWS.filter((r) => r.status === 'Evadido' && r.motivo && r.motivo !== 'Não informado');
const faltaDeTempo = motivosInformados.filter((r) => r.motivo === 'Falta de tempo');
const idiomasInformados = motivosInformados.filter((r) => r.categoria === 'Idiomas');
const idiomasFaltaDeTempo = idiomasInformados.filter((r) => r.motivo === 'Falta de tempo');

export const DIAG = {
  geral,
  enc: { n: encerradas.length, evadidos: evadidos(encerradas), taxa: taxa(encerradas) },
  tarde: { n: tarde.length, evadidos: evadidos(tarde), taxa: taxa(tarde) },
  cedo: { n: cedo.length, evadidos: evadidos(cedo), taxa: taxa(cedo) },
  idiomas: { n: idiomas.length, evadidos: evadidos(idiomas), taxa: taxa(idiomas) },
  outrasCategorias: { n: outrasCategorias.length, evadidos: evadidos(outrasCategorias), taxa: taxa(outrasCategorias) },
  celular: { n: celular.length, evadidos: evadidos(celular), taxa: taxa(celular) },
  outrosDispositivos: { n: outrosDispositivos.length, evadidos: evadidos(outrosDispositivos), taxa: taxa(outrosDispositivos) },
  motivos: {
    informados: motivosInformados.length,
    faltaDeTempo: faltaDeTempo.length,
    idiomasInformados: idiomasInformados.length,
    idiomasFaltaDeTempo: idiomasFaltaDeTempo.length,
  },
  teste: {
    tempo: testeDuasProporcoes(evadidos(tarde), tarde.length, evadidos(cedo), cedo.length),
    idiomas: testeDuasProporcoes(evadidos(idiomas), idiomas.length, evadidos(outrasCategorias), outrasCategorias.length),
    celular: testeDuasProporcoes(evadidos(celular), celular.length, evadidos(outrosDispositivos), outrosDispositivos.length),
  },
};

/* ---------- alavancas (análise prescritiva) ---------- */
export interface Alavanca {
  id: 'onboarding' | 'idiomas' | 'mobile';
  nome: string;
  acao: string;
  alvo: string;
  referencia: string;
  n: number;
  taxaAtual: number;
  taxaMeta: number;
  esforco: 'Baixo' | 'Médio' | 'Alto';
  evidencia: string;
  p: number;
}

export const ALAVANCAS: Alavanca[] = [
  {
    id: 'onboarding',
    nome: 'Onboarding ativo',
    acao: 'Para toda matrícula nova que não acessou até o 3º dia: e-mail + push/WhatsApp com link direto da 1ª aula e meta de 15 min; repetir no 5º dia.',
    alvo: `Quem leva ${LIMIAR_DIAS}+ dias para o 1º acesso`,
    referencia: `quem acessa em menos de ${LIMIAR_DIAS} dias`,
    n: DIAG.tarde.n,
    taxaAtual: DIAG.tarde.taxa,
    taxaMeta: DIAG.cedo.taxa,
    esforco: 'Baixo',
    evidencia: 'Forte',
    p: DIAG.teste.tempo.p,
  },
  {
    id: 'idiomas',
    nome: 'Trilha flexível em Idiomas',
    acao: 'Na matrícula, perguntar o tempo livre por semana e montar plano de 2 a 3 sessões curtas com lembretes.',
    alvo: 'Cursos de Idiomas',
    referencia: 'as demais categorias',
    n: DIAG.idiomas.n,
    taxaAtual: DIAG.idiomas.taxa,
    taxaMeta: DIAG.outrasCategorias.taxa,
    esforco: 'Médio',
    evidencia: 'Forte',
    p: DIAG.teste.idiomas.p,
  },
  {
    id: 'mobile',
    nome: 'Experiência mobile',
    acao: 'Revisar o fluxo no celular: retomar de onde parou e baixar aulas para ver offline.',
    alvo: 'Quem estuda principalmente pelo celular',
    referencia: 'quem usa computador ou tablet',
    n: DIAG.celular.n,
    taxaAtual: DIAG.celular.taxa,
    taxaMeta: DIAG.outrosDispositivos.taxa,
    esforco: 'Alto',
    evidencia: 'Moderada',
    p: DIAG.teste.celular.p,
  },
];

/**
 * Evasões evitadas se a ação fechar `efetividade` (0–1) da distância entre a taxa atual
 * do grupo-alvo e a taxa do grupo de referência.
 */
export const evasoesEvitadas = (a: Alavanca, efetividade: number): number =>
  a.n * Math.max(0, a.taxaAtual - a.taxaMeta) * efetividade;

/** Nova taxa de evasão (entre encerradas) se só essa alavanca fosse aplicada. */
export const novaTaxaGeral = (a: Alavanca, efetividade: number): number =>
  (DIAG.enc.evadidos - evasoesEvitadas(a, efetividade)) / DIAG.enc.n;

export const fmtP = (p: number): string => (p < 0.001 ? 'p < 0,001' : `p = ${p.toFixed(3).replace('.', ',')}`);
