/** Exporta linhas para CSV com ";" e BOM UTF-8 (abre direto no Excel em pt-BR). */
export function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number | null)[][]): void {
  const esc = (v: string | number | null) => {
    if (v == null) return '';
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const corpo = [cabecalho, ...linhas].map((l) => l.map(esc).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + corpo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
