import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import clsx from 'clsx';
import { fmtN, fmtPct } from '../lib/format';
import { COR, COR_STATUS, PALETA } from './chartTheme';
import { Badge } from './ui';

const eixoProps = {
  tick: { fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: 'var(--line)' },
} as const;

const dicaProps = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    color: 'var(--ink)',
    fontSize: 12,
    boxShadow: '0 6px 20px rgb(15 23 42 / 0.12)',
  },
  labelStyle: { color: 'var(--ink)', fontWeight: 600 },
  itemStyle: { color: 'var(--ink)' },
  cursor: { fill: 'var(--surface-2)', opacity: 0.6 },
} as const;

/* -------------------------------------------------------------------------- */

export function ChartCard({
  titulo,
  pergunta,
  tipo,
  porque,
  children,
  rodape,
  className,
}: {
  titulo: string;
  pergunta?: string;
  tipo?: string;
  porque?: string;
  children: ReactNode;
  rodape?: ReactNode;
  className?: string;
}) {
  return (
    <figure className={clsx('flex flex-col rounded-2xl border border-line bg-surface p-5', className)}>
      <figcaption>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold">{titulo}</h3>
          {tipo && <Badge tom="brand">{tipo}</Badge>}
        </div>
        {pergunta && <p className="mt-1 text-sm text-muted">{pergunta}</p>}
      </figcaption>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
      {porque && (
        <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">Por que este gráfico? </span>
          {porque}
        </p>
      )}
      {rodape && <div className="mt-2 text-xs text-muted">{rodape}</div>}
    </figure>
  );
}

export interface Ponto {
  nome: string;
  valor: number;
  n?: number;
}

/** Barras (horizontal ou vertical) de uma taxa/valor por categoria. */
export function BarraTaxa({
  dados,
  formato = (v: number) => fmtPct(v),
  horizontal = true,
  destaque = 'max',
  referencia,
  altura = 260,
  rotuloRef = 'média',
  descricao,
}: {
  dados: Ponto[];
  formato?: (v: number) => string;
  horizontal?: boolean;
  destaque?: 'max' | 'min' | 'nenhum' | string;
  referencia?: number;
  altura?: number;
  rotuloRef?: string;
  descricao?: string;
}) {
  const max = Math.max(...dados.map((d) => d.valor), referencia ?? 0);
  const alvo =
    destaque === 'max'
      ? dados.reduce((a, b) => (b.valor > a.valor ? b : a), dados[0])?.nome
      : destaque === 'min'
        ? dados.reduce((a, b) => (b.valor < a.valor ? b : a), dados[0])?.nome
        : destaque;
  const cor = (d: Ponto) => (d.nome === alvo ? COR.bad : COR.brand);

  return (
    <div>
    <div role="img" aria-label={descricao} style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dados}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={horizontal ? { top: 4, right: 56, bottom: 4, left: 0 } : { top: 20, right: 8, bottom: 4, left: 0 }}
        >
          <CartesianGrid stroke="var(--chart-grid)" horizontal={!horizontal} vertical={horizontal} strokeDasharray="3 3" />
          {horizontal ? (
            <>
              <XAxis type="number" domain={[0, max * 1.12]} hide />
              <YAxis type="category" dataKey="nome" width={92} {...eixoProps} />
            </>
          ) : (
            <>
              <XAxis type="category" dataKey="nome" {...eixoProps} />
              <YAxis type="number" domain={[0, max * 1.18]} tickFormatter={(v) => formato(Number(v))} width={46} {...eixoProps} />
            </>
          )}
          <Tooltip
            {...dicaProps}
            formatter={(v, _n, item) => {
              const n = (item?.payload as Ponto | undefined)?.n;
              return [`${formato(Number(v))}${n != null ? ` · ${fmtN(n)} matrículas` : ''}`, ''];
            }}
          />
          {referencia != null && (
            <ReferenceLine
              {...(horizontal ? { x: referencia } : { y: referencia })}
              stroke="var(--muted)"
              strokeDasharray="4 4"
            />
          )}
          <Bar dataKey="valor" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={36}>
            {dados.map((d) => (
              <Cell key={d.nome} fill={cor(d)} />
            ))}
            <LabelList
              dataKey="valor"
              position={horizontal ? 'right' : 'top'}
              formatter={(v: unknown) => formato(Number(v))}
              style={{ fill: 'var(--ink)', fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    {referencia != null && (
      <p className="mt-1 flex items-center gap-2 text-xs text-muted">
        <span className="inline-block w-5 border-t-2 border-dashed border-muted" aria-hidden />
        {rotuloRef} {formato(referencia)}
      </p>
    )}
    </div>
  );
}

/** Barras (matrículas) + linha (taxa de evasão) por mês. */
export function ComboMes({
  dados,
  altura = 280,
  rotuloTaxa = 'Taxa de evasão',
}: {
  dados: { mes: string; n: number; taxa: number }[];
  altura?: number;
  rotuloTaxa?: string;
}) {
  return (
    <div role="img" aria-label="Matrículas por mês e taxa de evasão" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="mes" {...eixoProps} />
          <YAxis yAxisId="n" width={34} {...eixoProps} />
          <YAxis
            yAxisId="taxa"
            orientation="right"
            width={42}
            domain={[0, (max: number) => Math.min(1, Math.ceil((max + 0.05) * 10) / 10)]}
            tickFormatter={(v) => fmtPct(Number(v), 0)}
            {...eixoProps}
          />
          <Tooltip
            {...dicaProps}
            formatter={(v, nome) => (nome === 'Matrículas' ? [fmtN(Number(v)), nome] : [fmtPct(Number(v)), nome])}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="n" dataKey="n" name="Matrículas" fill="var(--brand)" fillOpacity={0.28} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line yAxisId="taxa" dataKey="taxa" name={rotuloTaxa} stroke="var(--bad)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--bad)' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Rosca + legenda em HTML (acessível). */
export function Rosca({
  dados,
  altura = 220,
}: {
  dados: { nome: string; n: number; pct: number }[];
  altura?: number;
}) {
  const total = dados.reduce((s, d) => s + d.n, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div role="img" aria-label="Motivos de evasão (composição)" className="w-full max-w-[240px] shrink-0" style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={dados} dataKey="n" nameKey="nome" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
              {dados.map((d, i) => (
                <Cell key={d.nome} fill={d.nome === 'Não informado' ? 'var(--muted)' : PALETA[i % PALETA.length]} />
              ))}
            </Pie>
            <Tooltip {...dicaProps} formatter={(v, nome) => [`${fmtN(Number(v))} (${fmtPct(Number(v) / (total || 1))})`, nome]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        {dados.map((d, i) => (
          <li key={d.nome} className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ background: d.nome === 'Não informado' ? 'var(--muted)' : PALETA[i % PALETA.length] }}
              aria-hidden
            />
            <span className="flex-1">{d.nome}</span>
            <span className="tnum font-semibold">{fmtPct(d.pct)}</span>
            <span className="tnum w-9 text-right text-xs text-muted">{fmtN(d.n)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontais empilhadas a 100% (composição do status por grupo). */
export function Empilhado100({
  dados,
  altura = 220,
}: {
  dados: { nome: string; n: number; Concluído: number; 'Em andamento': number; Evadido: number }[];
  altura?: number;
}) {
  return (
    <div role="img" aria-label="Distribuição do status por grupo" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }} stackOffset="expand">
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} {...eixoProps} />
          <YAxis type="category" dataKey="nome" width={86} {...eixoProps} />
          <Tooltip {...dicaProps} formatter={(v, nome) => [`${fmtN(Number(v), 1)}%`, nome]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {(['Concluído', 'Em andamento', 'Evadido'] as const).map((s) => (
            <Bar key={s} dataKey={s} stackId="a" fill={COR_STATUS[s]} maxBarSize={34}>
              <LabelList dataKey={s} position="center" formatter={(v: unknown) => (Number(v) >= 9 ? `${fmtN(Number(v), 0)}%` : '')} style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Distribuição de frequências (colunas); pontos "fora" ficam destacados, com linha de corte opcional. */
export function Distribuicao({
  dados,
  corte,
  rotuloCorte,
  altura = 220,
}: {
  dados: { nome: string; valor: number; fora?: boolean }[];
  corte?: string;
  rotuloCorte?: string;
  altura?: number;
}) {
  return (
    <div role="img" aria-label="Distribuição de frequências" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 16, right: 8, bottom: 4, left: 0 }} barCategoryGap={2}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="nome" interval={1} {...eixoProps} />
          <YAxis width={34} {...eixoProps} />
          <Tooltip {...dicaProps} formatter={(v) => [`${fmtN(Number(v))} matrículas`, '']} labelFormatter={(l) => `${l} dia(s)`} />
          {corte != null && (
            <ReferenceLine x={corte} stroke="var(--bad)" strokeDasharray="4 4" label={{ value: rotuloCorte, fill: 'var(--bad)', fontSize: 11, position: 'insideTopRight' }} />
          )}
          <Bar dataKey="valor" radius={[3, 3, 0, 0]}>
            {dados.map((d) => (
              <Cell key={d.nome} fill={d.fora ? 'var(--bad)' : 'var(--brand)'} fillOpacity={d.fora ? 0.9 : 0.75} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras agrupadas "antes × depois" (limpeza). */
export function AntesDepois({
  dados,
  horizontal = false,
  altura = 260,
  formato = (v: number) => fmtN(v),
  rotuloAntes = 'Antes (bruto)',
  rotuloDepois = 'Depois (tratado)',
}: {
  dados: { nome: string; antes: number; depois: number }[];
  horizontal?: boolean;
  altura?: number;
  formato?: (v: number) => string;
  rotuloAntes?: string;
  rotuloDepois?: string;
}) {
  return (
    <div role="img" aria-label="Comparação antes e depois do tratamento" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 16, right: horizontal ? 36 : 8, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={!horizontal} vertical={horizontal} strokeDasharray="3 3" />
          {horizontal ? (
            <>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="nome" width={110} {...eixoProps} />
            </>
          ) : (
            <>
              <XAxis dataKey="nome" {...eixoProps} />
              <YAxis width={36} {...eixoProps} />
            </>
          )}
          <Tooltip {...dicaProps} formatter={(v, nome) => [formato(Number(v)), nome]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="antes" name={rotuloAntes} fill="var(--bad)" fillOpacity={0.75} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={20}>
            <LabelList dataKey="antes" position={horizontal ? 'right' : 'top'} formatter={(v: unknown) => formato(Number(v))} style={{ fill: 'var(--muted)', fontSize: 11 }} />
          </Bar>
          <Bar dataKey="depois" name={rotuloDepois} fill="var(--ok)" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={20}>
            <LabelList dataKey="depois" position={horizontal ? 'right' : 'top'} formatter={(v: unknown) => formato(Number(v))} style={{ fill: 'var(--ink)', fontSize: 11, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
