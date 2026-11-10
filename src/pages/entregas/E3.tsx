import { useState } from 'react';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Eye, Lightbulb, Route, Search, Sparkles } from 'lucide-react';
import { BarraTaxa } from '../../components/charts';
import { GDias } from '../../components/GraficosBase';
import { Badge, Callout, Card, SectionTitle, Tabela, td, th } from '../../components/ui';
import { ALAVANCAS, CRUZ, DIAG, MOTIVO_TEMPO, evasoesEvitadas, fmtP, novaTaxaGeral } from '../../lib/insights';
import { porGrupo } from '../../lib/analytics';
import { ROWS } from '../../lib/clean';
import { fmtN, fmtPct } from '../../lib/format';
import { LIMIAR_DIAS } from '../../lib/model';
import { CATEGORIAS } from '../../lib/types';

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
          {ALAVANCAS.slice(0, 1).map((a) => (
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
        Cálculo: <code>matrículas do grupo × (taxa atual − taxa da referência) × % que a ação fecha</code>. Simulamos só o contato no 3º e no 5º dia; a trilha flexível em Idiomas e a experiência no celular ficam para uma segunda fase. O esforço é uma estimativa, a validar com a empresa.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
export default function E3() {
  const porCat = porGrupo(ROWS, (r) => r.categoria, CATEGORIAS, 'encerradas').sort((a, b) => b.taxa - a.taxa);
  const maior = porCat[0];
  const menor = porCat[porCat.length - 1];
  const g = DIAG.geral;
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
            Contamos as matrículas por status na base tratada e calculamos a taxa de evasão em cada categoria. Como quem está "Em andamento" ainda não terminou, a taxa de evasão usa só as <strong>encerradas</strong>: evadidos ÷ (concluídos + evadidos) = {fmtN(g.evadidos)} ÷ {fmtN(g.concluidos + g.evadidos)} = {fmtPct(g.taxaEvasaoEnc)}.
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
                referencia={g.taxaEvasaoEnc}
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
        limite={`As ${fmtN(g.andamento)} matrículas em andamento ficaram fora da taxa de evasão porque ainda podem concluir ou evadir. No Dashboard dá para alternar para "todas as matrículas" e o ranking se mantém.`}
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
              Testamos as hipóteses H1–H4 comparando a taxa de evasão entre grupos (categoria, dispositivo e tempo até o 1º acesso) e lendo os motivos declarados. A taxa usa só as matrículas <strong>encerradas</strong> ({fmtN(DIAG.enc.n)}), porque quem está em andamento ainda não terminou. Como extra, aplicamos um{' '}
              <em>teste z de duas proporções</em>: p &lt; 0,05 indica que a diferença é pouco provável de ser acaso.
            </p>
            <p className="mt-2">
              <strong>Faixas de dias:</strong> 0 dia (mesmo dia), 1 dia, 2–3 dias, 4–7 dias (ainda na 1ª semana) e {LIMIAR_DIAS}+ dias (depois da 1ª semana). Os cortes seguem a semana de estudo, e a mediana é 2 dias, então as primeiras faixas concentram a maioria dos alunos.
            </p>
          </>
        }
        resultado={
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Evidencia hip="H1 · confirmada" rotulo={`Demorou ${LIMIAR_DIAS}+ dias p/ 1º acesso`} a={DIAG.tarde.taxa} b={DIAG.cedo.taxa} nomeA={`${fmtN(DIAG.tarde.n)} encerradas`} nomeB={`${fmtN(DIAG.cedo.n)} que acessaram antes`} p={t.tempo.p} />
              <Evidencia hip="H2 · confirmada" rotulo="Categoria Idiomas" a={DIAG.idiomas.taxa} b={DIAG.outrasCategorias.taxa} nomeA={`${fmtN(DIAG.idiomas.n)} encerradas`} nomeB="demais categorias" p={t.idiomas.p} />
              <Evidencia hip={t.celular.p < 0.05 ? 'H3 · confirmada (efeito menor)' : 'H3 · não confirmada'} rotulo="Celular como dispositivo principal" a={DIAG.celular.taxa} b={DIAG.outrosDispositivos.taxa} nomeA={`${fmtN(DIAG.celular.n)} encerradas`} nomeB="computador ou tablet" p={t.celular.p} />
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
            <GDias rows={ROWS} base="encerradas" altura={210} />
            <div className="rounded-xl border border-line p-3">
              <p className="text-sm font-semibold">E o &quot;por quê&quot;? Quem demora sai pelo mesmo motivo de quem começa rápido?</p>
              <Tabela className="mt-2">
                <thead>
                  <tr>
                    <th className={th}>Motivo de evasão</th>
                    <th className={`${th} text-right`}>Até {LIMIAR_DIAS - 1} dias ({MOTIVO_TEMPO.nRapido} evadidos)</th>
                    <th className={`${th} text-right`}>{LIMIAR_DIAS}+ dias ({MOTIVO_TEMPO.nLento} evadidos)</th>
                  </tr>
                </thead>
                <tbody>
                  {MOTIVO_TEMPO.linhas.map((l) => (
                    <tr key={l.motivo}>
                      <td className={td}>{l.motivo}</td>
                      <td className={clsx(td, 'tnum text-right')}>{fmtPct(l.rapido, 0)}</td>
                      <td className={clsx(td, 'tnum text-right')}>{fmtPct(l.lento, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
              <p className="mt-2 text-xs text-muted">Os motivos são parecidos nos dois grupos (com {MOTIVO_TEMPO.nLento} casos nos que demoram, as diferenças são pequenas). Ou seja, a demora não parece ter uma causa própria: é um <strong>sinal precoce de desengajamento</strong>, o que justifica contatar o aluno antes que ele esfrie.</p>
            </div>
          </div>
        }
        acao={
          <>
            Atacar o que a plataforma consegue agir logo no início: <strong>ativar o aluno na primeira semana</strong> (a taxa fica entre 36% e 38% até 7 dias e salta depois disso) e deixar{' '}
            Idiomas (<strong>falta de tempo</strong>) e o celular como apoio. São sinais reais, mas o 1º acesso é o que a plataforma consegue atacar logo no início.
          </>
        }
        limite="São associações, não provas de causa: quem demora a começar pode já estar menos motivado por outro motivo que a base não registra."
      />

      {/* ================= Preditiva ================= */}
      <Analise
        Icone={Sparkles}
        tipo="preditiva"
        responde="Que perfil de matrícula nova tem mais risco?"
        cor="bg-brand text-white"
        pergunta="Juntando os sinais da diagnóstica, que perfil de matrícula nova tem mais risco de evadir?"
        como={
          <>
            <p>
              Cruzamos os dois sinais mais fortes da diagnóstica, a categoria <strong>Idiomas</strong> e a demora de <strong>{LIMIAR_DIAS}+ dias</strong> no 1º acesso, e olhamos a taxa de evasão observada em cada combinação (só matrículas encerradas). Sem modelo estatístico: a própria tabela mostra o risco.
            </p>
          </>
        }
        resultado={
          <div className="space-y-3">
            <Tabela>
              <thead>
                <tr>
                  <th className={th}>Perfil</th>
                  <th className={`${th} text-right`}>Até {LIMIAR_DIAS - 1} dias</th>
                  <th className={`${th} text-right`}>{LIMIAR_DIAS}+ dias</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Idiomas', CRUZ.idiomasRapido, CRUZ.idiomasLento],
                  ['Demais categorias', CRUZ.outrasRapido, CRUZ.outrasLento],
                ].map(([nome, r, l]) => {
                  const rr = r as typeof CRUZ.idiomasRapido;
                  const ll = l as typeof CRUZ.idiomasRapido;
                  return (
                    <tr key={nome as string}>
                      <td className={clsx(td, 'font-semibold')}>{nome as string}</td>
                      <td className={clsx(td, 'tnum text-right')}>
                        {fmtPct(rr.taxa)} <span className="text-xs text-muted">({rr.evadidos} de {rr.n})</span>
                      </td>
                      <td className={clsx(td, 'tnum text-right font-semibold text-bad')}>
                        {fmtPct(ll.taxa)} <span className="text-xs font-normal text-muted">({ll.evadidos} de {ll.n})</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Tabela>
            <p className="text-sm">
              O perfil de maior risco é <strong>Idiomas com demora</strong>, mas são só {CRUZ.idiomasLento.n} matrículas, então esse número é frágil. O sinal mais seguro é o <strong>tempo</strong>: em qualquer categoria, quem passa de {LIMIAR_DIAS} dias evade bem mais.
            </p>
          </div>
        }
        acao={
          <>
            Acompanhar cada matrícula nova até o 1º acesso e marcar como <strong>risco alto</strong> quem passa do <strong>3º dia</strong> sem acessar, com atenção extra em Idiomas.
          </>
        }
        limite="Taxas observadas, não previsões individuais. Poucos casos em alguns cruzamentos, então os números são um guia para priorizar, não uma garantia."
      />

      {/* ================= Prescritiva ================= */}
      <Analise
        Icone={Route}
        tipo="prescritiva"
        responde="O que devemos fazer?"
        cor="bg-ok text-white"
        pergunta="Que ação concreta a plataforma consegue executar, para quem ela vale e em que momento, e quantas evasões evita?"
        como={
          <>
            <p>
              Transformamos cada causa encontrada na diagnóstica em uma ação com <strong>público</strong> e <strong>momento</strong> definidos, e simulamos o ganho: se a ação aproximar o grupo-alvo da taxa de um grupo de referência (entre as matrículas encerradas), quantas evasões deixam de acontecer?
            </p>
            <p className="mt-2">Use o controle ao lado para testar cenários mais otimistas ou conservadores.</p>
          </>
        }
        resultado={<Simulador />}
        acao={
          <>
            Começar por <strong>onboarding ativo</strong>: toda matrícula nova que não acessou até o <strong>3º dia</strong> recebe e-mail + push/WhatsApp com o link da 1ª aula e meta de 15 min, repetido no 5º dia (antes de fechar a 1ª semana, quando a evasão salta). Idiomas e celular ficam para uma segunda fase. Medir a taxa de evasão do grupo-alvo em um piloto de 60 dias antes de ampliar. A recomendação completa está na{' '}
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
              ['Descritiva', 'Como está a plataforma (concluem, evadem, em andamento) e como a evasão varia por categoria?', `Priorizar ${maior.nome} na revisão de cursos; usar ${menor.nome} como benchmark.`],
              ['Diagnóstica', 'Onde a evasão é maior: categoria, dispositivo ou tempo até o 1º acesso?', 'Atacar a demora no 1º acesso; Idiomas e celular ficam como apoio.'],
              ['Preditiva', 'Que perfil de matrícula nova tem mais risco de evadir?', 'Marcar risco alto quem não acessou até o 3º dia e priorizar a lista semanal da Retenção.'],
              ['Prescritiva', 'Que ação, para quem e quando evita evasões?', 'Contato no 3º e 5º dia para quem não acessou (piloto de 60 dias).'],
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
