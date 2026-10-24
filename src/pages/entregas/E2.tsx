import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AntesDepois, ChartCard, Distribuicao } from '../../components/charts';
import { Badge, Callout, Card, SectionTitle, Tabela, td, th } from '../../components/ui';
import dicionario from '../../data/dicionario.json';
import {
  DIAS_CERCA,
  NOTA_MEDIANA,
  PCT_MEDIANA_POR_STATUS,
  PROBLEMAS as P,
  RAW,
  ROWS,
} from '../../lib/clean';
import { fmtData, fmtN, fmtPct, fmtPctPonto } from '../../lib/format';
import { href } from '../../lib/router';
import { contar, mean, median, mode, skewness } from '../../lib/stats';
import { CATEGORIAS, STATUSES } from '../../lib/types';

/* ------------------------------------------------------------------ */
/* 1. Validação                                                        */
/* ------------------------------------------------------------------ */
function validacoes() {
  const ids = RAW.map((r) => r.ID_Matricula);
  const datas = RAW.map((r) => r.Data_Matricula).sort();
  const evadidos = RAW.filter((r) => r.Status === 'Evadido');
  const motivosForaDeEvadido = RAW.filter((r) => r.Status !== 'Evadido' && r.Motivo_Evasao != null).length;
  const notasForaDeConcluido = RAW.filter((r) => r.Status !== 'Concluído' && r.Nota_Final != null).length;
  const concluidosFora100 = RAW.filter((r) => r.Status === 'Concluído' && r.Pct_Concluido !== 100).length;

  return {
    ok: [
      { t: 'Número de linhas bate com o enunciado', d: `${fmtN(RAW.length)} matrículas (o enunciado informa 820)`, ok: RAW.length === 820 },
      { t: 'Colunas batem com o dicionário de dados', d: `${Object.keys(RAW[0]).length} colunas no Excel · ${dicionario.colunas.length} no dicionário`, ok: Object.keys(RAW[0]).length === dicionario.colunas.length },
      { t: 'ID_Matricula é único e tem o formato BL#####', d: `${fmtN(new Set(ids).size)} IDs distintos em ${fmtN(ids.length)} linhas`, ok: new Set(ids).size === ids.length && ids.every((i) => /^BL\d{5}$/.test(i)) },
      { t: 'Datas válidas e dentro do período informado (set/2025 a jul/2026)', d: `de ${fmtData(datas[0])} a ${fmtData(datas[datas.length - 1])}`, ok: datas[0] >= '2025-09-01' && datas[datas.length - 1] <= '2026-07-31' },
      { t: 'Status só tem os 3 valores previstos', d: STATUSES.join(' · '), ok: RAW.every((r) => (STATUSES as readonly string[]).includes(r.Status)) },
      { t: 'Dispositivo só tem 3 valores', d: 'Celular · Computador · Tablet', ok: new Set(RAW.map((r) => r.Dispositivo_Principal)).size === 3 },
      { t: 'Motivo de evasão só aparece em quem evadiu', d: `${fmtN(evadidos.filter((r) => r.Motivo_Evasao).length)} de ${fmtN(evadidos.length)} evadidos têm motivo · ${motivosForaDeEvadido} fora de evadidos`, ok: motivosForaDeEvadido === 0 && evadidos.every((r) => r.Motivo_Evasao) },
      { t: 'Nota final só aparece em quem concluiu', d: `${notasForaDeConcluido} notas em matrículas não concluídas`, ok: notasForaDeConcluido === 0 },
      { t: 'Dias até o 1º acesso nunca é negativo', d: `mínimo = ${Math.min(...RAW.map((r) => r.Dias_Ate_Primeiro_Acesso))}`, ok: RAW.every((r) => r.Dias_Ate_Primeiro_Acesso >= 0) },
    ],
    avisos: [
      { t: 'Categoria_Curso deveria ter 5 valores', d: `tem ${P.categoria.grafiasAntes} grafias`, n: 1 },
      { t: 'Concluídos deveriam ter 100% do curso', d: `${concluidosFora100} concluídos com valor diferente de 100 (e ${P.pct.linhas - concluidosFora100} outras linhas > 100%)`, n: 2 },
      { t: 'Todo concluído deveria ter nota', d: `${P.nota.falhaRegistro} concluídos sem nota`, n: 3 },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Cartão de problema                                                  */
/* ------------------------------------------------------------------ */
function Problema({
  n,
  titulo,
  coluna,
  linhas,
  tipo,
  diagnostico,
  tratamento,
  medida,
  porque,
  children,
}: {
  n: number;
  titulo: string;
  coluna: string;
  linhas: string;
  tipo: string;
  diagnostico: ReactNode;
  tratamento: ReactNode;
  medida: string;
  porque: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card as="article" className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-base font-extrabold text-white">{n}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold sm:text-xl">{titulo}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tom="neutro">
              <code className="text-[11px]">{coluna}</code>
            </Badge>
            <Badge tom="bad">{tipo}</Badge>
            <Badge tom="accent">{linhas}</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <dl className="space-y-3 text-sm leading-relaxed">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Diagnóstico</dt>
            <dd>{diagnostico}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Tratamento</dt>
            <dd>{tratamento}</dd>
          </div>
          <div className="rounded-xl bg-brand-soft/60 p-3">
            <dt className="text-xs font-semibold tracking-wide text-brand-ink uppercase">Medida de resumo: {medida}</dt>
            <dd className="mt-1">{porque}</dd>
          </div>
        </dl>
        <div className="min-w-0">{children}</div>
      </div>
    </Card>
  );
}

const visivel = (s: string) => s.replace(/^ +| +$/g, (m) => '␣'.repeat(m.length));

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
export default function E2() {
  const v = validacoes();

  /* --- P1: categorias --- */
  const grafias = contar(RAW.map((r) => r.Categoria_Curso)).map((g) => ({
    grafia: g.nome,
    n: g.n,
    canon: ROWS.find((r) => r.categoriaOriginal === g.nome)!.categoria,
  }));
  grafias.sort((a, b) => a.canon.localeCompare(b.canon) || b.n - a.n);
  const catAntesDepois = CATEGORIAS.map((c) => ({
    nome: c,
    antes: RAW.filter((r) => r.Categoria_Curso === c).length,
    depois: ROWS.filter((r) => r.categoria === c).length,
  }));
  const modaCat = contar(ROWS.map((r) => r.categoria))[0];

  /* --- P2: % concluído --- */
  const BINS = ['0–20', '20–40', '40–60', '60–80', '80–100', '100', '> 100'];
  const bin = (x: number) => (x > 100 ? '> 100' : x === 100 ? '100' : BINS[Math.min(4, Math.floor(x / 20))]);
  const histPct = BINS.map((b) => ({
    nome: b,
    antes: RAW.filter((r) => bin(r.Pct_Concluido) === b).length,
    depois: ROWS.filter((r) => bin(r.pct) === b).length,
  }));
  const rowsPct = RAW.filter((r) => r.Pct_Concluido > 100);
  const porStatusPct = STATUSES.map((s) => ({ s, linhas: rowsPct.filter((r) => r.Status === s).length }));

  /* --- P3: nota --- */
  const notasValidas = RAW.filter((r) => r.Nota_Final != null).map((r) => r.Nota_Final as number);
  const skewNota = skewness(notasValidas);

  /* --- P4: dias --- */
  const diasTodos = RAW.map((r) => r.Dias_Ate_Primeiro_Acesso);
  const dist = Array.from({ length: P.dias.max + 1 }, (_, d) => ({
    nome: String(d),
    valor: diasTodos.filter((x) => x === d).length,
    fora: d > DIAS_CERCA,
  }));
  const skewDias = skewness(diasTodos);

  /* --- P5: motivos --- */
  const evad = ROWS.filter((r) => r.status === 'Evadido');
  const motivosCont = contar(evad.map((r) => r.motivo ?? 'vazio'));
  const informados = evad.length - P.motivo.naoInformado;
  const modaMotivo = motivosCont.find((m) => m.nome !== 'Não informado')!;

  /* --- resumo por variável --- */
  const modaDisp = contar(ROWS.map((r) => r.dispositivo))[0];
  const modaStatus = contar(ROWS.map((r) => r.status))[0];

  return (
    <>
      {/* ================= 1. Validação ================= */}
      <section>
        <SectionTitle eyebrow="Passo 1" title="Validando a base antes de mexer em qualquer coisa">
          Conferimos a base contra o que o enunciado e o dicionário prometem. O que passa está validado; o que não passa vira um problema a tratar.
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <ul className="divide-y divide-line">
              {v.ok.map((c) => (
                <li key={c.t} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                  <CheckCircle2 className={c.ok ? 'mt-0.5 size-4 shrink-0 text-ok' : 'mt-0.5 size-4 shrink-0 text-bad'} aria-hidden />
                  <div className="text-sm">
                    <p className="font-medium">{c.t}</p>
                    <p className="text-xs text-muted">{c.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-accent/40 bg-accent-soft/40">
            <p className="text-xs font-semibold tracking-wider text-ink/70 uppercase">Não passaram na validação</p>
            <ul className="mt-3 space-y-3">
              {v.avisos.map((a) => (
                <li key={a.t} className="flex gap-3 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="font-medium">{a.t}</p>
                    <p className="text-xs text-muted">
                      {a.d} → problema {a.n}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-accent/30 pt-3 text-xs text-muted">
              Além desses, há outliers em <code>Dias_Ate_Primeiro_Acesso</code> (problema 4) e motivos "Não informado" (problema 5).
            </p>
          </Card>
        </div>
      </section>

      {/* ================= 2. Problemas ================= */}
      <section className="space-y-5">
        <SectionTitle eyebrow="Passo 2" title="Problemas encontrados, tratamento e medida de resumo">
          Para cada problema: o diagnóstico, o que fizemos, e qual medida de resumo (média, mediana ou moda) usamos, com a justificativa. Nenhuma linha foi excluída.
        </SectionTitle>

        <Problema
          n={1}
          titulo="A mesma categoria escrita de várias formas"
          coluna="Categoria_Curso"
          tipo="Inconsistência de categoria"
          linhas={`${P.categoria.linhas} linhas afetadas`}
          diagnostico={
            <>
              {P.categoria.grafiasAntes} grafias para só {P.categoria.grafiasDepois} categorias: <code>TECNOLOGIA</code>, <code>tecnologia</code>, <code>marketing␣</code> (com espaço no final), <code>negocios</code>, <code>Negocios</code> (sem acento)… Contar frequências assim
              espalharia a mesma categoria em várias barras e subestimaria cada uma.
            </>
          }
          tratamento="Remover espaços, acentos e diferenças de maiúsculas e mapear cada grafia para o nome oficial da categoria."
          medida="moda"
          porque={
            <>
              Categoria é variável <strong>nominal</strong>: não há como somar nem ordenar, então só a moda faz sentido. Depois da padronização, a categoria mais frequente é{' '}
              <strong>{modaCat.nome}</strong> ({fmtN(modaCat.n)} matrículas, {fmtPct(modaCat.n / ROWS.length)}).
            </>
          }
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard titulo="Matrículas por categoria" tipo="Antes × depois">
              <AntesDepois horizontal dados={catAntesDepois} altura={250} rotuloAntes="Antes (grafia exata)" rotuloDepois="Depois" />
            </ChartCard>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Grafias encontradas</p>
              <Tabela className="max-h-72 overflow-auto">
                <thead>
                  <tr>
                    <th className={th}>No Excel</th>
                    <th className={th}>Vira</th>
                    <th className={`${th} text-right`}>Linhas</th>
                  </tr>
                </thead>
                <tbody>
                  {grafias.map((g) => (
                    <tr key={g.grafia} className={visivel(g.grafia) !== g.canon ? 'bg-accent-soft/50' : undefined}>
                      <td className={`${td} font-mono text-xs`}>{visivel(g.grafia)}</td>
                      <td className={td}>{g.canon}</td>
                      <td className={`${td} tnum text-right`}>{fmtN(g.n)}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            </div>
          </div>
        </Problema>

        <Problema
          n={2}
          titulo="Percentual concluído acima de 100%"
          coluna="Pct_Concluido"
          tipo="Valor impossível (erro de registro)"
          linhas={`${P.pct.linhas} linhas afetadas`}
          diagnostico={
            <>
              {P.pct.linhas} matrículas com <strong>{P.pct.valores.map((x) => fmtN(x)).join(', ')}%</strong> (valor idêntico: parece falha sistemática de registro). Ninguém conclui 140% de um curso. Por status:{' '}
              {porStatusPct.filter((x) => x.linhas).map((x) => `${x.linhas} ${x.s.toLowerCase()}`).join(', ')}.
            </>
          }
          tratamento={
            <>
              Substituir pela <strong>mediana do Pct_Concluido dos registros válidos do mesmo status</strong>: Concluído = {fmtN(PCT_MEDIANA_POR_STATUS['Concluído'], 1)}% · Em andamento = {fmtN(PCT_MEDIANA_POR_STATUS['Em andamento'], 1)}% · Evadido ={' '}
              {fmtN(PCT_MEDIANA_POR_STATUS['Evadido'], 1)}%.
            </>
          }
          medida="mediana (por status)"
          porque={
            <>
              O % concluído se divide em três grupos bem diferentes (concluídos ≈ 100, em andamento ≈ 50, evadidos ≈ 25), então a média geral ({fmtN(P.pct.mediaAntes, 1)}%) não representa
              ninguém e ainda é puxada pelos 140. A mediana de cada status é imune ao erro e respeita o grupo da matrícula.
            </>
          }
        >
          <ChartCard titulo="Distribuição do % concluído" tipo="Antes × depois" rodape={`Média: ${fmtN(P.pct.mediaAntes, 1)}% → ${fmtN(P.pct.mediaDepois, 1)}% · Mediana: ${fmtN(P.pct.medianaAntes, 1)}% → ${fmtN(P.pct.medianaDepois, 1)}% · Máximo: 140% → 100%`}>
            <AntesDepois dados={histPct} altura={250} />
          </ChartCard>
        </Problema>

        <Problema
          n={3}
          titulo="Nota final em branco"
          coluna="Nota_Final"
          tipo="Valores ausentes"
          linhas={`${fmtN(P.nota.vazias)} células vazias`}
          diagnostico={
            <>
              Dos {fmtN(P.nota.vazias)} vazios, <strong>{fmtN(P.nota.naoSeAplica)}</strong> são de quem não concluiu: nota <em>não se aplica</em> (não é dado faltante). Só{' '}
              <strong>{P.nota.falhaRegistro}</strong> são concluídos sem nota (falha de registro), isto é {fmtPct(P.nota.falhaRegistro / P.nota.concluidos)} dos concluídos.
            </>
          }
          tratamento={
            <>
              Os {fmtN(P.nota.naoSeAplica)} "não se aplica" continuam vazios. Os {P.nota.falhaRegistro} concluídos sem nota recebem a <strong>mediana das notas dos concluídos ({fmtN(NOTA_MEDIANA, 1)})</strong> e ficam
              marcados como imputados.
            </>
          }
          medida="mediana"
          porque={
            <>
              A nota é limitada de 0 a 10 e tem leve cauda para as notas baixas (assimetria {fmtN(skewNota, 2)}). A mediana é um valor real da escala e não é puxada pelos extremos. Como são só {fmtPct(P.nota.falhaRegistro / P.nota.concluidos)} dos
              concluídos, o impacto é mínimo: a média vai de {fmtN(P.nota.mediaAntes, 3)} para {fmtN(P.nota.mediaDepois, 3)}.
            </>
          }
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { v: fmtN(P.nota.naoSeAplica), l: 'não se aplica', s: 'ficam vazias', tom: 'text-ink' },
              { v: fmtN(P.nota.falhaRegistro), l: 'falha de registro', s: `imputadas = ${fmtN(NOTA_MEDIANA, 1)}`, tom: 'text-accent' },
              { v: fmtN(P.nota.concluidos - P.nota.falhaRegistro), l: 'notas válidas', s: 'inalteradas', tom: 'text-ok' },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-line p-3">
                <p className={`tnum font-display text-2xl font-extrabold ${c.tom}`}>{c.v}</p>
                <p className="text-xs font-medium">{c.l}</p>
                <p className="text-[11px] text-muted">{c.s}</p>
              </div>
            ))}
          </div>
          <Tabela className="mt-4">
            <thead>
              <tr>
                <th className={th}>Nota (concluídos)</th>
                <th className={`${th} text-right`}>Antes</th>
                <th className={`${th} text-right`}>Depois</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>Média</td>
                <td className={`${td} tnum text-right`}>{fmtN(P.nota.mediaAntes, 3)}</td>
                <td className={`${td} tnum text-right`}>{fmtN(P.nota.mediaDepois, 3)}</td>
              </tr>
              <tr>
                <td className={td}>Mediana</td>
                <td className={`${td} tnum text-right`}>{fmtN(median(notasValidas), 1)}</td>
                <td className={`${td} tnum text-right`}>{fmtN(median(ROWS.filter((r) => r.status === 'Concluído').map((r) => r.nota as number)), 1)}</td>
              </tr>
              <tr>
                <td className={td}>Concluídos com nota</td>
                <td className={`${td} tnum text-right`}>{fmtN(notasValidas.length)}</td>
                <td className={`${td} tnum text-right`}>{fmtN(P.nota.concluidos)}</td>
              </tr>
            </tbody>
          </Tabela>
        </Problema>

        <Problema
          n={4}
          titulo="Quem demora muito para o primeiro acesso (outliers)"
          coluna="Dias_Ate_Primeiro_Acesso"
          tipo="Outliers (valores atípicos)"
          linhas={`${P.dias.linhas} linhas (${fmtPct(P.dias.linhas / RAW.length)})`}
          diagnostico={
            <>
              Pela cerca de Tukey (Q3 + 1,5 × IQR = {fmtN(P.dias.cerca, 1)} dias), {P.dias.linhas} matrículas são atípicas, chegando a {P.dias.max} dias. Diferente do problema 2, aqui <strong>não é erro</strong>: é comportamento
              possível, de aluno que se matriculou e demorou a começar.
            </>
          }
          tratamento={
            <>
              <strong>Manter</strong> os valores e sinalizar nas tabelas. Removê-los apagaria exatamente o sinal que interessa: veremos na análise diagnóstica que quem passa de 8 dias evade muito mais.
            </>
          }
          medida="mediana"
          porque={
            <>
              Distribuição muito assimétrica à direita (assimetria {fmtN(skewDias, 1)}): média = {fmtN(P.dias.media, 2)} dias, mas mediana = {fmtN(P.dias.mediana, 0)} dias e moda = {P.dias.moda}. A média é puxada pela cauda;
              a mediana descreve o aluno típico (acessa em {fmtN(P.dias.mediana, 0)} dias).
            </>
          }
        >
          <ChartCard titulo="Dias até o primeiro acesso" tipo="Colunas" rodape={`Em vermelho: acima de ${fmtN(P.dias.cerca, 1)} dias (${P.dias.linhas} matrículas, mantidas).`}>
            <Distribuicao dados={dist} altura={250} />
          </ChartCard>
        </Problema>

        <Problema
          n={5}
          titulo={'Evasão sem motivo ("Não informado")'}
          coluna="Motivo_Evasao"
          tipo="Valor ausente disfarçado"
          linhas={`${P.motivo.naoInformado} de ${P.motivo.evadidos} evadidos`}
          diagnostico={
            <>
              {fmtPct(P.motivo.naoInformado / P.motivo.evadidos)} dos evadidos têm o motivo preenchido com o texto "Não informado": é um vazio escrito como categoria. Se entrasse no cálculo como motivo, inflaria uma "causa" que não existe.
            </>
          }
          tratamento={
            <>
              Manter como categoria própria (a linha continua sendo uma evasão) e calcular os percentuais de motivo sobre os <strong>{informados} evadidos com motivo informado</strong> quando a pergunta for "por quê?".
            </>
          }
          medida="moda"
          porque={
            <>
              Motivo é nominal, então a moda é a medida certa. O motivo mais frequente é <strong>{modaMotivo.nome}</strong>: {modaMotivo.n} evadidos ({fmtPct(modaMotivo.n / evad.length)} de todos os evadidos; {fmtPct(modaMotivo.n / informados)}{' '}
              dos que informaram).
            </>
          }
        >
          <Tabela>
            <thead>
              <tr>
                <th className={th}>Motivo</th>
                <th className={`${th} text-right`}>Evadidos</th>
                <th className={`${th} text-right`}>% de todos</th>
                <th className={`${th} text-right`}>% dos informados</th>
              </tr>
            </thead>
            <tbody>
              {motivosCont.map((m) => (
                <tr key={m.nome} className={m.nome === 'Não informado' ? 'bg-accent-soft/50' : undefined}>
                  <td className={td}>{m.nome}</td>
                  <td className={`${td} tnum text-right`}>{fmtN(m.n)}</td>
                  <td className={`${td} tnum text-right`}>{fmtPct(m.n / evad.length)}</td>
                  <td className={`${td} tnum text-right`}>{m.nome === 'Não informado' ? '—' : fmtPct(m.n / informados)}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Problema>
      </section>

      {/* ================= 3. Medidas de resumo ================= */}
      <section>
        <SectionTitle eyebrow="Passo 3" title="Qual medida de resumo para cada variável">
          Regra do grupo: <strong>categoria → moda</strong> · <strong>número simétrico, sem outliers → média</strong> · <strong>número assimétrico ou com outliers/erros → mediana</strong>.
        </SectionTitle>
        <Tabela>
          <thead>
            <tr>
              <th className={th}>Variável</th>
              <th className={th}>Tipo</th>
              <th className={th}>O que a distribuição mostra</th>
              <th className={th}>Medida</th>
              <th className={th}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[
              { v: 'Categoria_Curso', t: 'Nominal', d: `5 categorias, bem distribuídas (mín. ${fmtPct(Math.min(...CATEGORIAS.map((c) => ROWS.filter((r) => r.categoria === c).length)) / ROWS.length, 0)}, máx. ${fmtPct(modaCat.n / ROWS.length, 0)})`, m: 'Moda', val: `${modaCat.nome} (${fmtPct(modaCat.n / ROWS.length)})` },
              { v: 'Dispositivo_Principal', t: 'Nominal', d: '3 dispositivos; celular é metade da base', m: 'Moda', val: `${modaDisp.nome} (${fmtPct(modaDisp.n / ROWS.length)})` },
              { v: 'Status', t: 'Nominal', d: 'concluído, em andamento e evadido', m: 'Moda', val: `${modaStatus.nome} (${fmtPct(modaStatus.n / ROWS.length)})` },
              { v: 'Motivo_Evasao', t: 'Nominal', d: `5 motivos; ${fmtPct(P.motivo.naoInformado / P.motivo.evadidos, 0)} não informados`, m: 'Moda', val: `${modaMotivo.nome} (${fmtPct(modaMotivo.n / informados)} dos informados)` },
              { v: 'Pct_Concluido', t: 'Numérica', d: `3 grupos distintos por status; erro de 140% em ${P.pct.linhas} linhas`, m: 'Mediana por status', val: `${fmtN(PCT_MEDIANA_POR_STATUS['Concluído'], 0)} / ${fmtN(PCT_MEDIANA_POR_STATUS['Em andamento'], 1)} / ${fmtN(PCT_MEDIANA_POR_STATUS['Evadido'], 1)}%` },
              { v: 'Nota_Final', t: 'Numérica (0–10)', d: `quase simétrica (assimetria ${fmtN(skewNota, 2)}); média ${fmtN(mean(notasValidas), 2)} ≈ mediana ${fmtN(median(notasValidas), 1)}`, m: 'Mediana', val: fmtN(NOTA_MEDIANA, 1) },
              { v: 'Dias_Ate_Primeiro_Acesso', t: 'Numérica', d: `assimétrica à direita (${fmtN(skewDias, 1)}); ${P.dias.linhas} outliers; moda = ${mode(diasTodos)}`, m: 'Mediana', val: `${fmtN(median(diasTodos), 0)} dias (média ${fmtN(mean(diasTodos), 1)})` },
            ].map((l) => (
              <tr key={l.v}>
                <td className={`${td} font-mono text-xs font-semibold`}>{l.v}</td>
                <td className={td}>{l.t}</td>
                <td className={`${td} text-muted`}>{l.d}</td>
                <td className={td}>
                  <Badge tom="brand">{l.m}</Badge>
                </td>
                <td className={`${td} tnum font-semibold`}>{l.val}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </section>

      {/* ================= 4. Antes x depois ================= */}
      <section>
        <SectionTitle eyebrow="Passo 4" title="Antes × depois" />
        <Tabela>
          <thead>
            <tr>
              <th className={th}>Indicador</th>
              <th className={`${th} text-right`}>Antes (bruto)</th>
              <th className={`${th} text-right`}>Depois (tratado)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Linhas na base', fmtN(RAW.length), fmtN(ROWS.length) + ' (nenhuma excluída)'],
              ['Grafias de Categoria_Curso', String(P.categoria.grafiasAntes), String(P.categoria.grafiasDepois)],
              ['Pct_Concluido: valor máximo', fmtPctPonto(Math.max(...RAW.map((r) => r.Pct_Concluido)), 0), fmtPctPonto(Math.max(...ROWS.map((r) => r.pct)), 0)],
              ['Pct_Concluido: média', fmtPctPonto(P.pct.mediaAntes, 2), fmtPctPonto(P.pct.mediaDepois, 2)],
              ['Pct_Concluido: mediana', fmtPctPonto(P.pct.medianaAntes, 1), fmtPctPonto(P.pct.medianaDepois, 1)],
              ['Concluídos sem nota', fmtN(P.nota.falhaRegistro), '0'],
              ['Nota média dos concluídos', fmtN(P.nota.mediaAntes, 3), fmtN(P.nota.mediaDepois, 3)],
              ['Dias até 1º acesso: outliers', fmtN(P.dias.linhas), fmtN(P.dias.linhas) + ' (mantidos)'],
            ].map(([a, b, c]) => (
              <tr key={a}>
                <td className={td}>{a}</td>
                <td className={`${td} tnum text-right text-muted`}>{b}</td>
                <td className={`${td} tnum text-right font-semibold`}>{c}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
        <Callout tipo="aviso" titulo="Limite importante: quem está 'Em andamento' ainda não tem desfecho" className="mt-5">
          {fmtN(ROWS.filter((r) => r.status === 'Em andamento').length)} matrículas ({fmtPct(ROWS.filter((r) => r.status === 'Em andamento').length / ROWS.length)}) não terminaram nem evadiram. Isso não é "sujeira" a limpar, mas
          muda a leitura da taxa de evasão: por isso o dashboard oferece também a taxa só entre as encerradas.
        </Callout>
        <p className="mt-4 text-sm text-muted">
          Quer ver cada correção linha a linha? Na <a className="font-semibold text-brand-ink underline" href={href('dados')}>Base de dados</a>, alterne entre
          "Dados brutos" e "Dados tratados" ou filtre por "Alerta de qualidade".
        </p>
      </section>
    </>
  );
}
