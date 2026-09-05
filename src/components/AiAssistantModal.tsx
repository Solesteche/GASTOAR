import React, { useState, useRef } from 'react';
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
  FileCheck,
  Image as ImageIcon,
  ShieldCheck,
  AlertCircle
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
  const [hasRequestedPermission, setHasRequestedPermission] = useState(true);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      setReceiptImageBase64(base64Data);
      onShowToast('Foto cargada correctamente. Lista para analizar.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleTriggerGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const handleProcessReceipt = async () => {
    if (!receiptImageBase64) {
      onShowToast('Por favor selecciona o toma una foto del ticket', 'error');
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

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(response.status === 404
          ? 'El servicio de IA requiere el servidor backend activo en Vercel.'
          : 'Respuesta inesperada del servidor al procesar el comprobante.');
      }

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

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(response.status === 404
          ? 'El servicio de IA requiere el servidor backend activo en Vercel.'
          : 'Respuesta inesperada al procesar el texto.');
      }

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

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(response.status === 404
          ? 'El servicio de IA requiere el servidor backend activo en Vercel.'
          : 'Respuesta inesperada al generar la asesoría.');
      }

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
        
        {/* Hidden File Inputs for Camera and Gallery (Req 10) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-400/20 text-purple-200 border border-purple-400/30 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                <span>Asistente Inteligente Gemini IA</span>
              </h3>
              <p className="text-[10px] text-purple-200">
                Escaneo de comprobantes por cámara/galería, dictado y diagnóstico financiero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50 shrink-0">
          <button
            onClick={() => { setActiveTab('receipt'); setParsedResult(null); }}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'receipt'
                ? 'border-purple-600 text-purple-700 bg-white font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Escanear Ticket</span>
          </button>
          <button
            onClick={() => { setActiveTab('text'); setParsedResult(null); }}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'border-purple-600 text-purple-700 bg-white font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Texto Libre</span>
          </button>
          <button
            onClick={() => { setActiveTab('advisor'); setParsedResult(null); }}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'advisor'
                ? 'border-purple-600 text-purple-700 bg-white font-bold'
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
              
              {/* Permission & Access Information Banner (Req 10) */}
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[11px] block">Acceso seguro a Cámara y Galería de Fotos</span>
                  <p className="text-[10px] text-purple-800/90 leading-tight">
                    GastoAR utiliza tu cámara para capturar fotos instantáneas de tickets y comprobantes, o tu galería para cargar imágenes ya guardadas.
                  </p>
                </div>
              </div>

              {/* Photo Options: Camera vs Gallery Buttons (Req 10) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleTriggerCamera}
                  className="p-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white flex items-center justify-center gap-2.5 font-bold text-xs shadow-md shadow-purple-900/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-amber-300" />
                  <span>Tomar Foto con Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerGallery}
                  className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-300 flex items-center justify-center gap-2.5 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <span>Elegir de Galería</span>
                </button>
              </div>

              {/* Preview Box */}
              {receiptImageBase64 && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <img
                    src={`data:image/jpeg;base64,${receiptImageBase64}`}
                    alt="Receipt preview"
                    className="max-h-44 mx-auto rounded-xl shadow-md border border-slate-200 object-contain"
                  />
                  <p className="text-xs font-mono text-slate-600 truncate">{receiptFileName}</p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReceiptImageBase64(null)}
                      className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Eliminar foto
                    </button>
                  </div>
                </div>
              )}

              <button
                disabled={loading || !receiptImageBase64}
                onClick={handleProcessReceipt}
                className="w-full py-3 px-4 bg-[#7928CA] hover:bg-[#6820B0] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando comprobante con Gemini IA...</span>
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
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
              />

              <button
                disabled={loading || !textPrompt.trim()}
                onClick={handleProcessText}
                className="w-full py-3 px-4 bg-[#7928CA] hover:bg-[#6820B0] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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

          {/* TAB 3: Financial advisor */}
          {activeTab === 'advisor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-amber-700" />
                  <span>Auditoría de Gastos de Pareja</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  Gemini analiza tus gastos reales del mes, evalúa desvíos de presupuesto y te da 3 consejos concretos de ahorro.
                </p>
              </div>

              {advisorAdvice ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {advisorAdvice}
                </div>
              ) : null}

              <button
                disabled={loading}
                onClick={handleGenerateAdvice}
                className="w-full py-3 px-4 bg-[#2E0854] hover:bg-[#1C0533] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando informe financiero con IA...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 text-amber-300" />
                    <span>Generar Diagnóstico de Pareja</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* PARSED RESULT PREVIEW & CONFIRMATION */}
          {parsedResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Datos extraídos con éxito:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Concepto:</span>
                  <span className="font-bold text-slate-800">{parsedResult.concepto || 'Compra'}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Monto:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ${Number(parsedResult.monto || 0).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Categoría Sugerida:</span>
                  <span className="font-semibold text-slate-800">{parsedResult.categoria}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Tipo:</span>
                  <span className="font-semibold text-slate-800">
                    {parsedResult.tipoGasto === 'pareja' ? 'En Pareja (50/50)' : 'Individual'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddExpense}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Guardar este Gasto en mi Panel</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
