import React, { useMemo, useState } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet } from 'lucide-react';
import { CoupleProfile, Transaction } from '../types';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  profile: CoupleProfile;
  defaultMonth?: string; // YYYY-MM
  onShowToast?: (msg: string) => void;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  profile,
  defaultMonth,
  onShowToast,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(
    defaultMonth || new Date().toISOString().slice(0, 7)
  );
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const report = useMemo(() => {
    const activeTxs = transactions.filter(
      (tx) => !tx.deletedAt && tx.fecha.startsWith(selectedMonth)
    );

    let ingresosArs = 0;
    let gastosArs = 0;
    let gastosUsd = 0;
    let cuotasCount = 0;
    let sharedTotal = 0;
    let user1PaidShared = 0;
    let user2PaidShared = 0;
    let user1Share = 0;
    let user2Share = 0;

    const byCategory = new Map<string, number>();

    for (const tx of activeTxs) {
      const effectiveAmt =
        tx.esCuotas && tx.montoCuota && tx.montoCuota > 0 ? tx.montoCuota : tx.monto;

      if (tx.tipoTransaccion === 'ingreso') {
        if (tx.moneda !== 'USD') ingresosArs += effectiveAmt;
        continue;
      }

      if (tx.moneda === 'USD') {
        gastosUsd += effectiveAmt;
      } else {
        gastosArs += effectiveAmt;
        byCategory.set(tx.categoria, (byCategory.get(tx.categoria) || 0) + effectiveAmt);
      }

      if (tx.esCuotas) cuotasCount += 1;

      if (tx.tipo === 'pareja' && tx.moneda !== 'USD') {
        sharedTotal += effectiveAmt;
        const paidByU2 = tx.pagadoPor === profile.user2Name;
        if (paidByU2) user2PaidShared += effectiveAmt;
        else user1PaidShared += effectiveAmt;

        let u1Pct = 50;
        if (tx.splitType === '60_40') u1Pct = 60;
        else if (tx.splitType === '70_30') u1Pct = 70;
        else if (tx.splitType === '100_user1') u1Pct = 100;
        else if (tx.splitType === '100_user2') u1Pct = 0;
        else if (tx.splitType === 'custom_percent' && typeof tx.user1Percent === 'number') {
          u1Pct = tx.user1Percent;
        }

        if (tx.splitType === 'custom_amount' && typeof tx.user1Amount === 'number') {
          user1Share += tx.user1Amount;
          user2Share += Math.max(0, effectiveAmt - tx.user1Amount);
        } else {
          const s1 = (effectiveAmt * u1Pct) / 100;
          user1Share += s1;
          user2Share += effectiveAmt - s1;
        }
      }
    }

    const netBalance = ingresosArs - gastosArs;
    const savingsRate =
      ingresosArs > 0 ? Math.round(((ingresosArs - gastosArs) / ingresosArs) * 100) : 0;

    // Positive diff => user2 owes user1
    const user1Net = user1PaidShared - user1Share;
    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      txCount: activeTxs.length,
      ingresosArs,
      gastosArs,
      gastosUsd,
      netBalance,
      savingsRate,
      cuotasCount,
      sharedTotal,
      user1PaidShared,
      user2PaidShared,
      user1Net,
      topCategories,
      activeTxs,
    };
  }, [transactions, selectedMonth, profile]);

  if (!isOpen) return null;

  const fmtArs = (n: number) =>
    `${n < 0 ? '-' : ''}$ ${Math.abs(Math.round(n)).toLocaleString('es-AR')}`;

  const settlementSentence =
    Math.abs(report.user1Net) < 10
      ? 'Cuentas compartidas saldadas al día ($ 0)'
      : report.user1Net > 0
      ? `${profile.user2Name} le debe ${fmtArs(report.user1Net)} a ${profile.user1Name}`
      : `${profile.user1Name} le debe ${fmtArs(Math.abs(report.user1Net))} a ${profile.user2Name}`;

  const buildWhatsAppSummary = () => {
    const lines = [
      `*Resumen GastoAR — ${selectedMonth}*`,
      `• Ingresos: ${fmtArs(report.ingresosArs)}`,
      `• Gastos ARS: ${fmtArs(report.gastosArs)}${
        report.gastosUsd > 0 ? ` | USD: US$ ${report.gastosUsd.toFixed(2)}` : ''
      }`,
      `• Balance neto: ${fmtArs(report.netBalance)}`,
      '',
      `*Gastos Compartidos (${profile.user1Name} & ${profile.user2Name})*`,
      `• Total compartido: ${fmtArs(report.sharedTotal)}`,
      `• Pagó ${profile.user1Name}: ${fmtArs(report.user1PaidShared)}`,
      `• Pagó ${profile.user2Name}: ${fmtArs(report.user2PaidShared)}`,
      `👉 *Liquidación:* ${settlementSentence}`,
    ];
    if (report.topCategories.length > 0) {
      lines.push('', '*Top Categorías:*');
      for (const [cat, amt] of report.topCategories.slice(0, 3)) {
        lines.push(`- ${cat}: ${fmtArs(amt)}`);
      }
    }
    return lines.join('\n');
  };

  const handleCopyWhatsApp = async () => {
    const text = buildWhatsAppSummary();
    await navigator.clipboard?.writeText(text);
    setCopiedWhatsApp(true);
    onShowToast?.('Resumen listo para pegar en WhatsApp');
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const handleDownloadHtmlReport = () => {
    const rowsHtml = report.activeTxs
      .map(
        (t) => `<tr>
          <td>${t.fecha}</td>
          <td>${t.concepto}</td>
          <td>${t.categoria}</td>
          <td>${t.tipo === 'pareja' ? 'Compartido' : 'Personal'}</td>
          <td style="text-align:right;font-weight:600;">${
            t.tipoTransaccion === 'ingreso' ? '+' : '-'
          }${t.moneda === 'USD' ? 'US$ ' : '$ '}${(
          t.esCuotas && t.montoCuota ? t.montoCuota : t.monto
        ).toLocaleString('es-AR')}</td>
        </tr>`
      )
      .join('');

    const html = `<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8" />
  <title>Reporte Mensual GastoAR - ${selectedMonth}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 860px; margin: 32px auto; padding: 0 20px; }
    .hero { background: linear-gradient(135deg, #4C1D95, #6D3FEA); color: #fff; padding: 24px 28px; border-radius: 20px; margin-bottom: 24px; }
    .hero h1 { margin: 0 0 6px; font-size: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .val { font-size: 20px; font-weight: 800; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; }
    th { color: #64748b; font-size: 11px; text-transform: uppercase; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Reporte Ejecutivo GastoAR — ${selectedMonth}</h1>
    <div>${profile.user1Name} &amp; ${profile.user2Name} · Generado el ${new Date().toLocaleDateString('es-AR')}</div>
  </div>
  <div class="grid">
    <div class="card"><div class="label">Ingresos ARS</div><div class="val">${fmtArs(report.ingresosArs)}</div></div>
    <div class="card"><div class="label">Gastos ARS</div><div class="val">${fmtArs(report.gastosArs)}</div></div>
    <div class="card"><div class="label">Balance Neto</div><div class="val">${fmtArs(report.netBalance)}</div></div>
  </div>
  <div class="card" style="margin-bottom:24px;">
    <div class="label">Liquidación Compartida</div>
    <div class="val" style="font-size:16px;">${settlementSentence}</div>
    <div style="font-size:12px;color:#64748b;margin-top:4px;">Total compartido: ${fmtArs(report.sharedTotal)} (${profile.user1Name}: ${fmtArs(report.user1PaidShared)} · ${profile.user2Name}: ${fmtArs(report.user2PaidShared)})</div>
  </div>
  <h3>Detalle de movimientos (${report.txCount})</h3>
  <table>
    <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Modo</th><th style="text-align:right;">Importe</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte-GastoAR-${selectedMonth}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast?.(`Reporte ${selectedMonth} descargado (abrilo e imprimí como PDF)`);
  };

  const handleDownloadCsv = () => {
    const header = 'Fecha,Concepto,Categoria,Subcategoria,Tipo,Moneda,Monto,PagadoPor,MetodoPago\n';
    const body = report.activeTxs
      .map((t) =>
        [
          t.fecha,
          `"${(t.concepto || '').replace(/"/g, '""')}"`,
          `"${t.categoria}"`,
          `"${t.subcategoria || ''}"`,
          t.tipo,
          t.moneda || 'ARS',
          t.esCuotas && t.montoCuota ? t.montoCuota : t.monto,
          `"${t.pagadoPor || ''}"`,
          `"${t.metodoPago || ''}"`,
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Movimientos-GastoAR-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast?.('CSV mensual descargado');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Cierre Mensual y Liquidación
            </h2>
            <p className="text-xs text-slate-500">
              Resumen listo para enviar por WhatsApp o archivar en PDF/HTML
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div
            className="rounded-2xl p-5 text-white"
            style={{
              background: 'linear-gradient(135deg, #4C1D95 0%, #6D3FEA 55%, #7C3AED 100%)',
            }}
          >
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
              Balance Neto {selectedMonth}
            </p>
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums mt-0.5">
              {fmtArs(report.netBalance)}
            </div>
            <div className="mt-3 pt-3 border-t border-white/15 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/85">
              <span>Ingresos: {fmtArs(report.ingresosArs)}</span>
              <span aria-hidden="true">•</span>
              <span>Gastos: {fmtArs(report.gastosArs)}</span>
              <span aria-hidden="true">•</span>
              <span>Tasa ahorro: {report.savingsRate}%</span>
              <span aria-hidden="true">•</span>
              <span>{report.cuotasCount} cuotas activas</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estado de Pareja ({profile.user1Name} & {profile.user2Name})
            </p>
            <p className="text-sm font-bold text-slate-900">{settlementSentence}</p>
            <p className="text-xs text-slate-500">
              Total compartido: {fmtArs(report.sharedTotal)} · Pagó {profile.user1Name}:{' '}
              {fmtArs(report.user1PaidShared)} · Pagó {profile.user2Name}:{' '}
              {fmtArs(report.user2PaidShared)}
            </p>
          </div>

          {report.topCategories.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Principales rubros del mes
              </p>
              <div className="space-y-1.5">
                {report.topCategories.map(([cat, amt]) => {
                  const pct =
                    report.gastosArs > 0 ? Math.round((amt / report.gastosArs) * 100) : 0;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-slate-700">{cat}</span>
                      <span className="tabular-nums font-semibold text-slate-900">
                        {fmtArs(amt)} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>CSV Excel</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadHtmlReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-[#6936F5]" />
              <span>Descargar Reporte PDF/HTML</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6936F5] hover:bg-[#5b2bd9] text-white text-xs font-semibold shadow-sm"
            >
              {copiedWhatsApp ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>
                {copiedWhatsApp ? '¡Copiado!' : 'Copiar resumen WhatsApp'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
