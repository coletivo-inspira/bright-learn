/**
 * "Pergunta → gráfico" de cada visualização (Etapa 4d).
 * Usado no Dashboard e na tabela de justificativas da Entrega 4.
 */
export const SPEC = {
  categoria: {
    titulo: 'Taxa de evasão por categoria',
    pergunta: 'Em qual categoria de curso a evasão é maior?',
    tipo: 'Barras horizontais',
    porque:
      'Compara uma mesma medida entre poucas categorias nominais. Barras partem do zero e ficam alinhadas, então o olho compara o comprimento; ordenar do maior para o menor mostra o ranking de imediato.',
  },
  dias: {
    titulo: 'Evasão por tempo até o 1º acesso',
    pergunta: 'Quem demora mais para começar a estudar evade mais?',
    tipo: 'Colunas',
    porque:
      'Relaciona uma variável numérica agrupada em faixas ordenadas (0, 1, 2–3, 4–7, 8+ dias) com uma taxa. Colunas lado a lado deixam ver em que faixa a taxa "salta".',
  },
  motivos: {
    titulo: 'Motivos de evasão',
    pergunta: 'Qual a participação de cada motivo entre os evadidos?',
    tipo: 'Rosca',
    porque: 'Mostra parte de um todo com poucas fatias (5 motivos). Cada fatia é a fração dos evadidos que citou aquele motivo.',
  },
  mes: {
    titulo: 'Matrículas e evasão ao longo do tempo',
    pergunta: 'O volume de matrículas e a evasão mudaram mês a mês?',
    tipo: 'Barras + linha',
    porque:
      'Evolução no tempo pede linha (a taxa). As barras ao fundo mostram o volume de matrículas, ou seja, o tamanho da amostra que sustenta cada ponto.',
  },
  dispositivo: {
    titulo: 'Desfecho por dispositivo',
    pergunta: 'O desfecho (concluído, em andamento, evadido) muda conforme o dispositivo de estudo?',
    tipo: 'Barras empilhadas 100%',
    porque:
      'Compara a composição entre grupos de tamanhos muito diferentes (celular tem ~4× mais matrículas que tablet). Normalizar para 100% evita que o tamanho do grupo distorça a leitura.',
  },
} as const;
