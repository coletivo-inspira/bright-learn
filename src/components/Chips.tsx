import clsx from 'clsx';

/** Grupo de botões liga/desliga (multi-seleção). Nada marcado = "todos". */
export function Chips({
  opcoes,
  ativos,
  onChange,
  rotulo,
}: {
  opcoes: readonly string[];
  ativos: string[];
  onChange: (v: string[]) => void;
  rotulo: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{rotulo}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => {
          const on = ativos.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? ativos.filter((x) => x !== o) : [...ativos, o])}
              className={clsx(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                on ? 'border-brand bg-brand text-white' : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
