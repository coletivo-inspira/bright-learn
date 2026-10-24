import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Search,
  X,
} from 'lucide-react';
import dicionario from '../data/dicionario.json';
import { MESES_DISPONIVEIS, PCT_MEDIANA_POR_STATUS, NOTA_MEDIANA, RAW, ROWS, DIAS_CERCA } from '../lib/clean';
import { resumo } from '../lib/analytics';
import { baixarCsv } from '../lib/csv';
import { fmtData, fmtMesLongo, fmtN, fmtPct } from '../lib/format';
import { mean, median, mode } from '../lib/stats';
import { usePersistido } from '../lib/storage';
import { CATEGORIAS, DISPOSITIVOS, MOTIVOS, STATUSES } from '../lib/types';
import type { AlertaKey, Row } from '../lib/types';
import { Badge, Callout, Card, Kpi, StatusBadge, Tabela, td, th } from '../components/ui';
import { Chips } from '../components/Chips';

/* ------------------------------------------------------------------ */
/* Texto de busca (sem acentos, minúsculo)                              */
/* ------------------------------------------------------------------ */
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const INDICE = new Map<string, string>(
  ROWS.map((r) => [
    r.id,
    norm(
      [
        r.id,
        r.data,
        fmtData(r.data),
        r.categoria,
        r.categoriaOriginal,
        r.dispositivo,
        r.status,
        r.motivo ?? '',
        `${r.dias} dias`,
        `${r.pct}%`,
        r.nota ?? '',
      ].join(' '),
    ),
  ]),
);

const ALERTAS: { chave: AlertaKey; curto: string; rotulo: string; explica: string }[] = [
  { chave: 'categoria', curto: 'Cat.', rotulo: 'Categoria padronizada', explica: 'A grafia da categoria era diferente (maiúsculas, acento ou espaço) e foi padronizada.' },
  { chave: 'pct', curto: '% >100', rotulo: '% concluído corrigido', explica: 'Percentual acima de 100% (impossível) foi trocado pela mediana do mesmo status.' },
  { chave: 'nota', curto: 'Nota', rotulo: 'Nota imputada', explica: 'Aluno concluído sem nota registrada: recebeu a mediana das notas dos concluídos.' },
  { chave: 'outlierDias', curto: 'Dias↑', rotulo: 'Dias até 1º acesso atípico', explica: 'Demorou mais que a cerca de Tukey (Q3 + 1,5·IQR) para acessar. Mantido: é comportamento real.' },
  { chave: 'motivoNI', curto: 'Motivo?', rotulo: 'Motivo não informado', explica: 'Evadiu sem registrar o motivo. Mantido como categoria própria.' },
];

type Chave = 'id' | 'data' | 'categoria' | 'dispositivo' | 'pct' | 'nota' | 'dias' | 'status' | 'motivo';
type Visao = 'tratada' | 'bruta';

const COLUNAS: { chave: Chave; titulo: string; num?: boolean }[] = [
  { chave: 'id', titulo: 'ID' },
  { chave: 'data', titulo: 'Matrícula' },
  { chave: 'categoria', titulo: 'Categoria' },
  { chave: 'dispositivo', titulo: 'Dispositivo' },
  { chave: 'pct', titulo: '% concluído', num: true },
  { chave: 'nota', titulo: 'Nota final', num: true },
  { chave: 'dias', titulo: 'Dias p/ 1º acesso', num: true },
  { chave: 'status', titulo: 'Status' },
  { chave: 'motivo', titulo: 'Motivo da evasão' },
];

function valorOrdem(r: Row, k: Chave, visao: Visao): string | number | null {
  switch (k) {
    case 'categoria':
      return visao === 'bruta' ? r.categoriaOriginal : r.categoria;
    case 'pct':
      return visao === 'bruta' ? r.pctOriginal : r.pct;
    case 'nota':
      return visao === 'bruta' ? r.notaOriginal : r.nota;
    default:
      return r[k];
  }
}

/** Mostra espaços nas pontas como "␣" para o problema ficar visível. */
const visivel = (s: string) => s.replace(/^ +| +$/g, (m) => '␣'.repeat(m.length));

/* ------------------------------------------------------------------ */
/* Filtros                                                             */
/* ------------------------------------------------------------------ */
interface Filtros {
  q: string;
  cats: string[];
  devs: string[];
  sts: string[];
  motivo: string;
  de: string;
  ate: string;
  alerta: '' | AlertaKey;
  diasMin: number;
  ordem: Chave;
  dir: 'asc' | 'desc';
  pagina: number;
  tamanho: number;
}

const INICIAL: Filtros = {
  q: '',
  cats: [],
  devs: [],
  sts: [],
  motivo: '',
  de: MESES_DISPONIVEIS[0],
  ate: MESES_DISPONIVEIS[MESES_DISPONIVEIS.length - 1],
  alerta: '',
  diasMin: 0,
  ordem: 'id',
  dir: 'asc',
  pagina: 0,
  tamanho: 25,
};

const DIAS_MAX = Math.max(...ROWS.map((r) => r.dias));

const selectCls = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm';

/* ------------------------------------------------------------------ */
/* Aba: tabela                                                         */
/* ------------------------------------------------------------------ */
function AbaTabela() {
  const [f, setF] = useState<Filtros>(INICIAL);
  const [visao, setVisao] = usePersistido<Visao>('bl-visao', 'tratada');
  const [detalhe, setDetalhe] = useState<Row | null>(null);
  const qDiferida = useDeferredValue(f.q);

  const atualiza = (p: Partial<Filtros>) => setF((a) => ({ ...a, ...p, pagina: 'pagina' in p ? (p.pagina as number) : 0 }));

  const filtradas = useMemo(() => {
    const termos = norm(qDiferida).split(/\s+/).filter(Boolean);
    const lista = ROWS.filter((r) => {
      if (f.cats.length && !f.cats.includes(r.categoria)) return false;
      if (f.devs.length && !f.devs.includes(r.dispositivo)) return false;
      if (f.sts.length && !f.sts.includes(r.status)) return false;
      if (f.motivo && r.motivo !== f.motivo) return false;
      if (r.mes < f.de || r.mes > f.ate) return false;
      if (f.alerta && !r.flags[f.alerta]) return false;
      if (r.dias < f.diasMin) return false;
      if (termos.length) {
        const t = INDICE.get(r.id) ?? '';
        if (!termos.every((x) => t.includes(x))) return false;
      }
      return true;
    });
    const sinal = f.dir === 'asc' ? 1 : -1;
    return lista.sort((a, b) => {
      const va = valorOrdem(a, f.ordem, visao);
      const vb = valorOrdem(b, f.ordem, visao);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // vazios sempre no fim
      if (vb == null) return -1;
      if (va < vb) return -sinal;
      if (va > vb) return sinal;
      return a.id < b.id ? -1 : 1;
    });
  }, [f.cats, f.devs, f.sts, f.motivo, f.de, f.ate, f.alerta, f.diasMin, f.ordem, f.dir, qDiferida, visao]);

  const r = useMemo(() => resumo(filtradas), [filtradas]);
  const paginas = Math.max(1, Math.ceil(filtradas.length / f.tamanho));
  const pagina = Math.min(f.pagina, paginas - 1);
  const visiveis = filtradas.slice(pagina * f.tamanho, (pagina + 1) * f.tamanho);

  const nFiltros =
    f.cats.length +
    f.devs.length +
    f.sts.length +
    (f.motivo ? 1 : 0) +
    (f.alerta ? 1 : 0) +
    (f.diasMin > 0 ? 1 : 0) +
    (f.de !== INICIAL.de || f.ate !== INICIAL.ate ? 1 : 0) +
    (f.q.trim() ? 1 : 0);

  const ordenar = (k: Chave) =>
    atualiza(f.ordem === k ? { dir: f.dir === 'asc' ? 'desc' : 'asc' } : { ordem: k, dir: 'asc' });

  const exportar = () =>
    baixarCsv(
      `brightlearn_${visao}_${filtradas.length}linhas.csv`,
      ['ID_Matricula', 'Data_Matricula', 'Categoria_Curso', 'Dispositivo_Principal', 'Pct_Concluido', 'Nota_Final', 'Dias_Ate_Primeiro_Acesso', 'Status', 'Motivo_Evasao'],
      filtradas.map((x) => [
        x.id,
        x.data,
        visao === 'bruta' ? x.categoriaOriginal : x.categoria,
        x.dispositivo,
        visao === 'bruta' ? x.pctOriginal : x.pct,
        visao === 'bruta' ? x.notaOriginal : x.nota,
        x.dias,
        x.status,
        x.motivo,
      ]),
    );

  return (
    <div className="space-y-5">
      {/* ---------- Busca e filtros ---------- */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar na base</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={f.q}
              onChange={(e) => atualiza({ q: e.target.value })}
              placeholder="Buscar por ID, categoria, status, motivo, data… (ex.: idiomas evadido celular)"
              className="w-full rounded-xl border border-line bg-surface py-2.5 pr-10 pl-9 text-sm placeholder:text-muted/70"
            />
            {f.q && (
              <button
                type="button"
                onClick={() => atualiza({ q: '' })}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-2"
                aria-label="Limpar busca"
              >
                <X className="size-4" />
              </button>
            )}
          </label>

          <div role="group" aria-label="Visão dos dados" className="inline-flex rounded-xl border border-line bg-surface-2 p-1 text-sm">
            {(['tratada', 'bruta'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={visao === v}
                onClick={() => setVisao(v)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 font-medium transition-colors',
                  visao === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
                )}
              >
                {v === 'tratada' ? 'Dados tratados' : 'Dados brutos'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Chips rotulo="Categoria" opcoes={CATEGORIAS} ativos={f.cats} onChange={(v) => atualiza({ cats: v })} />
          <Chips rotulo="Dispositivo" opcoes={DISPOSITIVOS} ativos={f.devs} onChange={(v) => atualiza({ devs: v })} />
          <Chips rotulo="Status" opcoes={STATUSES} ativos={f.sts} onChange={(v) => atualiza({ sts: v })} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-semibold tracking-wide text-muted uppercase">
            Motivo da evasão
            <select className={clsx(selectCls, 'mt-1.5 font-normal tracking-normal text-ink normal-case')} value={f.motivo} onChange={(e) => atualiza({ motivo: e.target.value })}>
              <option value="">Todos</option>
              {MOTIVOS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold tracking-wide text-muted uppercase">
            Matrícula de
            <select className={clsx(selectCls, 'mt-1.5 font-normal tracking-normal text-ink normal-case')} value={f.de} onChange={(e) => atualiza({ de: e.target.value, ate: e.target.value > f.ate ? e.target.value : f.ate })}>
              {MESES_DISPONIVEIS.map((m) => (
                <option key={m} value={m}>
                  {fmtMesLongo(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold tracking-wide text-muted uppercase">
            até
            <select className={clsx(selectCls, 'mt-1.5 font-normal tracking-normal text-ink normal-case')} value={f.ate} onChange={(e) => atualiza({ ate: e.target.value, de: e.target.value < f.de ? e.target.value : f.de })}>
              {MESES_DISPONIVEIS.map((m) => (
                <option key={m} value={m}>
                  {fmtMesLongo(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold tracking-wide text-muted uppercase">
            Alerta de qualidade
            <select className={clsx(selectCls, 'mt-1.5 font-normal tracking-normal text-ink normal-case')} value={f.alerta} onChange={(e) => atualiza({ alerta: e.target.value as Filtros['alerta'] })}>
              <option value="">Todas as linhas</option>
              {ALERTAS.map((a) => (
                <option key={a.chave} value={a.chave}>
                  {a.rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold tracking-wide text-muted uppercase">
            Dias p/ 1º acesso ≥ <span className="tnum text-ink">{f.diasMin}</span>
            <input
              type="range"
              min={0}
              max={DIAS_MAX}
              value={f.diasMin}
              onChange={(e) => atualiza({ diasMin: Number(e.target.value) })}
              className="mt-3 w-full accent-[var(--brand)]"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
          <p className="text-muted">
            <span className="tnum font-semibold text-ink">{fmtN(filtradas.length)}</span> de {fmtN(ROWS.length)} matrículas
            {nFiltros > 0 && ` · ${nFiltros} filtro(s) ativo(s)`}
          </p>
          <div className="flex gap-2">
            {nFiltros > 0 && (
              <button type="button" onClick={() => setF({ ...INICIAL, tamanho: f.tamanho })} className="rounded-lg border border-line px-3 py-1.5 font-medium hover:bg-surface-2">
                Limpar filtros
              </button>
            )}
            <button type="button" onClick={exportar} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 font-medium text-white hover:brightness-110">
              <Download className="size-4" aria-hidden /> Exportar CSV
            </button>
          </div>
        </div>
      </Card>

      {/* ---------- Resumo do filtro ---------- */}
      <section aria-label="Resumo do que está filtrado" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi rotulo="Matrículas" valor={fmtN(r.n)} />
        <Kpi rotulo="Taxa de evasão" valor={fmtPct(r.taxaEvasao)} tom="bad" dica={`${fmtN(r.evadidos)} evadidos`} />
        <Kpi rotulo="Taxa de conclusão" valor={fmtPct(r.taxaConclusao)} tom="ok" dica={`${fmtN(r.concluidos)} concluídos`} />
        <Kpi rotulo="% concluído (mediana)" valor={r.n ? `${fmtN(r.medPct, 1)}%` : '—'} />
        <Kpi rotulo="Dias 1º acesso (mediana)" valor={fmtN(r.medDias, 1)} dica={`média ${fmtN(r.mediaDias, 1)}`} />
        <Kpi rotulo="Nota (mediana)" valor={fmtN(r.medNota, 1)} dica={`média ${fmtN(r.mediaNota, 2)}`} />
      </section>
      {r.n > 0 && (
        <div aria-label="Distribuição de status do filtro" className="flex h-3 overflow-hidden rounded-full bg-surface-2">
          <div className="bg-ok" style={{ width: `${r.taxaConclusao * 100}%` }} title={`Concluído ${fmtPct(r.taxaConclusao)}`} />
          <div className="bg-info" style={{ width: `${r.taxaAndamento * 100}%` }} title={`Em andamento ${fmtPct(r.taxaAndamento)}`} />
          <div className="bg-bad" style={{ width: `${r.taxaEvasao * 100}%` }} title={`Evadido ${fmtPct(r.taxaEvasao)}`} />
        </div>
      )}
      <p className="-mt-2 flex flex-wrap gap-x-4 text-xs text-muted">
        <span><span className="mr-1 inline-block size-2 rounded-full bg-ok" />Concluído</span>
        <span><span className="mr-1 inline-block size-2 rounded-full bg-info" />Em andamento</span>
        <span><span className="mr-1 inline-block size-2 rounded-full bg-bad" />Evadido</span>
        <span className="ml-auto">Os indicadores usam sempre os dados tratados.</span>
      </p>

      {/* ---------- Tabela ---------- */}
      <Card className="p-0 sm:p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 text-xs text-muted">
          <p>
            {visao === 'bruta' ? (
              <>
                <span className="mr-1 inline-block size-2.5 rounded-sm bg-bad/40 align-middle" /> Células em vermelho = problema na base original.
              </>
            ) : (
              <>
                <span className="mr-1 inline-block size-2.5 rounded-sm bg-accent/50 align-middle" /> Células em âmbar = valor corrigido pelo grupo (passe o mouse para ver o original).
              </>
            )}{' '}
            Clique em uma linha para ver o detalhe.
          </p>
          <label className="flex items-center gap-2">
            Linhas por página
            <select className="rounded-md border border-line bg-surface px-2 py-1 text-ink" value={f.tamanho} onChange={(e) => atualiza({ tamanho: Number(e.target.value) })}>
              {[25, 50, 100, 200].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="scroll-thin max-h-[70vh] overflow-auto">
          <table className="data-table w-full min-w-[56rem] border-collapse text-left text-sm">
            <thead>
              <tr>
                {COLUNAS.map((c) => {
                  const ativo = f.ordem === c.chave;
                  const Seta = !ativo ? ArrowUpDown : f.dir === 'asc' ? ArrowUp : ArrowDown;
                  return (
                    <th key={c.chave} className={clsx(th, c.num && 'text-right')} aria-sort={ativo ? (f.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" onClick={() => ordenar(c.chave)} className={clsx('inline-flex items-center gap-1 uppercase hover:text-ink', ativo && 'text-ink')}>
                        {c.titulo}
                        <Seta className={clsx('size-3', !ativo && 'opacity-40')} aria-hidden />
                      </button>
                    </th>
                  );
                })}
                <th className={th}>Qualidade</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((x) => (
                <Linha key={x.id} r={x} visao={visao} onAbrir={() => setDetalhe(x)} />
              ))}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={COLUNAS.length + 1} className="px-4 py-12 text-center text-muted">
                    Nenhuma matrícula com esses filtros.{' '}
                    <button type="button" className="font-semibold text-brand-ink underline" onClick={() => setF({ ...INICIAL, tamanho: f.tamanho })}>
                      Limpar filtros
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm">
          <p className="tnum text-muted">
            {filtradas.length ? `${fmtN(pagina * f.tamanho + 1)}–${fmtN(Math.min((pagina + 1) * f.tamanho, filtradas.length))} de ${fmtN(filtradas.length)}` : '0 resultados'}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={pagina === 0} onClick={() => atualiza({ pagina: pagina - 1 })} className="flex size-9 items-center justify-center rounded-lg border border-line enabled:hover:bg-surface-2 disabled:opacity-40" aria-label="Página anterior">
              <ChevronLeft className="size-4" />
            </button>
            <span className="tnum px-2 text-muted">
              {pagina + 1} / {paginas}
            </span>
            <button type="button" disabled={pagina >= paginas - 1} onClick={() => atualiza({ pagina: pagina + 1 })} className="flex size-9 items-center justify-center rounded-lg border border-line enabled:hover:bg-surface-2 disabled:opacity-40" aria-label="Próxima página">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </Card>

      <Detalhe r={detalhe} onFechar={() => setDetalhe(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Linha da tabela                                                     */
/* ------------------------------------------------------------------ */
const celBruto = 'bg-bad-soft/70';
const celTratado = 'bg-accent-soft';

function Linha({ r, visao, onAbrir }: { r: Row; visao: Visao; onAbrir: () => void }) {
  const bruta = visao === 'bruta';
  const f = r.flags;
  const notaAusenteConcluido = r.status === 'Concluído' && r.notaOriginal == null;

  return (
    <tr
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAbrir();
        }
      }}
      className="cursor-pointer hover:bg-surface-2/70 focus-visible:bg-surface-2"
    >
      <td className={clsx(td, 'tnum font-medium')}>{r.id}</td>
      <td className={clsx(td, 'tnum whitespace-nowrap')}>{fmtData(r.data)}</td>
      <td
        className={clsx(td, f.categoria && (bruta ? celBruto : celTratado))}
        title={f.categoria ? (bruta ? 'Grafia inconsistente' : `Original: "${r.categoriaOriginal}"`) : undefined}
      >
        {bruta ? <code className="text-[13px]">{visivel(r.categoriaOriginal)}</code> : r.categoria}
      </td>
      <td className={td}>{r.dispositivo}</td>
      <td
        className={clsx(td, 'tnum text-right', f.pct && (bruta ? celBruto : celTratado))}
        title={f.pct ? (bruta ? 'Valor impossível (> 100%)' : `Original: ${fmtN(r.pctOriginal, 1)}%`) : undefined}
      >
        {fmtN(bruta ? r.pctOriginal : r.pct, 1)}%
      </td>
      <td
        className={clsx(
          td,
          'tnum text-right',
          bruta && notaAusenteConcluido && celBruto,
          !bruta && f.nota && celTratado,
        )}
        title={
          bruta && notaAusenteConcluido
            ? 'Concluído sem nota (falha de registro)'
            : !bruta && f.nota
              ? 'Imputada: mediana das notas dos concluídos'
              : undefined
        }
      >
        {fmtN(bruta ? r.notaOriginal : r.nota, 1)}
        {!bruta && f.nota && <span aria-hidden>*</span>}
      </td>
      <td className={clsx(td, 'tnum text-right', f.outlierDias && 'font-semibold text-accent')} title={f.outlierDias ? `Acima da cerca de Tukey (${fmtN(DIAS_CERCA, 1)} dias)` : undefined}>
        {r.dias}
      </td>
      <td className={td}>
        <StatusBadge status={r.status} />
      </td>
      <td className={clsx(td, 'text-muted')}>{r.motivo ?? ''}</td>
      <td className={td}>
        <span className="flex flex-wrap gap-1">
          {ALERTAS.filter((a) => f[a.chave]).map((a) => (
            <Badge key={a.chave} tom={a.chave === 'outlierDias' || a.chave === 'motivoNI' ? 'neutro' : 'accent'} className="px-2 text-[11px]">
              <span title={a.rotulo}>{a.curto}</span>
            </Badge>
          ))}
        </span>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Detalhe da matrícula (dialog nativo)                                */
/* ------------------------------------------------------------------ */
function Detalhe({ r, onFechar }: { r: Row | null; onFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (r && !d.open) d.showModal();
    if (!r && d.open) d.close();
  }, [r]);

  const linhas = r
    ? [
        { campo: 'Categoria_Curso', bruto: `"${r.categoriaOriginal}"`, tratado: r.categoria, mudou: r.flags.categoria, nota: 'Padronizada (sem espaços, acentos ou caixa alta)' },
        { campo: 'Pct_Concluido', bruto: `${fmtN(r.pctOriginal, 1)}%`, tratado: `${fmtN(r.pct, 1)}%`, mudou: r.flags.pct, nota: `Impossível (>100%): mediana do status "${r.status}" = ${fmtN(PCT_MEDIANA_POR_STATUS[r.status], 1)}%` },
        { campo: 'Nota_Final', bruto: r.notaOriginal == null ? 'vazio' : fmtN(r.notaOriginal, 1), tratado: r.nota == null ? 'vazio (não se aplica)' : fmtN(r.nota, 1), mudou: r.flags.nota, nota: `Concluído sem nota: mediana dos concluídos = ${fmtN(NOTA_MEDIANA, 1)}` },
        { campo: 'Dias_Ate_Primeiro_Acesso', bruto: String(r.dias), tratado: String(r.dias), mudou: false, nota: r.flags.outlierDias ? `Atípico (> ${fmtN(DIAS_CERCA, 1)} dias), mas mantido: é dado real` : 'Sem alteração' },
        { campo: 'Motivo_Evasao', bruto: r.motivo ?? 'vazio', tratado: r.motivo ?? 'vazio', mudou: false, nota: r.flags.motivoNI ? 'Mantido como categoria "Não informado"' : r.status === 'Evadido' ? 'Sem alteração' : 'Só se aplica a evadidos' },
      ]
    : [];

  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      onClick={(e) => {
        if (e.target === ref.current) onFechar();
      }}
      className="m-auto w-[min(44rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/50"
    >
      {r && (
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wider text-brand uppercase">Matrícula</p>
              <h3 className="font-display text-2xl font-bold">{r.id}</h3>
              <p className="mt-1 text-sm text-muted">
                {fmtData(r.data)} · {r.categoria} · {r.dispositivo} · <StatusBadge status={r.status} />
              </p>
            </div>
            <button type="button" onClick={onFechar} className="flex size-9 items-center justify-center rounded-lg hover:bg-surface-2" aria-label="Fechar">
              <X className="size-5" />
            </button>
          </div>
          <Tabela className="mt-4">
            <thead>
              <tr>
                <th className={th}>Campo</th>
                <th className={th}>Bruto</th>
                <th className={th}>Tratado</th>
                <th className={th}>O que foi feito</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.campo} className={clsx(l.mudou && 'bg-accent-soft/60')}>
                  <td className={clsx(td, 'font-mono text-xs')}>{l.campo}</td>
                  <td className={clsx(td, 'tnum')}>{l.bruto}</td>
                  <td className={clsx(td, 'tnum font-semibold')}>{l.tratado}</td>
                  <td className={clsx(td, 'text-xs text-muted')}>{l.nota}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </div>
      )}
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Aba: dicionário                                                     */
/* ------------------------------------------------------------------ */
function AbaDicionario() {
  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-display text-xl font-bold">{dicionario.titulo}</h2>
        <p className="mt-1 text-sm text-muted">{dicionario.resumo}</p>
        <Tabela className="mt-4">
          <thead>
            <tr>
              <th className={th}>Coluna</th>
              <th className={th}>Tipo</th>
              <th className={th}>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {dicionario.colunas.map((c) => (
              <tr key={c.coluna}>
                <td className={clsx(td, 'font-mono text-xs font-semibold')}>{c.coluna}</td>
                <td className={td}>{c.tipo}</td>
                <td className={clsx(td, 'text-muted')}>{c.descricao}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </Card>
      <Card>
        <h3 className="font-display text-lg font-bold">Como usar esta base (orientações do professor)</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          {dicionario.comoUsar.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <a
          href="./Base_4_BrightLearn_Cursos.xlsx"
          download
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"
        >
          <FileSpreadsheet className="size-4 text-brand" aria-hidden /> Baixar o Excel original
        </a>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Aba: perfil das colunas (dados brutos)                              */
/* ------------------------------------------------------------------ */
type Perfil = {
  coluna: string;
  tipo: string;
  preenchidos: number;
  vazios: number;
  distintos: number;
  min: string;
  max: string;
  media: string;
  mediana: string;
  moda: string;
};

function perfilColunas(): Perfil[] {
  const colunas = Object.keys(RAW[0]) as (keyof (typeof RAW)[number])[];
  return colunas.map((c) => {
    const vals = RAW.map((r) => r[c]);
    const cheios = vals.filter((v) => v != null && v !== '');
    const numerica = cheios.every((v) => typeof v === 'number');
    const distintos = new Set(cheios).size;
    const moda = mode(cheios as (string | number)[]);
    if (numerica) {
      const nums = cheios as number[];
      return {
        coluna: c,
        tipo: 'Número',
        preenchidos: cheios.length,
        vazios: vals.length - cheios.length,
        distintos,
        min: fmtN(Math.min(...nums), 1),
        max: fmtN(Math.max(...nums), 1),
        media: fmtN(mean(nums), 2),
        mediana: fmtN(median(nums), 1),
        moda: moda == null ? '—' : fmtN(Number(moda), 1),
      };
    }
    const txt = cheios as string[];
    const ordenado = [...txt].sort();
    return {
      coluna: c,
      tipo: c === 'Data_Matricula' ? 'Data' : 'Texto',
      preenchidos: cheios.length,
      vazios: vals.length - cheios.length,
      distintos,
      min: c === 'Data_Matricula' ? fmtData(ordenado[0]) : '—',
      max: c === 'Data_Matricula' ? fmtData(ordenado[ordenado.length - 1]) : '—',
      media: '—',
      mediana: '—',
      moda: c === 'ID_Matricula' ? '—' : String(moda),
    };
  });
}

function AbaPerfil() {
  const perfil = useMemo(() => perfilColunas(), []);
  return (
    <div className="space-y-5">
      <Callout tipo="info" titulo="Perfil da base ORIGINAL, antes de qualquer tratamento">
        {fmtN(RAW.length)} linhas × {perfil.length} colunas. Repare em <strong>Categoria_Curso</strong> (10 grafias para 5 categorias), em{' '}
        <strong>Pct_Concluido</strong> (máximo 140) e em <strong>Nota_Final</strong> (muitos vazios). A explicação de cada caso está na Entrega 2.
      </Callout>
      <Tabela>
        <thead>
          <tr>
            {['Coluna', 'Tipo', 'Preenchidos', 'Vazios', 'Distintos', 'Mín.', 'Máx.', 'Média', 'Mediana', 'Moda'].map((h) => (
              <th key={h} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perfil.map((p) => (
            <tr key={p.coluna}>
              <td className={clsx(td, 'font-mono text-xs font-semibold')}>{p.coluna}</td>
              <td className={td}>{p.tipo}</td>
              <td className={clsx(td, 'tnum')}>{fmtN(p.preenchidos)}</td>
              <td className={clsx(td, 'tnum', p.vazios > 0 && 'font-semibold text-accent')}>{fmtN(p.vazios)}</td>
              <td className={clsx(td, 'tnum', p.coluna === 'Categoria_Curso' && 'font-semibold text-bad')}>{fmtN(p.distintos)}</td>
              <td className={clsx(td, 'tnum')}>{p.min}</td>
              <td className={clsx(td, 'tnum', p.coluna === 'Pct_Concluido' && 'font-semibold text-bad')}>{p.max}</td>
              <td className={clsx(td, 'tnum')}>{p.media}</td>
              <td className={clsx(td, 'tnum')}>{p.mediana}</td>
              <td className={td}>{p.moda}</td>
            </tr>
          ))}
        </tbody>
      </Tabela>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
const ABAS = [
  { id: 'tabela', rotulo: 'Tabela e busca' },
  { id: 'dicionario', rotulo: 'Dicionário de dados' },
  { id: 'perfil', rotulo: 'Perfil das colunas' },
] as const;

export default function Explorador() {
  const [aba, setAba] = useState<(typeof ABAS)[number]['id']>('tabela');
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-wider text-brand uppercase">Base de dados</p>
        <h1 className="font-display text-3xl font-extrabold">Explore as {fmtN(ROWS.length)} matrículas</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Busque, filtre, ordene e compare a base <strong>bruta</strong> (como veio do Excel) com a base <strong>tratada</strong> (depois da limpeza).
          Os indicadores acima da tabela se atualizam a cada filtro.
        </p>
      </div>

      <div role="tablist" aria-label="Seções da base de dados" className="flex gap-1 overflow-x-auto border-b border-line">
        {ABAS.map((a) => (
          <button
            key={a.id}
            role="tab"
            type="button"
            aria-selected={aba === a.id}
            onClick={() => setAba(a.id)}
            className={clsx(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              aba === a.id ? 'border-brand text-brand-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {aba === 'tabela' && <AbaTabela />}
        {aba === 'dicionario' && <AbaDicionario />}
        {aba === 'perfil' && <AbaPerfil />}
      </div>
    </div>
  );
}
