/**
 * Os 5 gráficos do dashboard. Cada um carrega a sua "pergunta → gráfico" (Etapa 4d),
 * usada tanto no Dashboard quanto na Entrega 4.
 */
import { FAIXAS_DIAS, motivos, porFaixaDias, porGrupo, porMes, statusPor, taxaEvasao } from '../lib/analytics';
import type { Base } from '../lib/analytics';
import { fmtMes, fmtN, fmtPct } from '../lib/format';
import { CATEGORIAS, DISPOSITIVOS } from '../lib/types';
import type { Row } from '../lib/types';
import { BarraTaxa, ChartCard, ComboMes, Empilhado100, Rosca } from './charts';
import { SPEC } from './graficosSpec';

const nomeBase = (b: Base) => (b === 'todas' ? 'evadidos ÷ todas as matrículas' : 'evadidos ÷ (concluídos + evadidos)');

export function GCategoria({ rows, base, altura = 250 }: { rows: Row[]; base: Base; altura?: number }) {
  const g = porGrupo(rows, (r) => r.categoria, CATEGORIAS, base)
    .filter((x) => x.n > 0)
    .sort((a, b) => b.taxa - a.taxa);
  return (
    <ChartCard {...SPEC.categoria} rodape={`Taxa = ${nomeBase(base)}.`}>
      <BarraTaxa
        altura={altura}
        dados={g.map((x) => ({ nome: x.nome, valor: x.taxa, n: x.n }))}
        referencia={taxaEvasao(rows, base)}
        descricao="Taxa de evasão por categoria de curso"
      />
    </ChartCard>
  );
}

export function GDias({ rows, base, altura = 250 }: { rows: Row[]; base: Base; altura?: number }) {
  const g = porFaixaDias(rows, base).filter((x) => x.n > 0);
  return (
    <ChartCard {...SPEC.dias} rodape={`Faixas: ${FAIXAS_DIAS.map((f) => f.label).join(' · ')}. Taxa = ${nomeBase(base)}.`}>
      <BarraTaxa
        horizontal={false}
        altura={altura}
        dados={g.map((x) => ({ nome: x.nome, valor: x.taxa, n: x.n }))}
        destaque="8+ dias"
        referencia={taxaEvasao(rows, base)}
        descricao="Taxa de evasão por faixa de dias até o primeiro acesso"
      />
    </ChartCard>
  );
}

export function GMotivos({ rows, altura = 220 }: { rows: Row[]; altura?: number }) {
  const m = motivos(rows);
  const total = m.reduce((s, x) => s + x.n, 0);
  return (
    <ChartCard {...SPEC.motivos} rodape={`Base: ${fmtN(total)} matrículas evadidas.`}>
      {total > 0 ? <Rosca dados={m.filter((x) => x.n > 0)} altura={altura} /> : <p className="py-12 text-center text-sm text-muted">Sem evadidos neste filtro.</p>}
    </ChartCard>
  );
}

export function GMes({ rows, base }: { rows: Row[]; base: Base }) {
  const m = porMes(rows, base).map((x) => ({ mes: fmtMes(x.mes), n: x.n, taxa: x.taxa }));
  return (
    <ChartCard {...SPEC.mes} rodape="Mês = mês da matrícula. Os meses mais recentes têm mais alunos ainda em andamento, o que pode subestimar a evasão deles.">
      <ComboMes dados={m} rotuloTaxa={`Taxa de evasão (${base === 'todas' ? 'todas' : 'encerradas'})`} />
    </ChartCard>
  );
}

export function GDispositivo({ rows, altura = 200 }: { rows: Row[]; altura?: number }) {
  const d = statusPor(rows, (r) => r.dispositivo, DISPOSITIVOS).filter((x) => x.n > 0);
  return (
    <ChartCard {...SPEC.dispositivo} rodape={d.map((x) => `${x.nome}: ${fmtN(x.n)}`).join(' · ') + ` · Evasão: ${d.map((x) => fmtPct(x.Evadido / 100)).join(' / ')}`}>
      <Empilhado100 dados={d} altura={altura} />
    </ChartCard>
  );
}
