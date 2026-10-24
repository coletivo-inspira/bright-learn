/**
 * LIMPEZA DA BASE — Etapa 4b do trabalho
 *
 * Tudo que é tratado está aqui, em um único lugar, para que o grupo consiga
 * explicar cada decisão. Os dados originais (matriculas.json) nunca são alterados:
 * cada linha tratada guarda o valor original ao lado do valor corrigido.
 */
import raw from '../data/matriculas.json';
import { cercaSuperior, mean, median, mode } from './stats';
import type {
  Categoria,
  Dispositivo,
  Flags,
  Motivo,
  RawRow,
  Row,
  Status,
} from './types';
import { STATUSES } from './types';

export const RAW = raw as RawRow[];

/* ---------------------------------------------------------------------------
 * Problema 1 — Categoria_Curso com grafias diferentes
 * Tratamento: tirar espaços/acentos/maiúsculas e mapear para o rótulo canônico.
 * ------------------------------------------------------------------------- */
const CANON: Record<string, Categoria> = {
  design: 'Design',
  idiomas: 'Idiomas',
  marketing: 'Marketing',
  negocios: 'Negócios',
  tecnologia: 'Tecnologia',
};

export function padronizaCategoria(s: string): Categoria {
  const k = s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  return CANON[k] ?? (s.trim() as Categoria);
}

/* ---------------------------------------------------------------------------
 * Problema 2 — Pct_Concluido > 100 (impossível)
 * Tratamento: trocar pela MEDIANA do Pct_Concluido dos registros válidos
 * (≤ 100) do mesmo Status.
 * ------------------------------------------------------------------------- */
export const PCT_MAX_VALIDO = 100;

const arred1 = (v: number) => Math.round(v * 10) / 10;

export const PCT_MEDIANA_POR_STATUS = Object.fromEntries(
  STATUSES.map((s) => [
    s,
    arred1(
      median(
        RAW.filter((r) => r.Status === s && r.Pct_Concluido <= PCT_MAX_VALIDO).map(
          (r) => r.Pct_Concluido,
        ),
      ),
    ),
  ]),
) as Record<Status, number>;

/* ---------------------------------------------------------------------------
 * Problema 3 — Nota_Final ausente
 *  • aluno NÃO concluído  -> "não se aplica": continua vazio (não é dado faltante)
 *  • aluno Concluído      -> falha de registro: imputa a MEDIANA das notas dos concluídos
 * ------------------------------------------------------------------------- */
export const NOTA_MEDIANA = median(
  RAW.filter((r) => r.Status === 'Concluído' && r.Nota_Final != null).map(
    (r) => r.Nota_Final as number,
  ),
);

/* ---------------------------------------------------------------------------
 * Problema 4 — Outliers em Dias_Ate_Primeiro_Acesso
 * Detecção: cerca de Tukey (Q3 + 1,5·IQR). Tratamento: MANTER (comportamento real).
 * ------------------------------------------------------------------------- */
export const DIAS_CERCA = cercaSuperior(RAW.map((r) => r.Dias_Ate_Primeiro_Acesso));

/* ---------------------------------------------------------------------------
 * Linhas tratadas
 * ------------------------------------------------------------------------- */
export const ROWS: Row[] = RAW.map((r): Row => {
  const categoria = padronizaCategoria(r.Categoria_Curso);
  const status = r.Status as Status;

  const pctInvalido = r.Pct_Concluido > PCT_MAX_VALIDO;
  const pct = pctInvalido ? PCT_MEDIANA_POR_STATUS[status] : r.Pct_Concluido;

  const notaImputada = status === 'Concluído' && r.Nota_Final == null;
  const nota = notaImputada ? NOTA_MEDIANA : r.Nota_Final;

  const flags: Flags = {
    categoria: r.Categoria_Curso !== categoria,
    pct: pctInvalido,
    nota: notaImputada,
    outlierDias: r.Dias_Ate_Primeiro_Acesso > DIAS_CERCA,
    motivoNI: r.Motivo_Evasao === 'Não informado',
  };

  return {
    id: r.ID_Matricula,
    data: r.Data_Matricula,
    mes: r.Data_Matricula.slice(0, 7),
    categoria,
    categoriaOriginal: r.Categoria_Curso,
    dispositivo: r.Dispositivo_Principal as Dispositivo,
    pct,
    pctOriginal: r.Pct_Concluido,
    nota,
    notaOriginal: r.Nota_Final,
    dias: r.Dias_Ate_Primeiro_Acesso,
    status,
    motivo: (r.Motivo_Evasao as Motivo | null) ?? null,
    flags,
  };
});

export const MESES_DISPONIVEIS: string[] = [...new Set(ROWS.map((r) => r.mes))].sort();

/* ---------------------------------------------------------------------------
 * Resumo dos problemas (usado na Entrega 2 e no explorador)
 * ------------------------------------------------------------------------- */
export const PROBLEMAS = {
  categoria: {
    linhas: ROWS.filter((r) => r.flags.categoria).length,
    grafiasAntes: new Set(RAW.map((r) => r.Categoria_Curso)).size,
    grafiasDepois: new Set(ROWS.map((r) => r.categoria)).size,
  },
  pct: {
    linhas: ROWS.filter((r) => r.flags.pct).length,
    valores: [...new Set(RAW.filter((r) => r.Pct_Concluido > PCT_MAX_VALIDO).map((r) => r.Pct_Concluido))],
    mediaAntes: mean(RAW.map((r) => r.Pct_Concluido)),
    mediaDepois: mean(ROWS.map((r) => r.pct)),
    medianaAntes: median(RAW.map((r) => r.Pct_Concluido)),
    medianaDepois: median(ROWS.map((r) => r.pct)),
  },
  nota: {
    vazias: RAW.filter((r) => r.Nota_Final == null).length,
    naoSeAplica: RAW.filter((r) => r.Nota_Final == null && r.Status !== 'Concluído').length,
    falhaRegistro: ROWS.filter((r) => r.flags.nota).length,
    concluidos: RAW.filter((r) => r.Status === 'Concluído').length,
    mediaAntes: mean(RAW.filter((r) => r.Nota_Final != null).map((r) => r.Nota_Final as number)),
    mediaDepois: mean(ROWS.filter((r) => r.status === 'Concluído').map((r) => r.nota as number)),
    mediana: NOTA_MEDIANA,
  },
  dias: {
    linhas: ROWS.filter((r) => r.flags.outlierDias).length,
    cerca: DIAS_CERCA,
    max: Math.max(...RAW.map((r) => r.Dias_Ate_Primeiro_Acesso)),
    media: mean(RAW.map((r) => r.Dias_Ate_Primeiro_Acesso)),
    mediana: median(RAW.map((r) => r.Dias_Ate_Primeiro_Acesso)),
    moda: mode(RAW.map((r) => r.Dias_Ate_Primeiro_Acesso)),
  },
  motivo: {
    naoInformado: ROWS.filter((r) => r.flags.motivoNI).length,
    evadidos: ROWS.filter((r) => r.status === 'Evadido').length,
  },
};

/** Linha com algum tratamento/alerta */
export const temAlerta = (r: Row): boolean => Object.values(r.flags).some(Boolean);
