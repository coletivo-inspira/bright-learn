import { useMemo } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { Badge, Card } from '../components/ui';
import { ENTREGAS, situacoes, textoPrazo } from '../data/entregas';
import type { Entrega, EntregaId, Situacao } from '../data/entregas';
import { fmtData } from '../lib/format';
import { href } from '../lib/router';
import { usePersistido } from '../lib/storage';
import E1 from './entregas/E1';
import E2 from './entregas/E2';
import E3 from './entregas/E3';
import E4 from './entregas/E4';
import E5 from './entregas/E5';
import EFinal from './entregas/EFinal';

const CONTEUDO: Record<EntregaId, () => React.JSX.Element> = { '1': E1, '2': E2, '3': E3, '4': E4, '5': E5, final: EFinal };

const PONTO: Record<Situacao, string> = {
  passou: 'bg-muted/50',
  hoje: 'bg-accent',
  proxima: 'bg-brand',
  futura: 'bg-line',
};

function Checklist({ e }: { e: Entrega }) {
  const [marcados, setMarcados] = usePersistido<boolean[]>(`bl-check-${e.id}`, []);
  const feitos = e.trazer.filter((_, i) => marcados[i]).length;
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">O que o professor espera</p>
        <p className="tnum text-xs text-muted">
          {feitos}/{e.trazer.length} conferidos
        </p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {e.trazer.map((t, i) => (
          <li key={t}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={!!marcados[i]}
                onChange={(ev) =>
                  setMarcados((a) => {
                    const novo = [...a];
                    novo[i] = ev.target.checked;
                    return novo;
                  })
                }
                className="mt-0.5 size-4 accent-[var(--brand)]"
              />
              <span className={clsx(marcados[i] && 'text-muted line-through')}>{t}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${(feitos / e.trazer.length) * 100}%` }} />
      </div>
    </div>
  );
}

export default function Entregas({ id }: { id: string | null }) {
  const idx = Math.max(0, ENTREGAS.findIndex((e) => e.id === id));
  const atual = ENTREGAS[idx];
  const sit = useMemo(() => situacoes(), []);
  const Conteudo = CONTEUDO[atual.id];
  const anterior = ENTREGAS[idx - 1];
  const proxima = ENTREGAS[idx + 1];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-wider text-brand uppercase">Passo a passo do trabalho</p>
        <h1 className="font-display text-3xl font-extrabold">Entregas</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Uma aba por checkpoint do cronograma. Cada uma mostra o que o professor pede naquela data e o que o grupo construiu, com os números
          calculados direto da base.
        </p>
      </div>

      {/* ---------- Abas ---------- */}
      <div role="tablist" aria-label="Entregas" className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {ENTREGAS.map((e) => {
          const ativo = e.id === atual.id;
          return (
            <a
              key={e.id}
              role="tab"
              aria-selected={ativo}
              href={href(`entregas/${e.id}`)}
              className={clsx(
                'min-w-[7.5rem] shrink-0 rounded-xl border px-4 py-2.5 transition-colors',
                ativo ? 'border-brand bg-brand text-white shadow-sm' : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={clsx('size-2 rounded-full', ativo ? 'bg-white' : PONTO[sit[e.id]])} aria-hidden />
                {e.rotulo}
              </span>
              <span className={clsx('tnum mt-0.5 block text-xs', ativo ? 'text-white/80' : 'text-muted')}>{fmtData(e.data).slice(0, 5)}</span>
            </a>
          );
        })}
      </div>

      {/* ---------- Cabeçalho da entrega ---------- */}
      <Card as="section" className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tom="brand">{atual.etapa}</Badge>
            <Badge tom={sit[atual.id] === 'proxima' || sit[atual.id] === 'hoje' ? 'accent' : 'neutro'}>
              <CalendarDays className="size-3" aria-hidden />
              {fmtData(atual.data)} · {textoPrazo(atual.data)}
            </Badge>
            {atual.pontos != null && <Badge tom="ok">{atual.pontos.toFixed(1).replace('.', ',')} pt</Badge>}
          </div>
          <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
            {atual.rotulo} · {atual.titulo}
          </h2>
        </div>
        <Checklist key={atual.id} e={atual} />
      </Card>

      {/* ---------- Conteúdo ---------- */}
      <div key={atual.id} className="space-y-8">
        <Conteudo />
      </div>

      {/* ---------- Anterior / próxima ---------- */}
      <nav aria-label="Navegar entre entregas" className="flex items-center justify-between gap-3 border-t border-line pt-5">
        {anterior ? (
          <a href={href(`entregas/${anterior.id}`)} className="group flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm hover:bg-surface-2">
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
            <span>
              <span className="block text-xs text-muted">Anterior</span>
              <span className="font-semibold">{anterior.rotulo}</span>
            </span>
          </a>
        ) : (
          <span />
        )}
        {proxima && (
          <a href={href(`entregas/${proxima.id}`)} className="group flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-right text-sm hover:bg-surface-2">
            <span>
              <span className="block text-xs text-muted">Próxima</span>
              <span className="font-semibold">{proxima.rotulo}</span>
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </a>
        )}
      </nav>
    </div>
  );
}
