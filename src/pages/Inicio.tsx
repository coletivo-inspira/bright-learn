import { ArrowRight, BarChart3, CalendarClock, Database, ListChecks, Users } from 'lucide-react';
import clsx from 'clsx';
import { Badge, Card, Kpi, SectionTitle } from '../components/ui';
import { ENTREGAS, ORIENTACOES, diasAte, situacoes, textoPrazo } from '../data/entregas';
import type { Situacao } from '../data/entregas';
import { GRUPO } from '../data/grupo';
import { ROWS } from '../lib/clean';
import { resumo } from '../lib/analytics';
import { fmtData, fmtN, fmtPct } from '../lib/format';
import { href } from '../lib/router';

const SIT: Record<Situacao, { texto: string; tom: 'neutro' | 'ok' | 'accent' | 'brand' }> = {
  passou: { texto: 'Prazo passou', tom: 'neutro' },
  hoje: { texto: 'É hoje', tom: 'accent' },
  proxima: { texto: 'Próxima', tom: 'brand' },
  futura: { texto: 'Em breve', tom: 'neutro' },
};

export default function Inicio() {
  const r = resumo(ROWS);
  const sit = situacoes();
  const proxima = ENTREGAS.find((e) => sit[e.id] === 'proxima' || sit[e.id] === 'hoje');

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-10">
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-1/3 size-60 rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-3xl">
          <Badge tom="brand">Avaliação A3 · {GRUPO.disciplina}</Badge>
          <h1 className="mt-4 font-display text-3xl leading-[1.1] font-extrabold sm:text-5xl">
            Do dado à decisão: por que os alunos da BrightLearn <span className="text-brand">abandonam</span> os cursos?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Projeto de análise aplicada sobre {fmtN(r.n)} matrículas de uma plataforma de cursos online (set/2025 a jul/2026): da limpeza da
            base às 4 análises, do dashboard à recomendação final.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={href('dados')}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              <Database className="size-4" aria-hidden /> Explorar a base
            </a>
            <a
              href={href('dashboard')}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold transition hover:bg-surface-2"
            >
              <BarChart3 className="size-4 text-brand" aria-hidden /> Ver dashboard
            </a>
            <a
              href={href('entregas/1')}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold transition hover:bg-surface-2"
            >
              <ListChecks className="size-4 text-brand" aria-hidden /> Passo a passo das entregas
            </a>
          </div>
        </div>
      </section>

      {/* ---------- KPIs ---------- */}
      <section aria-label="Números principais">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            destaque
            rotulo="Taxa de evasão"
            valor={fmtPct(r.taxaEvasao)}
            dica={`${fmtN(r.evadidos)} de ${fmtN(r.n)} matrículas · ${fmtPct(r.taxaEvasaoEnc)} entre as encerradas`}
          />
          <Kpi rotulo="Taxa de conclusão" valor={fmtPct(r.taxaConclusao)} dica={`${fmtN(r.concluidos)} concluídos`} tom="ok" />
          <Kpi rotulo="Ainda em andamento" valor={fmtPct(r.taxaAndamento)} dica={`${fmtN(r.andamento)} matrículas sem desfecho`} />
          <Kpi rotulo="Dias até o 1º acesso" valor={`${fmtN(r.medDias)} (mediana)`} dica={`média ${fmtN(r.mediaDias, 1)} — puxada por casos extremos`} />
        </div>
        <p className="mt-2 text-xs text-muted">Calculado sobre os dados tratados. Veja como cada número foi obtido na aba Entregas.</p>
      </section>

      {/* ---------- Cronograma ---------- */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card as="section">
          <SectionTitle eyebrow="Cronograma" title="As entregas do trabalho">
            Cada checkpoint vale 1,0 ponto. Clique para abrir o que foi preparado.
          </SectionTitle>
          <ol className="relative space-y-2">
            {ENTREGAS.map((e) => {
              const s = SIT[sit[e.id]];
              return (
                <li key={e.id}>
                  <a
                    href={href(`entregas/${e.id}`)}
                    className={clsx(
                      'group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-surface-2 sm:p-4',
                      sit[e.id] === 'proxima' || sit[e.id] === 'hoje' ? 'border-brand/50 bg-brand-soft/40' : 'border-line',
                    )}
                  >
                    <div className="w-14 shrink-0 text-center">
                      <p className="tnum font-display text-lg leading-none font-extrabold">{fmtData(e.data).slice(0, 5)}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{textoPrazo(e.data)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {e.rotulo} · {e.titulo}
                      </p>
                      <p className="truncate text-xs text-muted">{e.etapa}</p>
                    </div>
                    <Badge tom={s.tom}>{s.texto}</Badge>
                    <ArrowRight className="hidden size-4 text-muted transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ol>
          <ul className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-muted">
            {ORIENTACOES.map((o) => (
              <li key={o.data}>
                <span className="tnum font-semibold text-ink">{fmtData(o.data).slice(0, 5)}</span> — {o.texto}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          {proxima && (
            <Card as="section" className="border-brand/40 bg-brand-soft/50">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand uppercase">
                <CalendarClock className="size-4" aria-hidden /> Próxima entrega
              </p>
              <p className="mt-2 font-display text-xl font-bold">
                {proxima.rotulo} · {fmtData(proxima.data)}
              </p>
              <p className="text-sm text-muted">
                {textoPrazo(proxima.data)} ({diasAte(proxima.data) <= 0 ? 'hoje' : `${diasAte(proxima.data)} dia(s)`})
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {proxima.trazer.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <a href={href(`entregas/${proxima.id}`)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline">
                Abrir esta entrega <ArrowRight className="size-4" aria-hidden />
              </a>
            </Card>
          )}

          <Card as="section">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand uppercase">
              <Users className="size-4" aria-hidden /> Grupo
            </p>
            <p className="mt-2 font-display text-lg font-bold">{GRUPO.nome}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {GRUPO.integrantes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              Prof. {GRUPO.professor} · {GRUPO.tema}
              <br />
              Código: <span className="tnum">{GRUPO.codigo}</span>
            </p>
            <a
              href={GRUPO.drive}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-brand-ink hover:underline"
            >
              Pasta de envio das etapas (Drive) ↗
            </a>
          </Card>
        </div>
      </section>
    </div>
  );
}
