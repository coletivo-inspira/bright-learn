import { useState } from 'react';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Eye, Lightbulb, Route, Search, Sparkles } from 'lucide-react';
import { BarraTaxa } from '../../components/charts';
import { GDias } from '../../components/GraficosBase';
import { Badge, Callout, Card, SectionTitle, Tabela, td, th } from '../../components/ui';
import { ALAVANCAS, DIAG, evasoesEvitadas, fmtP, novaTaxaGeral } from '../../lib/insights';
import { porGrupo } from '../../lib/analytics';
import { ROWS } from '../../lib/clean';
import { fmtN, fmtPct } from '../../lib/format';
import { EM_ANDAMENTO, EVASOES_ESPERADAS, LIMIAR_DIAS, MODELO, prever } from '../../lib/model';
import { CATEGORIAS, DISPOSITIVOS } from '../../lib/types';
import type { Categoria, Dispositivo } from '../../lib/types';

/* ------------------------------------------------------------------ */
/* Estrutura de cada análise                                           */
/* ------------------------------------------------------------------ */
function Analise({
  Icone,
  tipo,
  responde,
  cor,
  pergunta,
  como,
  resultado,
  acao,
  limite,
}: {
  Icone: typeof Eye;
  tipo: string;
  responde: string;
  cor: string;
  pergunta: string;
  como: ReactNode;
  resultado: ReactNode;
  acao: ReactNode;
  limite?: ReactNode;
}) {
  return (
    <Card as="article" className="space-y-5 overflow-hidden !p-0">
      <div className={clsx('flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6', cor)}>
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/20">
          <Icone className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-display text-xl font-extrabold">Análise {tipo}</h3>
          <p className="text-sm opacity-90">{responde}</p>
        </div>
      </div>
      <div className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-brand uppercase">Pergunta aos dados</p>
              <p className="mt-1 font-display text-lg leading-snug font-bold">{pergunta}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted uppercase">Como respondemos</p>
              <div className="mt-1 text-sm leading-relaxed text-muted">{como}</div>
            </div>
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Resultado</p>
            {resultado}
          </div>
        </div>
        <div className="rounded-xl border border-ok/30 bg-ok-soft/50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ok uppercase">
            <Lightbulb className="size-3.5" aria-hidden /> Ação / decisão que ela permite
          </p>
          <div className="mt-1 text-sm leading-relaxed">{acao}</div>
        </div>
        {limite && <p className="text-xs leading-relaxed text-muted"><span className="font-semibold text-ink">Limite: </span>{limite}</p>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Diagnóstica: evidências                                             */
/* ------------------------------------------------------------------ */
function Evidencia({ rotulo, a, b, nomeA, nomeB, p, hip }: { rotulo: string; a: number; b: number; nomeA: string; nomeB: string; p: number; hip: string }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{rotulo}</p>
        <Badge tom={p < 0.05 ? 'ok' : 'neutro'}>{hip}</Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <p className="tnum font-display text-2xl font-extrabold text-bad">{fmtPct(a)}</p>
          <p className="text-xs text-muted">{nomeA}</p>
        </div>
        <div>
          <p className="tnum font-display text-2xl font-extrabold">{fmtPct(b)}</p>
          <p className="text-xs text-muted">{nomeB}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Diferença de {fmtN((a - b) * 100, 1)} p.p. · teste z de duas proporções: {fmtP(p)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preditiva: calculadora                                              */
/* ------------------------------------------------------------------ */
const selectCls = 'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-ink';

function Calculadora() {
  const [cat, setCat] = useState<Categoria>('Idiomas');
  const [dev, setDev] = useState<Dispositivo>('Celular');
  const [dias, setDias] = useState(10);
  const risco = prever({ categoria: cat, dispositivo: dev, dias });
  const alto = risco >= MODELO.base * 1.25;
  const baixo = risco <= MODELO.base * 0.75;

  return (
    <div className="rounded-xl border border-line p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-brand" aria-hidden /> Calculadora de risco: teste um perfil
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-muted uppercase">
          Categoria
          <select className={selectCls} value={cat} onChange={(e) => setCat(e.target.value as Categoria)}>
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted uppercase">
          Dispositivo
          <select className={selectCls} value={dev} onChange={(e) => setDev(e.target.value as Dispositivo)}>
            {DISPOSITIVOS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted uppercase">
          Dias até o 1º acesso: <span className="tnum text-ink">{dias}</span>
          <input type="range" min={0} max={24} value={dias} onChange={(e) => setDias(Number(e.target.value))} className="mt-3 w-full accent-[var(--brand)]" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className={clsx('tnum font-display text-4xl font-extrabold', alto ? 'text-bad' : baixo ? 'text-ok' : 'text-ink')}>{fmtPct(risco, 0)}</p>
        <div className="min-w-[12rem] flex-1">
          <p className="text-sm font-semibold">{alto ? 'Risco alto de evasão' : baixo ? 'Risco baixo de evasão' : 'Risco próximo da média'}</p>
          <div className="relative mt-2 h-2.5 rounded-full bg-surface-2" aria-hidden>
            <div className={clsx('h-full rounded-full', alto ? 'bg-bad' : baixo ? 'bg-ok' : 'bg-brand')} style={{ width: `${risco * 100}%` }} />
            <div className="absolute -top-1 h-4.5 w-0.5 bg-ink" style={{ left: `${MODELO.base * 100}%` }} title="Média histórica" />
          </div>
          <p className="mt-1 text-[11px] text-muted">A marca preta é a taxa média entre as matrículas encerradas ({fmtPct(MODELO.base)}).</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Prescritiva: simulador                                              */
/* ------------------------------------------------------------------ */
function Simulador() {
  const [efet, setEfet] = useState(50);
  const e = efet / 100;
  const total = DIAG.geral.evadidos;
  return (
    <div className="space-y-4">
      <label className="block rounded-xl border border-line p-4 text-sm">
        <span className="font-semibold">Quanto da diferença cada ação consegue fechar? </span>
        <span className="tnum font-display text-lg font-extrabold text-brand">{efet}%</span>
        <input type="range" min={0} max={100} step={5} value={efet} onChange={(ev) => setEfet(Number(ev.target.value))} className="mt-2 block w-full accent-[var(--brand)]" />
        <span className="mt-1 block text-xs text-muted">
          100% = o grupo-alvo passaria a evadir tanto quanto o grupo de referência. Com 50%, a ação resolve metade da diferença.
        </span>
      </label>

      <Tabela>
        <thead>
          <tr>
            <th className={th}>Ação</th>
            <th className={th}>Grupo-alvo</th>
            <th className={`${th} text-right`}>Evasão hoje → meta</th>
            <th className={`${th} text-right`}>Evasões evitadas</th>
            <th className={`${th} text-right`}>Nova evasão geral</th>
            <th className={th}>Esforço</th>
          </tr>
        </thead>
        <tbody>
          {ALAVANCAS.map((a) => (
            <tr key={a.id}>
              <td className={td}>
                <p className="font-semibold">{a.nome}</p>
                <p className="mt-0.5 text-xs text-muted">{a.acao}</p>
              </td>
              <td className={td}>
                {a.alvo}
                <p className="tnum text-xs text-muted">{fmtN(a.n)} matrículas</p>
              </td>
              <td className={`${td} tnum text-right whitespace-nowrap`}>
                {fmtPct(a.taxaAtual)} → {fmtPct(a.taxaMeta)}
                <p className="text-xs text-muted">meta = {a.referencia}</p>
              </td>
              <td className={`${td} tnum text-right font-display text-lg font-extrabold text-ok`}>{fmtN(evasoesEvitadas(a, e), 1)}</td>
              <td className={`${td} tnum text-right`}>
                {fmtPct(novaTaxaGeral(a, e))}
                <p className="text-xs text-muted">hoje {fmtPct(total / DIAG.geral.n)}</p>
              </td>
              <td className={td}>
                <Badge tom={a.esforco === 'Baixo' ? 'ok' : a.esforco === 'Médio' ? 'accent' : 'bad'}>{a.esforco}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabela>
      <p className="text-xs leading-relaxed text-muted">
        Cada linha é calculada sozinha: <code>matrículas do grupo × (taxa atual − taxa da referência) × % que a ação fecha</code>. Os grupos se sobrepõem (um aluno de Idiomas
        no celular que demorou 10 dias entra nas três), então <strong>não some as linhas</strong>. O esforço é uma estimativa do grupo, a validar com a empresa.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
export default function E3() {
  const porCat = porGrupo(ROWS, (r) => r.categoria, CATEGORIAS, 'todas').sort((a, b) => b.taxa - a.taxa);
  const maior = porCat[0];
  const menor = porCat[porCat.length - 1];
  const g = DIAG.geral;
  const top = EM_ANDAMENTO.slice(0, 8);
  const t = DIAG.teste;

  return (
    <>
      <Callout tipo="info" titulo="Como ler esta entrega">
        Uma pergunta por tipo de análise, cada uma com a ação ou decisão que ela habilita: <strong>descritiva</strong> (o que aconteceu?), <strong>diagnóstica</strong> (por que aconteceu?),{' '}
        <strong>preditiva</strong> (o que vai acontecer?) e <strong>prescritiva</strong> (o que devemos fazer?). Todos os números abaixo são calculados da base tratada.
      </Callout>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { Icone: Eye, t: 'Descritiva', q: 'O que aconteceu?', cor: 'text-info' },
          { Icone: Search, t: 'Diagnóstica', q: 'Por que aconteceu?', cor: 'text-accent' },
          { Icone: Sparkles, t: 'Preditiva', q: 'O que vai acontecer?', cor: 'text-brand' },
          { Icone: Route, t: 'Prescritiva', q: 'O que fazer?', cor: 'text-ok' },
        ].map(({ Icone, t: titulo, q, cor }) => (
          <div key={titulo} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
            <Icone className={clsx('size-5', cor)} aria-hidden />
            <div>
              <p className="text-sm font-bold">{titulo}</p>
              <p className="text-xs text-muted">{q}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ================= Descritiva ================= */}
      <Analise
        Icone={Eye}
        tipo="descritiva"
        responde="O que aconteceu com as matrículas?"
        cor="bg-info text-white"
        pergunta="Qual é a taxa de conclusão e de evasão da BrightLearn e como a evasão varia entre as categorias de curso?"
        como={
          <p>
            Contamos as matrículas por status e calculamos a taxa de evasão (evadidos ÷ matrículas) em cada categoria, usando a base tratada. Comparamos cada categoria com a taxa geral.
          </p>
        }
        resultado={
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { l: 'Concluídos', v: g.concluidos, p: g.taxaConclusao, c: 'text-ok' },
                { l: 'Em andamento', v: g.andamento, p: g.taxaAndamento, c: 'text-info' },
                { l: 'Evadidos', v: g.evadidos, p: g.taxaEvasao, c: 'text-bad' },
              ].map((x) => (
                <div key={x.l} className="rounded-xl border border-line p-3">
                  <p className={clsx('tnum font-display text-2xl font-extrabold', x.c)}>{fmtPct(x.p)}</p>
                  <p className="text-xs font-medium">{x.l}</p>
                  <p className="tnum text-[11px] text-muted">{fmtN(x.v)} matrículas</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-line p-3">
              <BarraTaxa
                altura={200}
                dados={porCat.map((c) => ({ nome: c.nome, valor: c.taxa, n: c.n }))}
                referencia={g.taxaEvasao}
                rotuloRef="geral"
                descricao="Taxa de evasão por categoria"
              />
            </div>
            <p className="text-sm">
              <strong>{maior.nome}</strong> tem a maior evasão ({fmtPct(maior.taxa)}), quase o dobro de <strong>{menor.nome}</strong> ({fmtPct(menor.taxa)}).
            </p>
          </div>
        }
        acao={
          <>
            A Diretoria de Produto deve <strong>priorizar {maior.nome}</strong> na revisão de conteúdo e formato dos cursos, e usar <strong>{menor.nome}</strong> como referência de boas práticas (o que esses cursos
            fazem diferente?).
          </>
        }
        limite={`A taxa considera todas as matrículas; ${fmtN(g.andamento)} ainda estão em andamento. Na base "só encerradas" o ranking se mantém (veja o Dashboard).`}
      />

      {/* ================= Diagnóstica ================= */}
      <Analise
        Icone={Search}
        tipo="diagnóstica"
        responde="Por que os alunos evadem?"
        cor="bg-[#b45309] text-white"
        pergunta="O que diferencia quem evade de quem conclui: tempo até o primeiro acesso, categoria, dispositivo ou motivo declarado?"
        como={
          <>
            <p>
              Testamos as hipóteses H1–H4 comparando a taxa de evasão entre grupos (ex.: quem demorou {LIMIAR_DIAS}+ dias contra quem não demorou) e lendo os motivos declarados. Como extra, aplicamos um{' '}
              <em>teste z de duas proporções</em>: p &lt; 0,05 indica que a diferença é pouco provável de ser acaso.
            </p>
          </>
        }
        resultado={
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Evidencia hip="H1 · confirmada" rotulo={`Demorou ${LIMIAR_DIAS}+ dias p/ 1º acesso`} a={DIAG.tarde.taxa} b={DIAG.cedo.taxa} nomeA={`${fmtN(DIAG.tarde.n)} matrículas`} nomeB={`${fmtN(DIAG.cedo.n)} que acessaram antes`} p={t.tempo.p} />
              <Evidencia hip="H2 · confirmada" rotulo="Categoria Idiomas" a={DIAG.idiomas.taxa} b={DIAG.outrasCategorias.taxa} nomeA={`${fmtN(DIAG.idiomas.n)} matrículas`} nomeB="demais categorias" p={t.idiomas.p} />
              <Evidencia hip={t.celular.p < 0.05 ? 'H3 · confirmada (efeito menor)' : 'H3 · não confirmada'} rotulo="Celular como dispositivo principal" a={DIAG.celular.taxa} b={DIAG.outrosDispositivos.taxa} nomeA={`${fmtN(DIAG.celular.n)} matrículas`} nomeB="computador ou tablet" p={t.celular.p} />
              <div className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Motivo mais citado</p>
                  <Badge tom="ok">H4 · confirmada</Badge>
                </div>
                <p className="tnum mt-2 font-display text-2xl font-extrabold">{fmtPct(DIAG.motivos.faltaDeTempo / DIAG.motivos.informados)}</p>
                <p className="text-xs text-muted">dos {DIAG.motivos.informados} evadidos com motivo informado citam "Falta de tempo"</p>
                <p className="mt-2 text-[11px] text-muted">
                  Em Idiomas: {fmtPct(DIAG.motivos.idiomasFaltaDeTempo / DIAG.motivos.idiomasInformados)} ({DIAG.motivos.idiomasFaltaDeTempo} de {DIAG.motivos.idiomasInformados}).
                </p>
              </div>
            </div>
            <GDias rows={ROWS} base="todas" altura={210} />
          </div>
        }
        acao={
          <>
            Atacar a causa que mais pesa e é mais fácil de agir: <strong>ativar o aluno logo na primeira semana</strong> (a taxa fica em ~27–29% até 7 dias e salta depois disso) e tratar a{' '}
            <strong>falta de tempo</strong> em Idiomas com formatos mais flexíveis. O celular merece revisão, mas é o sinal mais fraco.
          </>
        }
        limite="São associações, não provas de causa: quem demora a começar pode já estar menos motivado por outro motivo que a base não registra."
      />

      {/* ================= Preditiva ================= */}
      <Analise
        Icone={Sparkles}
        tipo="preditiva"
        responde="O que vai acontecer com quem ainda está estudando?"
        cor="bg-brand text-white"
        pergunta={`Dados a categoria, o dispositivo e os dias até o 1º acesso, qual a chance de uma matrícula evadir, e quantas das ${fmtN(EM_ANDAMENTO.length)} matrículas em andamento devem evadir?`}
        como={
          <>
            <p>
              Regressão logística simples, treinada nas {fmtN(MODELO.nTreino)} matrículas com desfecho (concluído × evadido). As {fmtN(EM_ANDAMENTO.length)} em andamento ainda não têm desfecho, então são justamente as que recebem a previsão.
            </p>
            <p className="mt-2">
              Validamos em 5 partes (treina em 4, testa em 1): AUC = <strong>{fmtN(MODELO.auc, 2)}</strong> e acerto de <strong>{fmtPct(MODELO.acuracia, 0)}</strong>.
            </p>
          </>
        }
        resultado={
          <div className="space-y-4">
            <Calculadora />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Previsão para quem está em andamento</p>
                <p className="tnum mt-1 font-display text-3xl font-extrabold text-bad">~{fmtN(EVASOES_ESPERADAS, 0)}</p>
                <p className="text-xs text-muted">
                  de {fmtN(EM_ANDAMENTO.length)} matrículas ({fmtPct(EVASOES_ESPERADAS / EM_ANDAMENTO.length, 0)}) devem evadir se todas encerrarem.
                </p>
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">O modelo separa bem os grupos?</p>
                <table className="mt-1 w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted">
                      <th className="py-1 font-medium">Faixa</th>
                      <th className="py-1 text-right font-medium">Previsto</th>
                      <th className="py-1 text-right font-medium">Real</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODELO.calibracao.map((c) => (
                      <tr key={c.nome} className="border-t border-line">
                        <td className="py-1">{c.nome}</td>
                        <td className="tnum py-1 text-right">{fmtPct(c.previsto, 0)}</td>
                        <td className="tnum py-1 text-right font-semibold">{fmtPct(c.observado, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">8 matrículas em andamento com maior risco previsto</p>
              <Tabela>
                <thead>
                  <tr>
                    <th className={th}>ID</th>
                    <th className={th}>Categoria</th>
                    <th className={th}>Dispositivo</th>
                    <th className={`${th} text-right`}>Dias 1º acesso</th>
                    <th className={`${th} text-right`}>% concluído</th>
                    <th className={`${th} text-right`}>Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map(({ row, risco }) => (
                    <tr key={row.id}>
                      <td className={clsx(td, 'tnum font-medium')}>{row.id}</td>
                      <td className={td}>{row.categoria}</td>
                      <td className={td}>{row.dispositivo}</td>
                      <td className={clsx(td, 'tnum text-right')}>{row.dias}</td>
                      <td className={clsx(td, 'tnum text-right')}>{fmtN(row.pct, 0)}%</td>
                      <td className={clsx(td, 'tnum text-right font-semibold text-bad')}>{fmtPct(risco, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            </div>
            <details className="rounded-xl border border-line p-3 text-sm">
              <summary className="cursor-pointer font-semibold">Ver o modelo (coeficientes e razões de chance)</summary>
              <Tabela className="mt-3">
                <thead>
                  <tr>
                    <th className={th}>Fator</th>
                    <th className={`${th} text-right`}>Coeficiente</th>
                    <th className={`${th} text-right`}>Razão de chance</th>
                  </tr>
                </thead>
                <tbody>
                  {MODELO.nomes.map((n, i) => (
                    <tr key={n}>
                      <td className={td}>{n}</td>
                      <td className={clsx(td, 'tnum text-right')}>{fmtN(MODELO.coef[i], 2)}</td>
                      <td className={clsx(td, 'tnum text-right font-semibold')}>{i === 0 ? '—' : `×${fmtN(Math.exp(MODELO.coef[i]), 1)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
              <p className="mt-2 text-xs text-muted">
                Razão de chance ×3,0 significa que a "chance" (odds) de evadir é 3 vezes maior que a do grupo de referência, mantidos os demais fatores. A chance não é a mesma coisa que a probabilidade.
              </p>
            </details>
          </div>
        }
        acao={
          <>
            O time de Retenção recebe toda semana a <strong>lista das matrículas em andamento ordenada por risco</strong> e contata primeiro as de risco alto, antes que o aluno desista. Com {fmtN(EM_ANDAMENTO.length)} matrículas em andamento e capacidade limitada, a lista diz por onde começar.
          </>
        }
        limite={`AUC ${fmtN(MODELO.auc, 2)} indica poder preditivo modesto (0,5 = chute; 1,0 = perfeito): o modelo ajuda a priorizar grupos, mas não decide sozinho o destino de um aluno. Faltam variáveis como engajamento semanal ou preço.`}
      />

      {/* ================= Prescritiva ================= */}
      <Analise
        Icone={Route}
        tipo="prescritiva"
        responde="O que devemos fazer?"
        cor="bg-ok text-white"
        pergunta="Qual ação reduz mais a evasão e quantas matrículas ela salva, considerando o esforço de cada uma?"
        como={
          <>
            <p>
              Transformamos cada causa encontrada na diagnóstica em uma ação e simulamos o ganho: se a ação aproximar o grupo-alvo da taxa de um grupo de referência, quantas evasões deixam de acontecer?
            </p>
            <p className="mt-2">Use o controle ao lado para testar cenários mais otimistas ou conservadores.</p>
          </>
        }
        resultado={<Simulador />}
        acao={
          <>
            Começar por <strong>onboarding ativo</strong> (esforço baixo, grupo bem definido, evidência forte), com <strong>trilha flexível em Idiomas</strong> em seguida. Medir a taxa de evasão do grupo-alvo em um piloto de 60 dias antes de ampliar. A recomendação completa está na{' '}
            <a className="font-semibold text-brand-ink underline" href="#/entregas/5">
              Entrega 5
            </a>
            .
          </>
        }
        limite="A simulação assume que a diferença entre grupos é causal e pode ser parcialmente fechada; só um teste controlado (piloto com grupo de comparação) confirma o efeito real."
      />

      <section>
        <SectionTitle eyebrow="Resumo" title="Pergunta → ação, por tipo de análise" />
        <Tabela>
          <thead>
            <tr>
              <th className={th}>Tipo</th>
              <th className={th}>Pergunta</th>
              <th className={th}>Ação / decisão</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Descritiva', 'Qual a taxa de conclusão/evasão e como varia por categoria?', `Priorizar ${maior.nome} na revisão de cursos; usar ${menor.nome} como benchmark.`],
              ['Diagnóstica', 'O que diferencia quem evade de quem conclui?', 'Atacar a demora no 1º acesso e a falta de tempo (Idiomas).'],
              ['Preditiva', 'Qual a chance de evadir de cada matrícula em andamento?', 'Lista semanal de risco para o time de Retenção.'],
              ['Prescritiva', 'Qual ação evita mais evasões considerando o esforço?', 'Piloto de onboarding ativo + trilha flexível em Idiomas.'],
            ].map(([a, b, c]) => (
              <tr key={a}>
                <td className={clsx(td, 'font-semibold')}>{a}</td>
                <td className={td}>{b}</td>
                <td className={td}>{c}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </section>
    </>
  );
}
