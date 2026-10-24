import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { ExternalLink, FileText, MessageCircleQuestion, Mic2, Send } from 'lucide-react';
import { Callout, Card, SectionTitle, Tabela, td, th } from '../../components/ui';
import { GRUPO } from '../../data/grupo';
import { NOTA_MEDIANA, PCT_MEDIANA_POR_STATUS, PROBLEMAS as P } from '../../lib/clean';
import { ALAVANCAS, DIAG, evasoesEvitadas, fmtP } from '../../lib/insights';
import { fmtN, fmtPct } from '../../lib/format';
import { EM_ANDAMENTO, EVASOES_ESPERADAS, LIMIAR_DIAS, MODELO } from '../../lib/model';
import { href } from '../../lib/router';

const CRITERIOS: { bloco: string; itens: [string, number, string][] }[] = [
  {
    bloco: 'Trabalho escrito · 15 pts',
    itens: [
      ['Contexto, base de dados e preparo (limpeza, média/mediana/moda justificada)', 3, 'Entregas 1 e 2'],
      ['As 4 perguntas de análise, cada uma com ação/decisão coerente com o tipo', 5, 'Entrega 3'],
      ['Dashboard e visualizações: coerência pergunta × gráfico, KPI bem escolhido', 4, 'Entrega 4 e Dashboard'],
      ['Recomendação final, limitações reconhecidas e referências', 3, 'Entrega 5'],
    ],
  },
  {
    bloco: 'Apresentação · 10 pts',
    itens: [
      ['Clareza do problema e da pergunta de negócio', 2, 'Entrega 1'],
      ['Leitura e demonstração do dashboard/evidências', 3, 'Dashboard'],
      ['Recomendação final fundamentada nos dados mostrados', 3, 'Entrega 5'],
      ['Domínio do grupo (todos participam) e tempo respeitado (5 a 15 min)', 2, 'Cronômetro (Entrega 5)'],
    ],
  },
  { bloco: 'Etapas semanais · 5 pts', itens: [['Soma dos 5 checkpoints do cronograma (1,0 pt cada)', 5, 'Entregas 1 a 5']] },
];

function Pergunta({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-line bg-surface p-4 open:bg-surface-2/50">
      <summary className="flex cursor-pointer list-none items-start gap-2 font-semibold">
        <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        <span className="flex-1">{q}</span>
        <span className="text-muted transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="mt-3 pl-6 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export default function EFinal() {
  const g = DIAG.geral;
  const [on, id] = ALAVANCAS;

  return (
    <>
      <Callout tipo="info" titulo="Dia 09/12: duas entregas">
        O <strong>documento escrito em PDF</strong> e a <strong>apresentação para a turma</strong>. O PDF é enviado na pasta do Drive indicada pelo professor.
      </Callout>

      <section className="grid gap-5 md:grid-cols-3">
        <Card>
          <FileText className="size-5 text-brand" aria-hidden />
          <h3 className="mt-2 font-display text-lg font-bold">Documento (15 pts)</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
            <li>PDF, A4, Arial ou Times 12, espaçamento 1,5, margens de 2,5 cm</li>
            <li>Até 6 páginas, sem contar capa e referências</li>
            <li>Capa · contexto · limpeza · 4 perguntas · dashboard (prints) · recomendação · referências</li>
            <li>Registro do uso de IA</li>
          </ul>
          <a href={href('entregas/5')} className="mt-3 inline-block text-sm font-semibold text-brand-ink hover:underline">
            Ver estrutura sugerida →
          </a>
        </Card>
        <Card>
          <Mic2 className="size-5 text-brand" aria-hidden />
          <h3 className="mt-2 font-display text-lg font-bold">Apresentação (10 pts)</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
            <li>De 5 a 15 minutos</li>
            <li>Todos os integrantes participam</li>
            <li>Pode usar slides, o painel ao vivo ou os dois</li>
            <li>Dica: mostrar o Dashboard ao vivo, filtrando em tempo real</li>
          </ul>
          <a href={href('entregas/5')} className="mt-3 inline-block text-sm font-semibold text-brand-ink hover:underline">
            Abrir o cronômetro →
          </a>
        </Card>
        <Card>
          <Send className="size-5 text-brand" aria-hidden />
          <h3 className="mt-2 font-display text-lg font-bold">Envio</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
            <li>Cada etapa vai para a pasta do Drive do professor</li>
            <li>Opcional: link editável do dashboard (Looker Studio ou Google Sheets)</li>
          </ul>
          <a
            href={GRUPO.drive}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline"
          >
            Abrir a pasta do Drive <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </Card>
      </section>

      <section>
        <SectionTitle eyebrow="Avaliação" title="Critérios (30 pontos) e onde cada um está coberto" />
        <Tabela>
          <thead>
            <tr>
              <th className={th}>Critério</th>
              <th className={`${th} text-right`}>Pontos</th>
              <th className={th}>Onde está neste site</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIOS.map((b) => (
              <Fragment key={b.bloco}>
                <tr>
                  <td colSpan={3} className="bg-brand-soft/60 px-3 py-2 text-xs font-bold tracking-wide text-brand-ink uppercase">
                    {b.bloco}
                  </td>
                </tr>
                {b.itens.map(([t, p, onde]) => (
                  <tr key={t}>
                    <td className={td}>{t}</td>
                    <td className={`${td} tnum text-right font-semibold`}>{fmtN(p)}</td>
                    <td className={`${td} text-muted`}>{onde}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </Tabela>
      </section>

      <section className="space-y-3">
        <SectionTitle eyebrow="Preparação" title="Perguntas que o professor pode fazer">
          "Qualquer integrante precisa saber responder como um número foi calculado." Estas respostas usam os números reais da base. Leiam, entendam e reformulem com as próprias palavras.
        </SectionTitle>

        <Pergunta q="Como a taxa de evasão foi calculada?">
          Evadidos ÷ total de matrículas: {fmtN(g.evadidos)} ÷ {fmtN(g.n)} = <strong>{fmtPct(g.taxaEvasao)}</strong>. Como {fmtN(g.andamento)} matrículas ainda estão em andamento, também mostramos a versão que ignora essas: {fmtN(g.evadidos)} ÷ (
          {fmtN(g.concluidos)} + {fmtN(g.evadidos)}) = <strong>{fmtPct(g.taxaEvasaoEnc)}</strong>.
        </Pergunta>

        <Pergunta q="Por que usaram mediana, e não média, em Pct_Concluido e Dias_Ate_Primeiro_Acesso?">
          Porque a média é sensível a valores extremos. Em <code>Pct_Concluido</code> havia o erro de 140%; em <code>Dias_Ate_Primeiro_Acesso</code> a distribuição é assimétrica à direita: média de {fmtN(P.dias.media, 2)} dias contra
          mediana de {fmtN(P.dias.mediana, 0)} dias. A mediana descreve o aluno típico.
        </Pergunta>

        <Pergunta q="Por que o 140% virou a mediana do status e não simplesmente 100%?">
          Dos {P.pct.linhas} registros com erro, só alguns eram de concluídos. Para um evadido ou alguém em andamento, 100% contradiria o status. Usando a mediana do mesmo status (concluído {fmtN(PCT_MEDIANA_POR_STATUS['Concluído'], 0)}%, em
          andamento {fmtN(PCT_MEDIANA_POR_STATUS['Em andamento'], 1)}%, evadido {fmtN(PCT_MEDIANA_POR_STATUS['Evadido'], 1)}%), o valor fica coerente com cada caso; para os concluídos o resultado coincide com 100%.
        </Pergunta>

        <Pergunta q="Por que imputaram a nota em vez de apagar as linhas?">
          Eram só {P.nota.falhaRegistro} concluídos sem nota ({fmtPct(P.nota.falhaRegistro / P.nota.concluidos)}); apagar essas matrículas jogaria fora informação de status, categoria e dispositivo que as outras análises usam. Imputamos a mediana (
          {fmtN(NOTA_MEDIANA, 1)}) e marcamos as linhas. A nota média quase não muda ({fmtN(P.nota.mediaAntes, 3)} → {fmtN(P.nota.mediaDepois, 3)}). As {fmtN(P.nota.naoSeAplica)} notas vazias de quem não concluiu <em>não são faltantes</em>: não se aplicam.
        </Pergunta>

        <Pergunta q="Por que não removeram os outliers de dias até o primeiro acesso?">
          Não são erros: são alunos que demoraram a começar, e esse comportamento é justamente o principal sinal de evasão ({fmtPct(DIAG.tarde.taxa)} para {LIMIAR_DIAS}+ dias contra {fmtPct(DIAG.cedo.taxa)}). Removê-los apagaria a descoberta.
        </Pergunta>

        <Pergunta q="O que significa p < 0,001 ali na análise diagnóstica?">
          É o resultado de um teste de duas proporções: a chance de ver uma diferença tão grande entre os grupos ({fmtPct(on.taxaAtual, 0)} × {fmtPct(on.taxaMeta, 0)}) só por acaso é {fmtP(on.p)}. Valores abaixo de 0,05 indicam que
          a diferença provavelmente não é acaso, mas isso <em>não prova</em> que o tempo até o 1º acesso causa a evasão.
        </Pergunta>

        <Pergunta q="Como funciona o modelo preditivo e o que é o AUC?">
          Uma regressão logística usa três informações (demorou {LIMIAR_DIAS}+ dias, categoria e celular) para estimar a probabilidade de evasão, treinada nas {fmtN(MODELO.nTreino)} matrículas com desfecho. O AUC ({fmtN(MODELO.auc, 2)}) é a
          chance de o modelo dar risco maior a um evadido do que a um concluído escolhidos ao acaso: 0,5 é chute, 1,0 é perfeito. {fmtN(MODELO.auc, 2)} é um poder modesto, útil para priorizar. Dos {fmtN(EM_ANDAMENTO.length)} em andamento, a soma das probabilidades indica ~
          {fmtN(EVASOES_ESPERADAS, 0)} evasões.
        </Pergunta>

        <Pergunta q="De onde vêm as 'evasões evitadas' da prescritiva?">
          Fórmula: matrículas do grupo × (taxa atual − taxa do grupo de referência) × % da diferença que a ação fecha. Onboarding: {fmtN(on.n)} × ({fmtPct(on.taxaAtual)} − {fmtPct(on.taxaMeta)}) × 50% ={' '}
          <strong>{fmtN(evasoesEvitadas(on, 0.5), 1)}</strong> evasões. Idiomas: {fmtN(id.n)} × ({fmtPct(id.taxaAtual)} − {fmtPct(id.taxaMeta)}) × 50% = <strong>{fmtN(evasoesEvitadas(id, 0.5), 1)}</strong>. É uma simulação, não uma garantia.
        </Pergunta>

        <Pergunta q="Qual é a maior limitação do trabalho?">
          O desfecho incompleto ({fmtN(g.andamento)} matrículas ainda em andamento) e o fato de a base só mostrar associações: sem um piloto com grupo de controle não dá para afirmar que as ações vão reduzir a evasão.
        </Pergunta>

        <Pergunta q="Onde vocês usaram IA?">Está no texto do registro de uso de IA (aba Entrega 5): apoio na montagem do site, nas fórmulas e na revisão, com tudo conferido pelo grupo.</Pergunta>
      </section>
    </>
  );
}
