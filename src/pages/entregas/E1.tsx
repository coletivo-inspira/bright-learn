import { Briefcase, Compass, Megaphone, Target, TrendingDown } from 'lucide-react';
import { Callout, Card, Kpi, SectionTitle } from '../../components/ui';
import { GRUPO } from '../../data/grupo';
import { resumo } from '../../lib/analytics';
import { MESES_DISPONIVEIS, ROWS } from '../../lib/clean';
import { fmtMesLongo, fmtN, fmtPct } from '../../lib/format';
import { href } from '../../lib/router';
import { CATEGORIAS, DISPOSITIVOS } from '../../lib/types';

const HIPOTESES = [
  { id: 'H1', texto: 'Quem demora para fazer o primeiro acesso depois de se matricular tem mais chance de evadir.' },
  { id: 'H2', texto: 'A evasão não é igual entre as categorias: alguns tipos de curso retêm menos.' },
  { id: 'H3', texto: 'Estudar principalmente pelo celular está associado a mais evasão do que estudar no computador.' },
  { id: 'H4', texto: '"Falta de tempo" é o principal motivo declarado por quem abandona.' },
];

export default function E1() {
  const r = resumo(ROWS);
  const inicio = fmtMesLongo(MESES_DISPONIVEIS[0]);
  const fim = fmtMesLongo(MESES_DISPONIVEIS[MESES_DISPONIVEIS.length - 1]);

  return (
    <>
      {/* ---------- Pergunta central ---------- */}
      <section className="rounded-3xl border border-brand/30 bg-brand-soft/60 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand uppercase">
          <Target className="size-4" aria-hidden /> Pergunta de negócio (rascunho)
        </p>
        <p className="mt-3 max-w-4xl font-display text-2xl leading-snug font-bold sm:text-3xl">
          Quais fatores estão associados à evasão dos alunos da BrightLearn e onde a plataforma deve agir primeiro para aumentar a conclusão dos
          cursos?
        </p>
      </section>

      {/* ---------- Por que a base interessa ---------- */}
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <SectionTitle eyebrow="Etapa (a)" title="Por que essa base interessa" />
          <div className="space-y-3 text-sm leading-relaxed sm:text-base">
            <p>
              A <strong>BrightLearn</strong> é uma plataforma de cursos online com {CATEGORIAS.length} categorias (
              {CATEGORIAS.join(', ')}). Quando um aluno abandona o curso, a plataforma perde a receita da assinatura ou venda, desperdiça o custo de
              aquisição daquele aluno e ainda ganha um cliente que dificilmente indica o serviço.
            </p>
            <p>
              A base registra {fmtN(r.n)} matrículas entre {inicio} e {fim}. Em cada linha dá para ver como a matrícula terminou
              (concluída, em andamento ou evadida), em qual categoria, em qual dispositivo e quantos dias o aluno levou para o primeiro acesso:
              exatamente o que é preciso para entender <em>onde e por que</em> a retenção falha.
            </p>
            <p>
              Hoje, <strong>{fmtPct(r.taxaEvasao)}</strong> das matrículas terminaram em evasão e apenas <strong>{fmtPct(r.taxaConclusao)}</strong> em
              conclusão. Reduzir a evasão é a alavanca mais direta para aumentar a conclusão.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 self-start">
          <Kpi rotulo="Matrículas" valor={fmtN(r.n)} dica={`${inicio} a ${fim}`} />
          <Kpi rotulo="Categorias" valor={String(CATEGORIAS.length)} dica="de curso" />
          <Kpi rotulo="Dispositivos" valor={String(DISPOSITIVOS.length)} dica="celular, computador, tablet" />
          <Kpi rotulo="Evasão" valor={fmtPct(r.taxaEvasao)} tom="bad" dica={`${fmtN(r.evadidos)} matrículas`} />
        </div>
      </section>

      {/* ---------- Quem decide ---------- */}
      <section>
        <SectionTitle eyebrow="Etapa (a)" title="Quem tomaria uma decisão a partir dela">
          Três áreas da empresa poderiam usar a análise. Cada uma tem uma decisão diferente na mesa.
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              Icone: Briefcase,
              quem: 'Diretoria de Produto / Acadêmica',
              decisao: 'Quais categorias de curso revisar, reformular ou reforçar primeiro?',
              dado: 'Evasão por categoria e motivos declarados (dificuldade, relevância).',
            },
            {
              Icone: Compass,
              quem: 'Customer Success / Retenção',
              decisao: 'Quem contatar, em que momento e com qual abordagem?',
              dado: 'Tempo até o 1º acesso, risco previsto, matrículas em andamento.',
            },
            {
              Icone: Megaphone,
              quem: 'Marketing / Comunicação',
              decisao: 'Que mensagem de boas-vindas e lembretes enviar a cada perfil?',
              dado: 'Dispositivo principal, categoria e motivo "falta de tempo".',
            },
          ].map(({ Icone, quem, decisao, dado }) => (
            <Card key={quem}>
              <Icone className="size-5 text-brand" aria-hidden />
              <p className="mt-3 font-display text-base font-bold">{quem}</p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Decide: </span>
                {decisao}
              </p>
              <p className="mt-2 text-sm text-muted">
                <span className="font-semibold text-ink">Usa: </span>
                {dado}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Hipóteses ---------- */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle eyebrow="Etapa (a)" title="Hipóteses de partida" />
          <ul className="space-y-3">
            {HIPOTESES.map((h) => (
              <li key={h.id} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 flex h-6 w-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-xs font-bold text-brand-ink">
                  {h.id}
                </span>
                {h.texto}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Serão testadas na análise diagnóstica (Entrega 3).</p>
        </Card>

        <Card>
          <SectionTitle eyebrow="Etapa (a)" title="Como vamos medir" />
          <dl className="space-y-3 text-sm leading-relaxed">
            <div>
              <dt className="flex items-center gap-1.5 font-semibold">
                <TrendingDown className="size-4 text-bad" aria-hidden /> Taxa de evasão (KPI)
              </dt>
              <dd className="text-muted">evadidos ÷ total de matrículas. Também mostramos a versão "só encerradas" (evadidos ÷ concluídos + evadidos), que ignora quem ainda está estudando.</dd>
            </div>
            <div>
              <dt className="font-semibold">Taxa de conclusão</dt>
              <dd className="text-muted">concluídos ÷ total de matrículas.</dd>
            </div>
            <div>
              <dt className="font-semibold">Unidade de análise</dt>
              <dd className="text-muted">1 linha = 1 <em>matrícula</em> (não 1 aluno): a base não permite saber se o mesmo aluno aparece mais de uma vez.</dd>
            </div>
          </dl>
        </Card>
      </section>

      <Callout tipo="info" titulo="Já quer ver a base?">
        Abra <a className="font-semibold text-brand-ink underline" href={href('dados')}>Base de dados</a> para buscar e filtrar as {fmtN(r.n)} matrículas, ou veja o
        resultado final em <a className="font-semibold text-brand-ink underline" href={href('dashboard')}>Dashboard</a>.
      </Callout>

      <Card>
        <SectionTitle eyebrow="Checkpoint 1" title="Grupo e base registrados" />
        <p className="text-sm text-muted">
          Grupo <strong className="text-ink">{GRUPO.nome}</strong> ({GRUPO.integrantes.length} integrantes) · base escolhida:{' '}
          <strong className="text-ink">{GRUPO.tema}</strong>. Para alterar nomes, edite <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">src/data/grupo.ts</code>.
        </p>
      </Card>
    </>
  );
}
