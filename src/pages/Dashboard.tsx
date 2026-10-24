import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ExternalLink, RotateCcw } from 'lucide-react';
import { Chips } from '../components/Chips';
import { GCategoria, GDias, GDispositivo, GMes, GMotivos } from '../components/GraficosBase';
import { Callout, Card, Kpi } from '../components/ui';
import { GRUPO } from '../data/grupo';
import { MESES_DISPONIVEIS, ROWS } from '../lib/clean';
import { motivos, porFaixaDias, porGrupo, resumo } from '../lib/analytics';
import type { Base } from '../lib/analytics';
import { fmtMesLongo, fmtN, fmtPct } from '../lib/format';
import { CATEGORIAS, DISPOSITIVOS } from '../lib/types';

const selectCls = 'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal tracking-normal text-ink normal-case';

export default function Dashboard() {
  const [cats, setCats] = useState<string[]>([]);
  const [devs, setDevs] = useState<string[]>([]);
  const [de, setDe] = useState(MESES_DISPONIVEIS[0]);
  const [ate, setAte] = useState(MESES_DISPONIVEIS[MESES_DISPONIVEIS.length - 1]);
  const [base, setBase] = useState<Base>('todas');

  const rows = useMemo(
    () =>
      ROWS.filter(
        (r) => (!cats.length || cats.includes(r.categoria)) && (!devs.length || devs.includes(r.dispositivo)) && r.mes >= de && r.mes <= ate,
      ),
    [cats, devs, de, ate],
  );
  const r = useMemo(() => resumo(rows), [rows]);
  const filtrado = cats.length > 0 || devs.length > 0 || de !== MESES_DISPONIVEIS[0] || ate !== MESES_DISPONIVEIS[MESES_DISPONIVEIS.length - 1];

  const limpar = () => {
    setCats([]);
    setDevs([]);
    setDe(MESES_DISPONIVEIS[0]);
    setAte(MESES_DISPONIVEIS[MESES_DISPONIVEIS.length - 1]);
  };

  /* ---------- leitura rápida (gerada a partir do filtro atual) ---------- */
  const leitura = useMemo(() => {
    const itens: string[] = [];
    const grupos = porGrupo(rows, (x) => x.categoria, CATEGORIAS, base).filter((g) => g.n >= 20);
    if (grupos.length >= 2) {
      const ord = [...grupos].sort((a, b) => b.taxa - a.taxa);
      itens.push(
        `${ord[0].nome} tem a maior evasão (${fmtPct(ord[0].taxa)}) e ${ord[ord.length - 1].nome} a menor (${fmtPct(ord[ord.length - 1].taxa)}).`,
      );
    }
    const faixas = porFaixaDias(rows, base);
    const tarde = faixas.find((f) => f.nome === '8+ dias');
    const cedo = faixas.filter((f) => f.nome !== '8+ dias');
    const nCedo = cedo.reduce((s, f) => s + f.n, 0);
    if (tarde && tarde.n >= 15 && nCedo > 0) {
      const evCedo = cedo.reduce((s, f) => s + f.evadidos, 0);
      const concCedo = cedo.reduce((s, f) => s + f.concluidos, 0);
      const taxaCedo = base === 'todas' ? evCedo / nCedo : evCedo / (evCedo + concCedo);
      itens.push(`Quem leva 8+ dias para o 1º acesso evade ${fmtPct(tarde.taxa)}, contra ${fmtPct(taxaCedo)} de quem começa em até 7 dias.`);
    }
    const m = motivos(rows).filter((x) => x.nome !== 'Não informado');
    const informados = m.reduce((s, x) => s + x.n, 0);
    if (informados >= 10) itens.push(`Entre os motivos informados, "${m[0].nome}" lidera com ${fmtPct(m[0].n / informados)}.`);
    return itens;
  }, [rows, base]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wider text-brand uppercase">Dashboard</p>
          <h1 className="font-display text-3xl font-extrabold">Evasão e conclusão na BrightLearn</h1>
          <p className="mt-2 max-w-3xl text-muted">
            Use os filtros para recortar a base: KPIs e gráficos se atualizam juntos. Cada gráfico indica a pergunta que responde e por que aquele tipo foi escolhido.
          </p>
        </div>
        {GRUPO.dashboardExterno && (
          <a href={GRUPO.dashboardExterno} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-surface-2">
            <ExternalLink className="size-4" aria-hidden /> Versão no Looker Studio / Sheets
          </a>
        )}
      </div>

      {/* ---------- Filtros ---------- */}
      <Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
          <Chips rotulo="Categoria" opcoes={CATEGORIAS} ativos={cats} onChange={setCats} />
          <Chips rotulo="Dispositivo" opcoes={DISPOSITIVOS} ativos={devs} onChange={setDevs} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold tracking-wide text-muted uppercase">
              De
              <select className={selectCls} value={de} onChange={(e) => { setDe(e.target.value); if (e.target.value > ate) setAte(e.target.value); }}>
                {MESES_DISPONIVEIS.map((m) => (
                  <option key={m} value={m}>
                    {fmtMesLongo(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold tracking-wide text-muted uppercase">
              Até
              <select className={selectCls} value={ate} onChange={(e) => { setAte(e.target.value); if (e.target.value < de) setDe(e.target.value); }}>
                {MESES_DISPONIVEIS.map((m) => (
                  <option key={m} value={m}>
                    {fmtMesLongo(m)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">Base da taxa de evasão</legend>
            <div className="inline-flex rounded-xl border border-line bg-surface-2 p-1 text-sm">
              {(
                [
                  ['todas', 'Todas as matrículas'],
                  ['encerradas', 'Só encerradas'],
                ] as const
              ).map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={base === v}
                  onClick={() => setBase(v)}
                  className={clsx('rounded-lg px-3 py-1.5 font-medium whitespace-nowrap', base === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm text-muted">
          <p>
            <span className="tnum font-semibold text-ink">{fmtN(rows.length)}</span> de {fmtN(ROWS.length)} matrículas no recorte.{' '}
            {base === 'todas' ? 'Taxa = evadidos ÷ todas as matrículas.' : 'Taxa = evadidos ÷ (concluídos + evadidos): ignora quem ainda não tem desfecho.'}
          </p>
          {filtrado && (
            <button type="button" onClick={limpar} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-medium text-ink hover:bg-surface-2">
              <RotateCcw className="size-3.5" aria-hidden /> Limpar filtros
            </button>
          )}
        </div>
      </Card>

      {rows.length === 0 ? (
        <Callout tipo="aviso" titulo="Nenhuma matrícula neste recorte">
          Ajuste os filtros para ver os gráficos.
        </Callout>
      ) : (
        <>
          {/* ---------- KPIs ---------- */}
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <Kpi
                destaque
                rotulo="KPI · Taxa de evasão"
                valor={fmtPct(base === 'todas' ? r.taxaEvasao : r.taxaEvasaoEnc)}
                dica={`${fmtN(r.evadidos)} evadidos de ${fmtN(base === 'todas' ? r.n : r.evadidos + r.concluidos)}`}
              />
            </div>
            <Kpi rotulo="Taxa de conclusão" valor={fmtPct(r.taxaConclusao)} tom="ok" dica={`${fmtN(r.concluidos)} concluídos`} />
            <Kpi rotulo="Em andamento" valor={fmtN(r.andamento)} dica={`${fmtPct(r.taxaAndamento)} sem desfecho`} />
            <Kpi rotulo="Dias p/ 1º acesso" valor={fmtN(r.medDias, 0)} dica={`mediana · média ${fmtN(r.mediaDias, 1)}`} />
            <Kpi rotulo="Nota final" valor={fmtN(r.medNota, 1)} dica={`mediana · média ${fmtN(r.mediaNota, 2)}`} />
          </section>

          {leitura.length > 0 && (
            <Callout tipo="dica" titulo="Leitura rápida deste recorte">
              <ul className="list-disc space-y-1 pl-5">
                {leitura.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Callout>
          )}

          {/* ---------- Gráficos ---------- */}
          <div className="grid gap-5 lg:grid-cols-2">
            <GCategoria rows={rows} base={base} />
            <GDias rows={rows} base={base} />
            <GMotivos rows={rows} />
            <GDispositivo rows={rows} />
          </div>
          <GMes rows={rows} base={base} />

          <p className="text-xs text-muted">
            Correlação não é causalidade: os gráficos mostram associações na base, e não provam que mudar uma variável muda o desfecho.
          </p>
        </>
      )}
    </div>
  );
}
