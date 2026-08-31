import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Camera, 
  MessageSquare, 
  Lightbulb, 
  Upload, 
  CheckCircle, 
  Loader2, 
  PlusCircle, 
  ArrowRight,
  Receipt,
  BrainCircuit,
  FileCheck
} from 'lucide-react';
import { Budgets, CategoryMap, CoupleProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Partial<Transaction>) => void;
  categoryMap: CategoryMap;
  profile: CoupleProfile;
  transactions: Transaction[];
  budgets: Budgets;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  categoryMap,
  profile,
  transactions,
  budgets,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'text' | 'advisor'>('receipt');
  const [loading, setLoading] = useState(false);
  const [receiptImageBase64, setReceiptImageBase64] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [advisorAdvice, setAdvisorAdvice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      setReceiptImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessReceipt = async () => {
    if (!receiptImageBase64) {
      onShowToast('Por favor selecciona una foto de comprobante o ticket', 'error');
      return;
    }

    setLoading(true);
    setParsedResult(null);

    try {
      const response = await fetch('/api/gemini/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: receiptImageBase64,
          mimeType: 'image/jpeg',
          availableCategories: Object.keys(categoryMap),
          categoryMap,
          userNames: [profile.user1Name, profile.user2Name],
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setParsedResult(data.data);
        onShowToast('¡Comprobante interpretado con éxito!', 'success');
      } else {
        throw new Error(data.error || 'No se pudo interpretar el ticket');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Error al conectar con Gemini IA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessText = async () => {
    if (!textPrompt.trim()) {
      onShowToast('Por favor describe tu gasto en texto', 'error');
      return;
    }

    setLoading(true);
    setParsedResult(null);

    try {
      const response = await fetch('/api/gemini/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textPrompt: textPrompt.trim(),
          availableCategories: Object.keys(categoryMap),
          categoryMap,
          userNames: [profile.user1Name, profile.user2Name],
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setParsedResult(data.data);
        onShowToast('Gasto interpretado por IA', 'success');
      } else {
        throw new Error(data.error || 'No se pudo interpretar la frase');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Error al procesar con IA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdvice = async () => {
    setLoading(true);
    setAdvisorAdvice(null);

    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          budgets,
          coupleInfo: {
            user1: profile.user1Name,
            user2: profile.user2Name,
            accountCode: profile.accountCode,
          },
          currency: profile.currency || 'ARS',
        }),
      });

      const data = await response.json();
      if (data.success && data.advice) {
        setAdvisorAdvice(data.advice);
        onShowToast('Diagnóstico financiero generado', 'success');
      } else {
        throw new Error(data.error || 'No se pudo generar el análisis');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Error al generar asesoría con IA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddExpense = () => {
    if (!parsedResult) return;

    const firstCat = Object.keys(categoryMap)[0] || 'Alimentación';
    const cat = categoryMap[parsedResult.categoria] ? parsedResult.categoria : firstCat;
    const sub = categoryMap[cat]?.includes(parsedResult.subcategoria) 
      ? parsedResult.subcategoria 
      : categoryMap[cat]?.[0] || 'General';

    const isPareja = parsedResult.tipoGasto === 'pareja' || parsedResult.tipoGasto === 'compartido';

    onAddTransaction({
      concepto: parsedResult.concepto || 'Gasto Extraído',
      descripcion: parsedResult.descripcion || '',
      monto: parseFloat(parsedResult.monto) || 0,
      moneda: profile.currency || 'ARS',
      categoria: cat,
      subcategoria: sub,
      fecha: parsedResult.fecha || new Date().toISOString().split('T')[0],
      tipo: isPareja ? 'pareja' : 'individual',
      pagadoPor: profile.currentUser,
      splitType: isPareja ? '50_50' : undefined,
      metodoPago: 'Débito',
    });

    onShowToast('¡Gasto extraído agregado a tu panel!', 'success');
    setParsedResult(null);
    setReceiptImageBase64(null);
    setTextPrompt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                <span>Asistente Inteligente Gemini IA</span>
              </h3>
              <p className="text-[10px] text-indigo-200">
                Escaneo multimodal de comprobantes, dictado y diagnóstico financiero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50 shrink-0">
          <button
            onClick={() => { setActiveTab('receipt'); setParsedResult(null); }}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'receipt'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Escanear Ticket</span>
          </button>
          <button
            onClick={() => { setActiveTab('text'); setParsedResult(null); }}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'text'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Texto Libre</span>
          </button>
          <button
            onClick={() => { setActiveTab('advisor'); setParsedResult(null); }}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'advisor'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Asesor de Pareja</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* TAB 1: Receipt scanning */}
          {activeTab === 'receipt' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center transition-all cursor-pointer bg-slate-50/80 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {receiptImageBase64 ? (
                  <div className="space-y-2">
                    <img
                      src={`data:image/jpeg;base64,${receiptImageBase64}`}
                      alt="Receipt preview"
                      className="max-h-44 mx-auto rounded-xl shadow-md border border-slate-200 object-contain"
                    />
                    <p className="text-xs font-mono text-slate-600 truncate">{receiptFileName}</p>
                    <span className="text-[10px] text-indigo-600 font-semibold block">
                      Haz clic para cambiar de foto
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl shadow-xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      Sube o toma una foto del ticket o comprobante
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Formatos JPG, PNG, WEBP. La IA extraerá monto, comercio y categoría.
                    </p>
                  </div>
                )}
              </div>

              <button
                disabled={loading || !receiptImageBase64}
                onClick={handleProcessReceipt}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando comprobante con Gemini 3.7 Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Interpretar Ticket con IA</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Text prompt */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Escribe tu gasto en lenguaje natural. Ej: <em>"Ayer pagué 14500 en la carnicería el asado del domingo y lo dividimos a medias"</em> o <em>"Gasté 6200 en farmacia para mí"</em>.
              </p>

              <textarea
                rows={4}
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="Escribe aquí los detalles del gasto..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />

              <button
                disabled={loading || !textPrompt.trim()}
                onClick={handleProcessText}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Interpretando con Gemini IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Interpretar Gasto Dictado</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: Financial Advisor */}
          {activeTab === 'advisor' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Genera un diagnóstico inteligente de ahorro, hábitos de consumo y balance de finanzas en pareja basado en los gastos cargados.
              </p>

              <button
                disabled={loading}
                onClick={handleGenerateAdvice}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando diagnóstico financiero...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>Generar Diagnóstico de Pareja</span>
                  </>
                )}
              </button>

              {advisorAdvice && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Informe y Recomendaciones del Asesor:</span>
                  </div>
                  <div className="whitespace-pre-line text-slate-700 leading-relaxed font-normal">
                    {advisorAdvice}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parsed Result Display Card */}
          {parsedResult && (
            <div className="p-4 bg-indigo-50/90 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span>Datos Extraídos por la IA</span>
                </h4>
                <span className="text-[10px] font-bold bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded-full">
                  {parsedResult.tipoGasto === 'pareja' ? 'En Pareja' : 'Individual'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-indigo-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Concepto</span>
                  <strong className="text-slate-900">{parsedResult.concepto || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Monto</span>
                  <strong className="text-slate-900 text-sm">{formatCurrency(parsedResult.monto || 0, profile.currency)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Categoría</span>
                  <span className="text-slate-800 font-semibold">{parsedResult.categoria || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Subcategoría</span>
                  <span className="text-slate-800 font-semibold">{parsedResult.subcategoria || '-'}</span>
                </div>
                {parsedResult.descripcion && (
                  <div className="col-span-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Detalle</span>
                    <span className="text-slate-600">{parsedResult.descripcion}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirmAddExpense}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Confirmar y Agregar al Listado</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
