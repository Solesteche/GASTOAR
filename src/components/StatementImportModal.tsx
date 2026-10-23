import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Check,
  Loader2,
  Trash2,
} from 'lucide-react';
import { CategoryMap, CoupleProfile, PaymentMethod, Transaction } from '../types';

export interface CandidateImportRow {
  tempId: string;
  selected: boolean;
  fecha: string;
  concepto: string;
  monto: number;
  moneda: 'ARS' | 'USD';
  tipoTransaccion: 'gasto' | 'ingreso';
  categoria: string;
  subcategoria: string;
  metodoPago: PaymentMethod;
  tipo: 'individual' | 'pareja';
  esCuotas: boolean;
  cuotaActual: number;
  cuotasTotal: number;
  tarjetaNombre?: string;
}

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryMap: CategoryMap;
  profile: CoupleProfile;
  defaultPaymentMethod?: PaymentMethod;
  onImportTransactions: (items: Partial<Transaction>[]) => void;
  onShowToast?: (msg: string) => void;
}

const guessCategoryFromConcept = (
  concept: string,
  categoryMap: CategoryMap
): { categoria: string; subcategoria: string } => {
  const lower = concept.toLowerCase();
  const categories = Object.keys(categoryMap);
  const pick = (preferred: string[]) => {
    for (const p of preferred) {
      const match = categories.find((c) => c.toLowerCase().includes(p.toLowerCase()));
      if (match) {
        return {
          categoria: match,
          subcategoria: categoryMap[match]?.[0] || 'General',
        };
      }
    }
    const fallback = categories[0] || 'Otros';
    return {
      categoria: fallback,
      subcategoria: categoryMap[fallback]?.[0] || 'General',
    };
  };

  if (/coto|carrefour|jumbo|dia%|vea|changomas|supermercado|almacen|carniceria|verduleria/.test(lower)) {
    return pick(['Supermercado', 'Alimentación', 'Comida']);
  }
  if (/pedidosya|rappi|restaurante|cafe|starbucks|mcdonald|burger|heladeria|bar/.test(lower)) {
    return pick(['Salidas', 'Gastronomía', 'Alimentación', 'Comida']);
  }
  if (/ypf|shell|axion|cabal|sube|uber|cabify|didi|peaje|estacionamiento/.test(lower)) {
    return pick(['Transporte', 'Auto', 'Movilidad']);
  }
  if (/edesur|edenor|metrogas|aysa|personal|movistar|claro|fibertel|telecentro|expensas|alquiler/.test(lower)) {
    return pick(['Servicios', 'Hogar', 'Vivienda']);
  }
  if (/netflix|spotify|disney|youtube|google|apple|amazon|steam|chatgpt/.test(lower)) {
    return pick(['Suscripciones', 'Entretenimiento', 'Servicios']);
  }
  if (/farmacity|osde|swiss|galeno|farmacia|medico|odontologo/.test(lower)) {
    return pick(['Salud']);
  }
  return pick(['Otros', 'Compras', 'General']);
};

const parseArgentineNumber = (raw: string): number => {
  if (!raw) return 0;
  let cleaned = raw.replace(/[^0-9,.-]/g, '').trim();
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastDot !== -1 && /\.\d{3}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '');
  }
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const normalizeIsoDate = (raw: string): string => {
  const today = new Date().toISOString().split('T')[0];
  if (!raw) return today;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${y}-${m}-${d}`;
  }
  return today;
};

const extractInstallmentFromText = (
  text: string
): { esCuotas: boolean; cuotaActual: number; cuotasTotal: number } => {
  const m =
    text.match(/(?:cuota|c\.?)\s*(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})/i) ||
    text.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (m) {
    const curr = parseInt(m[1], 10);
    const tot = parseInt(m[2], 10);
    if (curr >= 1 && tot >= 2 && curr <= tot && tot <= 48) {
      return { esCuotas: true, cuotaActual: curr, cuotasTotal: tot };
    }
  }
  return { esCuotas: false, cuotaActual: 1, cuotasTotal: 1 };
};

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  isOpen,
  onClose,
  categoryMap,
  profile,
  defaultPaymentMethod = 'Crédito',
  onImportTransactions,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'smart'>('csv');
  const [rawText, setRawText] = useState('');
  const [cardLabel, setCardLabel] = useState('Visa');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<CandidateImportRow[]>([]);

  if (!isOpen) return null;

  const parseCsvClientSide = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setErrorMsg('El archivo no contiene filas suficientes para importar.');
      return;
    }

    const delimiter = lines[0].includes(';')
      ? ';'
      : lines[0].includes('\t')
      ? '\t'
      : ',';

    const splitLine = (line: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
    const idxDate = headers.findIndex((h) => /fecha|date|dia/.test(h));
    const idxConcept = headers.findIndex((h) =>
      /descrip|concepto|detalle|comercio|merchant|motivo|referencia|titulo/.test(h)
    );
    const idxAmount = headers.findIndex((h) =>
      /monto|importe|valor|total|neto|amount|pesos/.test(h)
    );
    const idxUsd = headers.findIndex((h) => /usd|dolar|u\$s/.test(h));

    const parsed: CandidateImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      if (cols.length < 2) continue;

      const rawDate = idxDate >= 0 ? cols[idxDate] : cols[0];
      const rawConcept =
        idxConcept >= 0 ? cols[idxConcept] : cols[1] || 'Movimiento importado';
      const rawAmt =
        idxAmount >= 0
          ? cols[idxAmount]
          : cols[cols.length - 1] || '0';
      const rawUsdVal = idxUsd >= 0 ? parseArgentineNumber(cols[idxUsd]) : 0;

      let numericAmt = parseArgentineNumber(rawAmt);
      let moneda: 'ARS' | 'USD' = 'ARS';
      if (Math.abs(numericAmt) === 0 && Math.abs(rawUsdVal) > 0) {
        numericAmt = rawUsdVal;
        moneda = 'USD';
      } else if (/u\$s|usd/i.test(rawConcept) || /u\$s|usd/i.test(rawAmt)) {
        moneda = 'USD';
      }

      if (Math.abs(numericAmt) < 0.01) continue;

      const inst = extractInstallmentFromText(rawConcept);
      const guessed = guessCategoryFromConcept(rawConcept, categoryMap);
      const isIncome =
        /sueldo|haberes|transferencia recibida|rendimiento|acred/i.test(rawConcept) &&
        numericAmt > 0;

      parsed.push({
        tempId: `imp_${Date.now()}_${i}`,
        selected: true,
        fecha: normalizeIsoDate(rawDate),
        concepto: rawConcept.replace(/\s+/g, ' ').slice(0, 90),
        monto: Math.abs(numericAmt),
        moneda,
        tipoTransaccion: isIncome ? 'ingreso' : 'gasto',
        categoria: guessed.categoria,
        subcategoria: guessed.subcategoria,
        metodoPago: (inst.esCuotas ? 'Crédito' : (defaultPaymentMethod || 'Crédito')) as PaymentMethod,
        tipo: 'individual',
        esCuotas: inst.esCuotas,
        cuotaActual: inst.cuotaActual,
        cuotasTotal: inst.cuotasTotal,
        tarjetaNombre: inst.esCuotas ? cardLabel : undefined,
      });
    }

    if (parsed.length === 0) {
      setErrorMsg('No pudimos detectar montos válidos en ese CSV. Probá la pestaña Texto / Foto.');
    } else {
      setErrorMsg(null);
      setRows(parsed);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        parseCsvClientSide(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const analyzeViaServer = async (payload: {
    text?: string;
    fileDataUrl?: string;
    mimeType?: string;
  }) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const resp = await fetch('/api/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          categories: Object.keys(categoryMap),
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        throw new Error(json.error || 'No se pudo analizar el resumen.');
      }

      const items: CandidateImportRow[] = (json.items || []).map(
        (it: any, idx: number) => {
          const concept = String(it.concepto || 'Consumo importado').trim();
          const inst = extractInstallmentFromText(concept);
          const esCuotas = Boolean(it.esCuotas || inst.esCuotas);
          const cuotasTotal = Number(it.cuotasTotal) || inst.cuotasTotal || 1;
          const cuotaActual = Number(it.cuotaActual) || inst.cuotaActual || 1;
          const guessed = guessCategoryFromConcept(concept, categoryMap);
          const validCat =
            it.categoria && categoryMap[it.categoria]
              ? it.categoria
              : guessed.categoria;

          return {
            tempId: `ai_${Date.now()}_${idx}`,
            selected: true,
            fecha: normalizeIsoDate(it.fecha),
            concepto: concept,
            monto: Math.abs(Number(it.monto) || 0),
            moneda: it.moneda === 'USD' ? 'USD' : 'ARS',
            tipoTransaccion: it.tipoTransaccion === 'ingreso' ? 'ingreso' : 'gasto',
            categoria: validCat,
            subcategoria: categoryMap[validCat]?.[0] || 'General',
            metodoPago: esCuotas ? 'Crédito' : defaultPaymentMethod,
            tipo: 'individual',
            esCuotas,
            cuotaActual,
            cuotasTotal,
            tarjetaNombre: esCuotas ? cardLabel : undefined,
          };
        }
      );

      if (items.length === 0) {
        setErrorMsg('No se detectaron consumos en el archivo o texto ingresado.');
      } else {
        setRows(items);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al analizar el resumen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageOrPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        analyzeViaServer({
          fileDataUrl: reader.result,
          mimeType: file.type || 'image/jpeg',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  const handleConfirmImport = () => {
    const chosen = rows.filter((r) => r.selected && r.monto > 0);
    if (chosen.length === 0) return;

    const payer =
      profile.currentUser === 'user2' ? profile.user2Name : profile.user1Name;

    const mapped: Partial<Transaction>[] = chosen.map((r) => {
      const totalAmount =
        r.esCuotas && r.cuotasTotal > 1 ? r.monto * r.cuotasTotal : r.monto;
      return {
        concepto: r.concepto,
        monto: totalAmount,
        moneda: r.moneda,
        categoria: r.categoria,
        subcategoria: r.subcategoria,
        fecha: r.fecha,
        tipo: r.tipo,
        tipoTransaccion: r.tipoTransaccion,
        pagadoPor: payer,
        splitType: r.tipo === 'pareja' ? profile.defaultSplit : undefined,
        metodoPago: r.metodoPago,
        esCuotas: r.esCuotas,
        cuotasTotal: r.esCuotas ? r.cuotasTotal : undefined,
        cuotaActual: r.esCuotas ? r.cuotaActual : undefined,
        montoCuota: r.esCuotas ? r.monto : undefined,
        tarjetaNombre: r.esCuotas ? r.tarjetaNombre || cardLabel : undefined,
        primerMesCuota: r.esCuotas ? r.fecha.slice(0, 7) : undefined,
      };
    });

    onImportTransactions(mapped);
    onShowToast?.(`${mapped.length} movimientos importados con éxito`);
    setRows([]);
    setRawText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Importar Resumen o Comprobante
            </h2>
            <p className="text-xs text-slate-500">
              Subí CSV de Mercado Pago / Banco, foto de ticket o pegá las líneas de tu resumen de tarjeta
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {rows.length === 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('csv')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'csv'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Archivo CSV / Excel (.csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('smart')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'smart'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Foto de Ticket / PDF / Texto de Resumen
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">
                    Tarjeta p/ cuotas:
                  </label>
                  <input
                    type="text"
                    value={cardLabel}
                    onChange={(e) => setCardLabel(e.target.value)}
                    placeholder="Visa Galicia"
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 w-36"
                  />
                </div>
              </div>

              {activeTab === 'csv' ? (
                <label className="border-2 border-dashed border-slate-200 hover:border-[#6936F5] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/60">
                  <FileSpreadsheet className="w-10 h-10 text-[#6936F5] mb-3" />
                  <span className="text-sm font-bold text-slate-800">
                    Seleccionar archivo CSV o TSV
                  </span>
                  <span className="text-xs text-slate-500 mt-1 max-w-md">
                    Compatible con exportaciones de Mercado Pago, Santander, Galicia, BBVA, Brubank y Ualá. Detecta fechas, montos en ARS/USD y cuotas automáticamente.
                  </span>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#6936F5] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/60">
                    {isAnalyzing ? (
                      <Loader2 className="w-8 h-8 text-[#6936F5] animate-spin mb-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#6936F5] mb-2" />
                    )}
                    <span className="text-sm font-bold text-slate-800">
                      {isAnalyzing
                        ? 'Extrayendo movimientos del documento...'
                        : 'Subir foto de ticket, captura o resumen PDF'}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      JPG, PNG, WEBP o PDF — podrás revisar y editar cada fila antes de guardar
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={isAnalyzing}
                      onChange={handleImageOrPdfUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      O pegá directamente las líneas copiadas de tu resumen bancario:
                    </label>
                    <textarea
                      rows={5}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder={`Ejemplo:\n12/04/2026 MERPAGO*SUPERMERCADO COTO $ 48.500,00\n15/04/2026 TIENDA MIA CUOTA 02/06 $ 22.900,00`}
                      className="w-full p-3.5 text-xs font-mono rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6936F5]/25"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!rawText.trim() || isAnalyzing}
                        onClick={() => analyzeViaServer({ text: rawText })}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6936F5] hover:bg-[#5b2bd9] text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span>Detectar movimientos</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  Revisá los {rows.length} movimientos detectados ({selectedCount} seleccionados)
                </p>
                <button
                  type="button"
                  onClick={() => setRows([])}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  ← Cargar otro archivo
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase">
                    <tr>
                      <th className="p-2.5 w-8">
                        <input
                          type="checkbox"
                          checked={selectedCount === rows.length}
                          onChange={(e) =>
                            setRows(rows.map((r) => ({ ...r, selected: e.target.checked })))
                          }
                        />
                      </th>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Concepto</th>
                      <th className="p-2.5">Monto / Cuota</th>
                      <th className="p-2.5">Categoría</th>
                      <th className="p-2.5">Modo</th>
                      <th className="p-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr key={r.tempId} className={!r.selected ? 'opacity-45' : ''}>
                        <td className="p-2.5">
                          <input
                            type="checkbox"
                            checked={r.selected}
                            onChange={(e) =>
                              setRows(
                                rows.map((it) =>
                                  it.tempId === r.tempId
                                    ? { ...it, selected: e.target.checked }
                                    : it
                                )
                              )
                            }
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="date"
                            value={r.fecha}
                            onChange={(e) =>
                              setRows(
                                rows.map((it) =>
                                  it.tempId === r.tempId
                                    ? { ...it, fecha: e.target.value }
                                    : it
                                )
                              )
                            }
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2.5 min-w-[180px]">
                          <input
                            type="text"
                            value={r.concepto}
                            onChange={(e) =>
                              setRows(
                                rows.map((it) =>
                                  it.tempId === r.tempId
                                    ? { ...it, concepto: e.target.value }
                                    : it
                                )
                              )
                            }
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                          />
                          {r.esCuotas && (
                            <span className="text-[11px] text-[#6936F5] block mt-0.5">
                              Cuota {r.cuotaActual}/{r.cuotasTotal} ({cardLabel})
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <select
                              value={r.moneda}
                              onChange={(e) =>
                                setRows(
                                  rows.map((it) =>
                                    it.tempId === r.tempId
                                      ? { ...it, moneda: e.target.value as 'ARS' | 'USD' }
                                      : it
                                  )
                                )
                              }
                              className="px-1.5 py-1 border border-slate-200 rounded-lg text-xs bg-white"
                            >
                              <option value="ARS">$</option>
                              <option value="USD">US$</option>
                            </select>
                            <input
                              type="number"
                              step="any"
                              value={r.monto}
                              onChange={(e) =>
                                setRows(
                                  rows.map((it) =>
                                    it.tempId === r.tempId
                                      ? { ...it, monto: parseFloat(e.target.value) || 0 }
                                      : it
                                  )
                                )
                              }
                              className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold tabular-nums"
                            />
                          </div>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={r.categoria}
                            onChange={(e) => {
                              const nextCat = e.target.value;
                              setRows(
                                rows.map((it) =>
                                  it.tempId === r.tempId
                                    ? {
                                        ...it,
                                        categoria: nextCat,
                                        subcategoria: categoryMap[nextCat]?.[0] || 'General',
                                      }
                                    : it
                                )
                              );
                            }}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white"
                          >
                            {Object.keys(categoryMap).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={r.tipo}
                            onChange={(e) =>
                              setRows(
                                rows.map((it) =>
                                  it.tempId === r.tempId
                                    ? {
                                        ...it,
                                        tipo: e.target.value as 'individual' | 'pareja',
                                      }
                                    : it
                                )
                              )
                            }
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white"
                          >
                            <option value="individual">Personal</option>
                            <option value="pareja">Compartido</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setRows(rows.filter((it) => it.tempId !== r.tempId))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60"
          >
            Cerrar
          </button>
          {rows.length > 0 && (
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6936F5] hover:bg-[#5b2bd9] text-white text-xs sm:text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Importar {selectedCount} movimientos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
