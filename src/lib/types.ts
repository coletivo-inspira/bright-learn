export const STATUSES = ['Concluído', 'Em andamento', 'Evadido'] as const;
export type Status = (typeof STATUSES)[number];

export const CATEGORIAS = ['Design', 'Idiomas', 'Marketing', 'Negócios', 'Tecnologia'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const DISPOSITIVOS = ['Celular', 'Computador', 'Tablet'] as const;
export type Dispositivo = (typeof DISPOSITIVOS)[number];

export const MOTIVOS = [
  'Falta de tempo',
  'Conteúdo muito difícil',
  'Conteúdo pouco relevante',
  'Problema técnico',
  'Não informado',
] as const;
export type Motivo = (typeof MOTIVOS)[number];

/** Linha exatamente como veio do Excel (sem nenhum tratamento). */
export interface RawRow {
  ID_Matricula: string;
  Data_Matricula: string;
  Categoria_Curso: string;
  Dispositivo_Principal: string;
  Pct_Concluido: number;
  Nota_Final: number | null;
  Dias_Ate_Primeiro_Acesso: number;
  Status: string;
  Motivo_Evasao: string | null;
}

/** O que foi detectado/tratado em cada linha. */
export interface Flags {
  /** grafia da categoria foi padronizada */
  categoria: boolean;
  /** Pct_Concluido > 100 foi substituído pela mediana do status */
  pct: boolean;
  /** Nota_Final ausente em aluno Concluído foi imputada (mediana) */
  nota: boolean;
  /** Dias até o 1º acesso acima da cerca de Tukey (mantido, é dado real) */
  outlierDias: boolean;
  /** Motivo_Evasao = "Não informado" (mantido como categoria própria) */
  motivoNI: boolean;
}

export type AlertaKey = keyof Flags;

/** Linha já tratada, guardando também os valores originais. */
export interface Row {
  id: string;
  data: string; // ISO yyyy-mm-dd
  mes: string; // yyyy-mm
  categoria: Categoria;
  categoriaOriginal: string;
  dispositivo: Dispositivo;
  pct: number;
  pctOriginal: number;
  nota: number | null;
  notaOriginal: number | null;
  dias: number;
  status: Status;
  motivo: Motivo | null;
  flags: Flags;
}
