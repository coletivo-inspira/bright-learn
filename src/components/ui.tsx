import clsx from 'clsx';
import type { ReactNode } from 'react';
import { AlertTriangle, Info, Lightbulb, CheckCircle2 } from 'lucide-react';
import type { Status } from '../lib/types';

export type Tom = 'neutro' | 'brand' | 'ok' | 'info' | 'bad' | 'accent';

const TOM_CLASSE: Record<Tom, string> = {
  neutro: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand-ink',
  ok: 'bg-ok-soft text-ok',
  info: 'bg-info-soft text-info',
  bad: 'bg-bad-soft text-bad',
  accent: 'bg-accent-soft text-accent',
};

export function Badge({ tom = 'neutro', children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TOM_CLASSE[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TOM: Record<Status, Tom> = {
  Concluído: 'ok',
  'Em andamento': 'info',
  Evadido: 'bad',
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tom={STATUS_TOM[status]}>{status}</Badge>;
}

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <Tag className={clsx('rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-6', className)}>
      {children}
    </Tag>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('mb-4', className)}>
      {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wider text-brand uppercase">{eyebrow}</p>}
      <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
      {children && <div className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{children}</div>}
    </div>
  );
}

const CALLOUT: Record<'info' | 'aviso' | 'dica' | 'ok', { classe: string; Icone: typeof Info }> = {
  info: { classe: 'border-info/30 bg-info-soft/60', Icone: Info },
  aviso: { classe: 'border-accent/40 bg-accent-soft/70', Icone: AlertTriangle },
  dica: { classe: 'border-brand/30 bg-brand-soft/70', Icone: Lightbulb },
  ok: { classe: 'border-ok/30 bg-ok-soft/60', Icone: CheckCircle2 },
};

export function Callout({
  tipo = 'info',
  titulo,
  children,
  className,
}: {
  tipo?: keyof typeof CALLOUT;
  titulo?: string;
  children: ReactNode;
  className?: string;
}) {
  const { classe, Icone } = CALLOUT[tipo];
  return (
    <div className={clsx('flex gap-3 rounded-xl border p-4 text-sm leading-relaxed', classe, className)}>
      <Icone className="mt-0.5 size-4 shrink-0 text-ink/70" aria-hidden />
      <div>
        {titulo && <p className="mb-0.5 font-semibold">{titulo}</p>}
        <div className="text-ink/90">{children}</div>
      </div>
    </div>
  );
}

export function Kpi({
  rotulo,
  valor,
  dica,
  destaque = false,
  tom,
}: {
  rotulo: string;
  valor: ReactNode;
  dica?: ReactNode;
  destaque?: boolean;
  tom?: Tom;
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl border p-4 sm:p-5',
        destaque ? 'border-transparent bg-brand text-white' : 'border-line bg-surface',
      )}
    >
      <p className={clsx('text-xs font-medium tracking-wide uppercase', destaque ? 'text-white/80' : 'text-muted')}>{rotulo}</p>
      <p
        className={clsx(
          'tnum mt-1 font-display font-extrabold tracking-tight',
          destaque ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl',
          !destaque && tom === 'bad' && 'text-bad',
          !destaque && tom === 'ok' && 'text-ok',
        )}
      >
        {valor}
      </p>
      {dica && <p className={clsx('mt-1 text-xs leading-snug', destaque ? 'text-white/80' : 'text-muted')}>{dica}</p>}
    </div>
  );
}

/** Tabela simples e responsiva (rola na horizontal em telas pequenas). */
export function Tabela({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('scroll-thin overflow-x-auto rounded-xl border border-line', className)}>
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export const th = 'bg-surface-2 px-3 py-2.5 text-xs font-semibold tracking-wide text-muted uppercase';
export const td = 'border-t border-line px-3 py-2.5 align-top';

export function Passo({ n, titulo, children }: { n: number | string; titulo: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-ink">
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{titulo}</p>
        <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}
