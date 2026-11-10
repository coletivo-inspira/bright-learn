import { Target } from 'lucide-react';
import { GCategoria, GDias, GDispTaxa } from '../../components/GraficosBase';
import { SPEC } from '../../components/graficosSpec';
import { Badge, Callout, Card, Kpi, SectionTitle, Tabela, td, th } from '../../components/ui';
import { resumo } from '../../lib/analytics';
import { ROWS } from '../../lib/clean';
import { fmtN, fmtPct } from '../../lib/format';
import { href } from '../../lib/router';

const DESCARTADOS: Record<keyof typeof SPEC, string> = {
  categoria: 'Pizza: 5 fatias parecidas são difíceis de comparar a olho. Linha: categorias não têm ordem no tempo.',
  dias: 'Linha: as faixas são poucas e discretas. Dispersão com 820 pontos sobrepostos esconderia o salto.',
  motivos: 'Barras também serviriam; a rosca foi escolhida por responder "quanto do todo?". Com 5 fatias o rótulo continua legível.',
  mes: 'Só barras esconderia a taxa; só linha esconderia o tamanho da amostra de cada mês.',
  dispTaxa: 'Barras em números absolutos fariam o celular parecer pior só por ter mais alunos; por isso usamos a taxa. Pizza não serve para comparar taxas.',
  dispositivo: 'Barras simples em números absolutos fariam o celular parecer pior só por ter mais alunos.',
};

/** Qual das 4 perguntas de análise cada gráfico responde. */
const PILAR: Record<keyof typeof SPEC, string> = {
  dias: 'Diagnóstica (principal)',
  categoria: 'Descritiva',
  dispTaxa: 'Diagnóstica',
  motivos: 'Diagnóstica (apoio)',
  mes: 'Descritiva (apoio)',
  dispositivo: 'Descritiva (apoio)',
};

export default function E4() {
  const r = resumo(ROWS);
  const ordem = ['dias', 'categoria', 'dispTaxa'] as const;

  return (
    <>
      <Callout tipo="info" titulo="O que esta entrega pede">
        Pelo menos <strong>3 gráficos esboçados</strong> para o dashboard, cada um com o tipo justificado pela relação <em>pergunta → gráfico</em>, e <strong>1 KPI em destaque</strong>. Aqui estão{' '}
        <strong>3 gráficos principais</strong> e o KPI definido, cada um ligado a uma das 4 perguntas de análise; a versão interativa, com filtros, está no <a className="font-semibold text-brand-ink underline" href={href('dashboard')}>Dashboard</a>.
      </Callout>

      {/* ---------- KPI ---------- */}
      <section className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <Kpi destaque rotulo="KPI em destaque · Taxa de evasão" valor={fmtPct(r.taxaEvasaoEnc)} dica={`${fmtN(r.evadidos)} evadidos ÷ ${fmtN(r.evadidos + r.concluidos)} encerradas`} />
        <Card>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand uppercase">
            <Target className="size-4" aria-hidden /> Por que este KPI
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            <li>Responde direto à pergunta de negócio (evasão) com um número só que a diretoria entende.</li>
            <li>É acionável: sobe ou desce conforme as ações de retenção que o grupo recomenda, então serve para acompanhar o piloto.</li>
            <li>
              É simples de calcular e de explicar: evadidos ÷ (concluídos + evadidos), só entre as encerradas. Ao lado dele, a <strong>taxa de conclusão</strong> ({fmtPct(r.taxaConclusao)}) e a versão sobre todas as matrículas ({fmtPct(r.taxaEvasao)}) dão o
              contexto.
            </li>
          </ul>
        </Card>
      </section>

      {/* ---------- Tabela pergunta → gráfico ---------- */}
      <section>
        <SectionTitle eyebrow="Etapa (d)" title="Pergunta → gráfico">
          Cada gráfico nasce de uma pergunta, e o tipo é escolhido pelo tipo de relação que a pergunta pede (comparar, relacionar, compor ou acompanhar no tempo).
        </SectionTitle>
        <Tabela>
          <thead>
            <tr>
              <th className={th}>Pergunta</th>
              <th className={th}>Responde</th>
              <th className={th}>Gráfico escolhido</th>
              <th className={th}>Por quê</th>
              <th className={th}>Alternativas descartadas</th>
            </tr>
          </thead>
          <tbody>
            {ordem.map((k) => (
              <tr key={k}>
                <td className={`${td} font-medium`}>{SPEC[k].pergunta}</td>
                <td className={td}>{PILAR[k]}</td>
                <td className={td}>
                  <Badge tom="brand">{SPEC[k].tipo}</Badge>
                </td>
                <td className={`${td} text-muted`}>{SPEC[k].porque}</td>
                <td className={`${td} text-xs text-muted`}>{DESCARTADOS[k]}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </section>

      {/* ---------- Esboços ---------- */}
      <section>
        <SectionTitle eyebrow="Esboços" title="Os gráficos com os dados tratados" />
        <div className="grid gap-5 lg:grid-cols-2">
          <GDias rows={ROWS} base="encerradas" />
          <GCategoria rows={ROWS} base="encerradas" />
          <GDispTaxa rows={ROWS} base="encerradas" />
        </div>
        <p className="mt-4 text-sm text-muted">Gráficos de apoio (motivos e evolução por mês) ficam no Dashboard; aqui ficam os três principais.</p>
      </section>

      <Callout tipo="dica" titulo="Como usar no documento escrito">
        O documento pede "imagens/prints das visualizações". No Dashboard, deixe os filtros zerados, tire um print de cada gráfico e cole na seção de dashboard, sempre com a legenda{' '}
        <em>pergunta → gráfico → leitura</em>.
      </Callout>
    </>
  );
}
