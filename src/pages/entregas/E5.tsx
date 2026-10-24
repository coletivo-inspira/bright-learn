import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, Copy, Pause, Play, RotateCcw, Scale, ShieldAlert } from 'lucide-react';
import { Badge, Callout, Card, Kpi, SectionTitle, Tabela, td, th } from '../../components/ui';
import { GRUPO } from '../../data/grupo';
import { ALAVANCAS, DIAG, evasoesEvitadas, fmtP, novaTaxaGeral } from '../../lib/insights';
import { fmtN, fmtPct } from '../../lib/format';
import { PROBLEMAS as P } from '../../lib/clean';
import { EM_ANDAMENTO, EVASOES_ESPERADAS, LIMIAR_DIAS, MODELO } from '../../lib/model';
import { href } from '../../lib/router';
import { usePersistido } from '../../lib/storage';

/* ------------------------------------------------------------------ */
/* Recomendação                                                        */
/* ------------------------------------------------------------------ */
function Recomendacao() {
  const [on, id, mo] = ALAVANCAS;
  const g = DIAG.geral;
  const metaOn = (on.taxaAtual + on.taxaMeta) / 2;
  const metaId = (id.taxaAtual + id.taxaMeta) / 2;

  return (
    <section className="space-y-5">
      <SectionTitle eyebrow="Etapa (e)" title="Recomendação final" />

      <div className="rounded-3xl border border-ok/40 bg-ok-soft/50 p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wider text-ok uppercase">Decisão recomendada</p>
        <p className="mt-2 max-w-4xl font-display text-2xl leading-snug font-bold sm:text-3xl">
          Lançar um piloto de 60 dias de <span className="text-ok">onboarding ativo</span> (contato até o 3º dia para quem ainda não acessou) junto com uma{' '}
          <span className="text-ok">trilha flexível em Idiomas</span>, comparando com um grupo de controle antes de ampliar para toda a plataforma.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Ponto de partida" valor={fmtPct(g.taxaEvasao)} tom="bad" dica={`evasão geral · ${fmtPct(g.taxaEvasaoEnc)} entre encerradas`} />
        <Kpi rotulo={`${on.alvo}`} valor={fmtPct(on.taxaAtual)} tom="bad" dica={`contra ${fmtPct(on.taxaMeta)} · ${fmtP(on.p)}`} />
        <Kpi rotulo="Idiomas" valor={fmtPct(id.taxaAtual)} tom="bad" dica={`contra ${fmtPct(id.taxaMeta)} nas demais · ${fmtP(id.p)}`} />
        <Kpi rotulo="Em andamento" valor={`~${fmtN(EVASOES_ESPERADAS, 0)}`} dica={`de ${fmtN(EM_ANDAMENTO.length)} devem evadir (modelo, AUC ${fmtN(MODELO.auc, 2)})`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg font-bold">O que os dados sustentam</h3>
          <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed">
            <li>
              <strong>A evasão é grande:</strong> {fmtN(g.evadidos)} de {fmtN(g.n)} matrículas ({fmtPct(g.taxaEvasao)}) terminaram em abandono, cerca de 1 a cada 3, enquanto só {fmtPct(g.taxaConclusao)} chegaram ao
              fim do curso.
            </li>
            <li>
              <strong>A primeira semana importa:</strong> quem demora {LIMIAR_DIAS}+ dias para o 1º acesso evade {fmtPct(on.taxaAtual)} contra {fmtPct(on.taxaMeta)}; até 7 dias a taxa é praticamente plana.
            </li>
            <li>
              <strong>Idiomas concentra o problema:</strong> {fmtPct(id.taxaAtual)} de evasão, e {fmtPct(DIAG.motivos.idiomasFaltaDeTempo / DIAG.motivos.idiomasInformados, 0)} dos evadidos de Idiomas que informaram motivo citam falta de tempo.
            </li>
            <li>
              <strong>Dá para priorizar:</strong> o modelo aponta as matrículas em andamento de maior risco para o contato começar por elas.
            </li>
          </ol>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-bold">Impacto esperado e como medir</h3>
          <Tabela className="mt-3">
            <thead>
              <tr>
                <th className={th}>Ação</th>
                <th className={`${th} text-right`}>Evasões evitadas (30%–60% da diferença)</th>
                <th className={`${th} text-right`}>Meta do piloto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>
                  Onboarding ativo
                  <p className="text-xs text-muted">{fmtN(on.n)} matrículas-alvo</p>
                </td>
                <td className={`${td} tnum text-right font-semibold`}>
                  {fmtN(evasoesEvitadas(on, 0.3), 0)} a {fmtN(evasoesEvitadas(on, 0.6), 0)}
                  <p className="text-xs font-normal text-muted">
                    evasão geral → {fmtPct(novaTaxaGeral(on, 0.6))} a {fmtPct(novaTaxaGeral(on, 0.3))}
                  </p>
                </td>
                <td className={`${td} tnum text-right`}>
                  {fmtPct(on.taxaAtual, 0)} → ≤ {fmtPct(metaOn, 0)}
                </td>
              </tr>
              <tr>
                <td className={td}>
                  Trilha flexível em Idiomas
                  <p className="text-xs text-muted">{fmtN(id.n)} matrículas-alvo</p>
                </td>
                <td className={`${td} tnum text-right font-semibold`}>
                  {fmtN(evasoesEvitadas(id, 0.3), 0)} a {fmtN(evasoesEvitadas(id, 0.6), 0)}
                  <p className="text-xs font-normal text-muted">
                    evasão geral → {fmtPct(novaTaxaGeral(id, 0.6))} a {fmtPct(novaTaxaGeral(id, 0.3))}
                  </p>
                </td>
                <td className={`${td} tnum text-right`}>
                  {fmtPct(id.taxaAtual, 0)} → ≤ {fmtPct(metaId, 0)}
                </td>
              </tr>
            </tbody>
          </Tabela>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Meta do piloto = fechar metade da diferença para o grupo de referência. Os grupos se sobrepõem, então os ganhos não se somam. Deixamos a experiência mobile ({fmtN(mo.n)} matrículas, esforço{' '}
            {mo.esforco.toLowerCase()}, evidência {mo.evidencia.toLowerCase()}) para uma segunda fase.
          </p>
          <p className="mt-3 text-sm">
            <strong>Como medir:</strong> sortear metade dos alunos-alvo para receber a ação e manter a outra metade como controle; comparar a taxa de evasão dos dois grupos ao fim de 60 dias.
          </p>
        </Card>
      </div>

      <Card className="border-accent/40">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <ShieldAlert className="size-5 text-accent" aria-hidden /> Limitações da base e do recorte
        </h3>
        <ul className="mt-3 grid gap-x-8 gap-y-2.5 text-sm leading-relaxed md:grid-cols-2">
          {[
            ['Desfecho incompleto', `${fmtN(g.andamento)} matrículas (${fmtPct(g.taxaAndamento)}) ainda estão em andamento; a evasão final pode ser maior que a observada.`],
            ['Unidade é a matrícula', 'Um mesmo aluno pode ter várias matrículas; a base não traz identificador do aluno.'],
            ['Associação não é causa', 'As diferenças entre grupos podem ter outras causas que a base não registra (motivação, preço, qualidade do curso).'],
            ['Modelo modesto', `AUC ${fmtN(MODELO.auc, 2)}: serve para priorizar, não para decidir sobre um aluno.`],
            ['Dados tratados', `Substituímos ${P.pct.linhas} valores de % e ${P.nota.falhaRegistro} notas por medianas; o efeito nos indicadores é pequeno, mas existe.`],
            ['Motivo não informado', `${fmtPct(P.motivo.naoInformado / P.motivo.evadidos, 0)} dos evadidos não registraram motivo; a causa real desses casos é desconhecida.`],
            ['Sem custos nem receita', 'A base não traz preço nem custo, então não calculamos retorno financeiro (ROI) das ações.'],
            ['Base fictícia', 'Os dados foram preparados para a atividade; conclusões sobre empresas reais exigiriam dados reais.'],
          ].map(([t, d]) => (
            <li key={t}>
              <strong>{t}.</strong> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Estrutura do documento                                              */
/* ------------------------------------------------------------------ */
const SECOES = [
  { s: 'Capa e identificação do grupo', c: 'Nome do grupo, integrantes, disciplina, professor, data', pg: 'não conta', onde: '—' },
  { s: '1. Contexto e pergunta de negócio', c: 'Por que a base interessa, quem decide, pergunta central, KPI', pg: 0.75, onde: 'Entrega 1' },
  { s: '2. Preparo e limpeza dos dados', c: '5 problemas, tratamento, média/mediana/moda justificada, antes × depois', pg: 1.25, onde: 'Entrega 2' },
  { s: '3. As 4 perguntas de análise', c: 'Pergunta + ação/decisão de cada tipo', pg: 1.5, onde: 'Entrega 3' },
  { s: '4. Dashboard', c: 'Prints dos gráficos + KPI, com pergunta → gráfico → leitura', pg: 1.5, onde: 'Entrega 4 e Dashboard' },
  { s: '5. Recomendação final', c: 'Decisão, evidências, impacto esperado e limitações', pg: 1, onde: 'Entrega 5' },
  { s: 'Referências', c: 'Base de dados utilizada e materiais consultados', pg: 'não conta', onde: '—' },
] as const;

const REGRAS = ['PDF em A4', 'Fonte Arial ou Times New Roman, tamanho 12', 'Espaçamento 1,5', 'Margens de 2,5 cm', 'Até 6 páginas (sem contar capa e referências)', 'Registro de onde a IA foi usada'];

const IA_PADRAO = `Uso de IA neste trabalho: utilizamos a ferramenta Claude (Anthropic) como apoio para (1) montar o site que apresenta a base e as análises, (2) sugerir o método de padronização das categorias e as fórmulas da taxa de evasão, da mediana por status e da regressão logística, e (3) revisar a redação. Todos os números foram conferidos pelo grupo contra os totais da base (${fmtN(DIAG.geral.n)} matrículas; ${fmtN(DIAG.geral.evadidos)} evadidos = ${fmtPct(DIAG.geral.taxaEvasao)}; ${fmtN(DIAG.geral.concluidos)} concluídos = ${fmtPct(DIAG.geral.taxaConclusao)}) e cada integrante consegue explicar como cada cálculo foi feito.`;

function RegistroIA() {
  const [texto, setTexto] = usePersistido('bl-ia', IA_PADRAO);
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* clipboard indisponível */
    }
  };
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Registro do uso de IA (rascunho para o documento)</h3>
        <button type="button" onClick={copiar} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2">
          {copiado ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">O enunciado exige registrar onde a IA foi usada. Ajuste o texto ao que o grupo realmente fez; ele fica salvo neste navegador.</p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        className="mt-3 w-full rounded-xl border border-line bg-surface p-3 text-sm leading-relaxed"
        aria-label="Texto do registro de uso de IA"
      />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Cronômetro do ensaio                                                */
/* ------------------------------------------------------------------ */
const ROTEIRO = [
  { parte: 'Abertura e contexto', min: 1.5 },
  { parte: 'Preparo e limpeza', min: 2 },
  { parte: 'As 4 análises', min: 3 },
  { parte: 'Dashboard ao vivo', min: 3 },
  { parte: 'Recomendação e limitações', min: 2 },
];

const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function Cronometro() {
  const [plano, setPlano] = usePersistido<number[]>('bl-plano', ROTEIRO.map((r) => r.min));
  const [ms, setMs] = useState(0);
  const [rodando, setRodando] = useState(false);
  const msRef = useRef(0);

  useEffect(() => {
    if (!rodando) return;
    const base = performance.now() - msRef.current;
    const id = window.setInterval(() => {
      const v = performance.now() - base;
      msRef.current = v;
      setMs(v);
    }, 200);
    return () => window.clearInterval(id);
  }, [rodando]);

  const zerar = () => {
    setRodando(false);
    msRef.current = 0;
    setMs(0);
  };

  const total = plano.reduce((s, v) => s + v, 0);
  const minutos = ms / 60000;
  let acum = 0;
  let atual = ROTEIRO.length - 1;
  for (let i = 0; i < ROTEIRO.length; i++) {
    acum += plano[i] ?? 0;
    if (minutos < acum) {
      atual = i;
      break;
    }
  }
  const zona = minutos < 5 ? 'curto' : minutos <= 15 ? 'ok' : 'estourou';
  const quem = (i: number) => GRUPO.integrantes[i % GRUPO.integrantes.length];

  return (
    <Card>
      <h3 className="font-display text-lg font-bold">Ensaio cronometrado</h3>
      <p className="mt-1 text-sm text-muted">
        A apresentação tem de durar entre 5 e 15 minutos, com todos falando. Divida as partes, ajuste os minutos e ensaie.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface-2 px-8 py-6">
          <p
            className={clsx(
              'tnum font-display text-6xl font-extrabold',
              zona === 'ok' ? 'text-ok' : zona === 'estourou' ? 'text-bad' : 'text-ink',
            )}
            aria-live="off"
          >
            {mmss(ms)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {zona === 'curto' ? 'abaixo de 5 min (ainda)' : zona === 'ok' ? 'dentro do tempo (5 a 15 min)' : 'passou de 15 min!'}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setRodando((r) => !r)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              {rodando ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              {rodando ? 'Pausar' : ms > 0 ? 'Continuar' : 'Iniciar'}
            </button>
            <button type="button" onClick={zerar} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-surface">
              <RotateCcw className="size-4" aria-hidden /> Zerar
            </button>
          </div>
        </div>

        <div>
          <ol className="space-y-2">
            {ROTEIRO.map((p, i) => {
              const ativo = (rodando || ms > 0) && i === atual && minutos < total;
              return (
                <li
                  key={p.parte}
                  className={clsx('flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm', ativo ? 'border-brand bg-brand-soft/60' : 'border-line')}
                  aria-current={ativo ? 'step' : undefined}
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-ink">{i + 1}</span>
                  <span className="min-w-[8rem] flex-1 font-semibold">{p.parte}</span>
                  <span className="text-muted">{quem(i)}</span>
                  <label className="flex items-center gap-1 text-xs text-muted">
                    <input
                      type="number"
                      min={0.5}
                      max={6}
                      step={0.5}
                      value={plano[i]}
                      onChange={(e) =>
                        setPlano((a) => {
                          const n = [...a];
                          n[i] = Math.max(0.5, Number(e.target.value) || 0.5);
                          return n;
                        })
                      }
                      className="tnum w-16 rounded-md border border-line bg-surface px-2 py-1 text-right text-ink"
                      aria-label={`Minutos para ${p.parte}`}
                    />
                    min
                  </label>
                </li>
              );
            })}
          </ol>
          <p className={clsx('mt-3 text-sm', total < 5 || total > 15 ? 'font-semibold text-bad' : 'text-muted')}>
            Tempo planejado: <span className="tnum font-semibold">{fmtN(total, 1)} min</span> {total < 5 ? '(abaixo do mínimo de 5 min)' : total > 15 ? '(acima do máximo de 15 min)' : '(dentro da regra de 5 a 15 min)'}. Os nomes seguem a ordem de{' '}
            <code className="rounded bg-surface-2 px-1 text-xs">src/data/grupo.ts</code>.
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
export default function E5() {
  return (
    <>
      <Callout tipo="info" titulo="O que esta entrega reúne">
        Dashboard funcional (<a className="font-semibold text-brand-ink underline" href={href('dashboard')}>aba Dashboard</a>), recomendação final, estrutura do documento escrito e ensaio cronometrado da apresentação.
      </Callout>

      <Recomendacao />

      <section className="space-y-5">
        <SectionTitle eyebrow="Documento escrito" title="Estrutura sugerida (máx. 6 páginas)">
          Cada seção do PDF corresponde a uma aba deste site, então o conteúdo já está pronto para ser adaptado.
        </SectionTitle>
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Tabela>
            <thead>
              <tr>
                <th className={th}>Seção</th>
                <th className={th}>Conteúdo</th>
                <th className={`${th} text-right`}>Páginas</th>
                <th className={th}>Fonte no site</th>
              </tr>
            </thead>
            <tbody>
              {SECOES.map((s) => (
                <tr key={s.s}>
                  <td className={`${td} font-semibold`}>{s.s}</td>
                  <td className={`${td} text-muted`}>{s.c}</td>
                  <td className={`${td} tnum text-right`}>{typeof s.pg === 'number' ? fmtN(s.pg, 2) : <Badge>{s.pg}</Badge>}</td>
                  <td className={td}>{s.onde}</td>
                </tr>
              ))}
              <tr>
                <td className={`${td} font-bold`} colSpan={2}>
                  Total do corpo do texto
                </td>
                <td className={`${td} tnum text-right font-bold`}>{fmtN(SECOES.reduce((s, x) => s + (typeof x.pg === 'number' ? x.pg : 0), 0), 2)}</td>
                <td className={td} />
              </tr>
            </tbody>
          </Tabela>
          <Card>
            <h3 className="flex items-center gap-2 font-display text-base font-bold">
              <Scale className="size-4 text-brand" aria-hidden /> Regras de formatação
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {REGRAS.map((r) => (
                <li key={r} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden /> {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <RegistroIA />
      </section>

      <section>
        <SectionTitle eyebrow="Apresentação" title="Roteiro e ensaio" />
        <Cronometro />
      </section>
    </>
  );
}
