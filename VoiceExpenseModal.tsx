import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  Volume2,
  FileAudio,
  ShoppingBag,
  Info,
  Calendar,
  CreditCard,
  Users,
  RotateCcw
} from 'lucide-react';
import { Budgets, CategoryMap, CoupleProfile, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { parseVoiceExpenseLocally, ParsedVoiceExpense } from '../utils/voiceExpenseParser';

interface VoiceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Partial<Transaction>) => void;
  categoryMap: CategoryMap;
  profile: CoupleProfile;
  transactions: Transaction[];
  budgets: Budgets;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const VoiceExpenseModal: React.FC<VoiceExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  categoryMap,
  profile,
  onShowToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [parsedExpense, setParsedExpense] = useState<ParsedVoiceExpense | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Editable fields for parsed result
  const [editConcepto, setEditConcepto] = useState('');
  const [editMonto, setEditMonto] = useState<number>(0);
  const [editCategoria, setEditCategoria] = useState('');
  const [editSubcategoria, setEditSubcategoria] = useState('');
  const [editTipoGasto, setEditTipoGasto] = useState<'individual' | 'pareja'>('individual');
  const [editMetodoPago, setEditMetodoPago] = useState('Débito');

  const recognitionRef = useRef<any>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Sync state when parsedExpense changes
  useEffect(() => {
    if (parsedExpense) {
      setEditConcepto(parsedExpense.concepto);
      setEditMonto(parsedExpense.monto);
      setEditCategoria(parsedExpense.categoria);
      setEditSubcategoria(parsedExpense.subcategoria);
      setEditTipoGasto(parsedExpense.tipoGasto);
      setEditMetodoPago(parsedExpense.metodoPago || 'Débito');
    }
  }, [parsedExpense]);

  if (!isOpen) return null;

  // Process text using local parser with fallback/enhancement from server Gemini
  const processSpokenExpense = async (text: string, audioBase64?: string, mimeType?: string) => {
    if (!text.trim() && !audioBase64) {
      onShowToast('No se detectó voz o audio para procesar.', 'error');
      return;
    }

    setIsProcessing(true);
    setTranscript(text);

    // 1. Instant local parser (guarantees immediate answer for e.g. "gaste 50000 en coto")
    const localResult = parseVoiceExpenseLocally(text, categoryMap, profile.currentUser);
    setParsedExpense(localResult);

    // 2. Query server-side Gemini API for deep semantic recognition or audio processing
    try {
      const payload: any = {
        textPrompt: text.trim() || undefined,
        audioBase64,
        mimeType: mimeType || 'audio/webm',
        availableCategories: Object.keys(categoryMap),
        categoryMap,
        userNames: [profile.user1Name, profile.user2Name],
      };

      const response = await fetch('/api/gemini/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const geminiData = data.data;
          
          // Verify valid category
          const cat = categoryMap[geminiData.categoria] ? geminiData.categoria : localResult.categoria;
          const sub = categoryMap[cat]?.includes(geminiData.subcategoria) 
            ? geminiData.subcategoria 
            : (categoryMap[cat]?.[0] || 'General');

          setParsedExpense({
            transcripcion: geminiData.transcripcion || text,
            concepto: geminiData.concepto || localResult.concepto,
            descripcion: geminiData.descripcion || localResult.descripcion,
            monto: typeof geminiData.monto === 'number' && geminiData.monto > 0 ? geminiData.monto : localResult.monto,
            categoria: cat,
            subcategoria: sub,
            tipoGasto: geminiData.tipoGasto === 'pareja' ? 'pareja' : 'individual',
            division: geminiData.tipoGasto === 'pareja' ? '50_50' : undefined,
            metodoPago: geminiData.metodoPago || 'Débito',
            fecha: new Date().toISOString().split('T')[0]
          });
          onShowToast('¡Gasto interpretado con éxito por voz!', 'success');
        }
      } else {
        // Local parser was already set, notify friendly
        onShowToast('Gasto interpretado por reconocimiento de voz.', 'success');
      }
    } catch {
      // Local parser result is already applied
      onShowToast('Gasto interpretado por reconocimiento de voz.', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  // Start / Stop Microphone Listening
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('Tu navegador no soporta dictado directo. Podés subir una nota de audio o probar los ejemplos.', 'info');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setAudioFileName(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultText = event.results[current][0].transcript;
        setTranscript(resultText);

        if (event.results[current].isFinal) {
          processSpokenExpense(resultText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          onShowToast('Permiso de micrófono denegado. Habilitalo en tu navegador.', 'error');
        } else if (event.error !== 'no-speech') {
          onShowToast(`Error de audio: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      onShowToast('No se pudo iniciar el micrófono.', 'error');
    }
  };

  // Handle uploaded audio file (WhatsApp audio, voice note, etc.)
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const mimeType = file.type || 'audio/mp3';

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      processSpokenExpense(`Audio: ${file.name}`, base64Data, mimeType);
    };
    reader.readAsDataURL(file);
  };

  // Preset example click
  const handleSelectExample = (examplePhrase: string) => {
    setTranscript(examplePhrase);
    setAudioFileName(null);
    processSpokenExpense(examplePhrase);
  };

  // Confirm and Save Expense to App State
  const handleSaveExpense = () => {
    if (!editMonto || editMonto <= 0) {
      onShowToast('Por favor ingresá o confirmá un monto válido.', 'error');
      return;
    }

    const isPareja = editTipoGasto === 'pareja';

    onAddTransaction({
      concepto: editConcepto.trim() || 'Gasto por Voz',
      descripcion: transcript ? `Dictado por voz: "${transcript}"` : 'Registro rápido por voz',
      monto: editMonto,
      moneda: profile.currency || 'ARS',
      categoria: editCategoria,
      subcategoria: editSubcategoria,
      fecha: new Date().toISOString().split('T')[0],
      tipo: isPareja ? 'pareja' : 'individual',
      pagadoPor: profile.currentUser,
      splitType: isPareja ? '50_50' : undefined,
      metodoPago: editMetodoPago,
    });

    onShowToast(`¡Gasto de $${editMonto.toLocaleString('es-AR')} guardado en ${editCategoria}!`, 'success');
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParsedExpense(null);
    setTranscript('');
    setAudioFileName(null);
    setIsListening(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border border-purple-100">
        
        {/* Hidden Audio File Input for WhatsApp / Audio Notes */}
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*,.mp3,.ogg,.opus,.m4a,.wav,.webm"
          onChange={handleAudioUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 text-purple-200 border border-white/20 flex items-center justify-center font-bold shadow-xs">
              <Mic className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight flex items-center gap-1.5 text-white">
                <span>Registro de Gasto por Voz</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-400/30 text-purple-100 rounded-full border border-purple-300/30">
                  IA Automática
                </span>
              </h3>
              <p className="text-[11px] text-purple-200">
                Dictá o enviá un audio y la IA asignará el comercio, monto y categoría
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Main Voice Interactive Area */}
          <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center">
            
            {/* Big Pulsing Mic Button */}
            <div className="relative mb-3">
              {isListening && (
                <>
                  <div className="absolute -inset-3 rounded-full bg-purple-500/30 animate-ping opacity-75" />
                  <div className="absolute -inset-6 rounded-full bg-purple-400/20 animate-pulse" />
                </>
              )}

              <button
                type="button"
                onClick={toggleListening}
                disabled={isProcessing}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/50 scale-105 ring-4 ring-rose-300'
                    : isProcessing
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gradient-to-tr from-[#2E0854] via-[#5B21B6] to-[#7928CA] text-white shadow-purple-900/30 hover:scale-105 hover:shadow-purple-700/40'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-9 h-9 animate-spin text-purple-700" />
                ) : isListening ? (
                  <MicOff className="w-9 h-9 sm:w-10 sm:h-10 text-white animate-pulse" />
                ) : (
                  <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
                )}
              </button>
            </div>

            {/* Instruction / State Indicator */}
            <div className="space-y-1">
              <p className="font-extrabold text-sm sm:text-base text-slate-800">
                {isListening
                  ? 'Te estoy escuchando... ¡hablá ahora!'
                  : isProcessing
                  ? 'Analizando gasto con inteligencia artificial...'
                  : 'Tocá el micrófono para dictar tu gasto'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {isListening
                  ? 'Ejemplo: "Gasté 50000 en Coto"'
                  : 'Reconoce montos, comercios y categorías automáticamente'}
              </p>
            </div>

            {/* Live Audio / Transcript Preview */}
            {(transcript || audioFileName) && (
              <div className="mt-3.5 w-full p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center gap-2.5 text-left">
                <Volume2 className="w-4 h-4 text-purple-700 shrink-0" />
                <div className="text-xs text-purple-900 font-medium truncate flex-1">
                  <span className="font-bold text-purple-950">Audio detectado: </span>
                  <span className="italic">"{transcript || audioFileName}"</span>
                </div>
                {parsedExpense && (
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reiniciar dictado"
                    className="text-purple-600 hover:text-purple-900 p-1 rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PARSED EXPENSE CARD (Highlighted Result) */}
          {parsedExpense ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-white border-2 border-purple-300 shadow-md space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-purple-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-extrabold text-xs text-purple-950 uppercase tracking-wide">
                    Gasto Interpretado
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Categorizado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Monto */}
                <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Monto Total
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-extrabold text-slate-400">$</span>
                    <input
                      type="number"
                      value={editMonto || ''}
                      onChange={(e) => setEditMonto(parseFloat(e.target.value) || 0)}
                      className="w-full text-base sm:text-lg font-black text-slate-900 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Comercio / Concepto */}
                <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Comercio / Concepto
                  </label>
                  <input
                    type="text"
                    value={editConcepto}
                    onChange={(e) => setEditConcepto(e.target.value)}
                    className="w-full text-sm font-bold text-slate-900 focus:outline-none"
                    placeholder="Ej: Coto"
                  />
                </div>

                {/* Categoría Asignada */}
                <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Categoría (Auto)
                  </label>
                  <select
                    value={editCategoria}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setEditCategoria(newCat);
                      setEditSubcategoria(categoryMap[newCat]?.[0] || 'General');
                    }}
                    className="w-full text-xs font-bold text-purple-900 bg-transparent focus:outline-none"
                  >
                    {Object.keys(categoryMap).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategoría */}
                <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Subcategoría
                  </label>
                  <select
                    value={editSubcategoria}
                    onChange={(e) => setEditSubcategoria(e.target.value)}
                    className="w-full text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
                  >
                    {(categoryMap[editCategoria] || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo de Gasto & Método de Pago */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-purple-200/60 text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-bold text-slate-700">Tipo:</span>
                  <button
                    type="button"
                    onClick={() => setEditTipoGasto('individual')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editTipoGasto === 'individual'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTipoGasto('pareja')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editTipoGasto === 'pareja'
                        ? 'bg-[#F95420] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Pareja (50/50)
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Método:</span>
                  <select
                    value={editMetodoPago}
                    onChange={(e) => setEditMetodoPago(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
                  >
                    <option value="Débito">Débito</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Crédito">Crédito</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveExpense}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Gasto (${editMonto.toLocaleString('es-AR')})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Quick Clickable Examples if nothing recorded yet */
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Ejemplos rápidos para probar
                </span>
                <span className="text-[10px] text-purple-600 font-bold">Tocá uno para probar</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectExample('Gasté 50000 en Coto')}
                  className="p-2.5 rounded-xl border border-purple-200/80 bg-purple-50/50 hover:bg-purple-100/70 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛒</span>
                    <div>
                      <div className="text-xs font-bold text-purple-950 group-hover:text-purple-700">
                        "Gasté 50000 en Coto"
                      </div>
                      <div className="text-[10px] text-purple-700">
                        → Alimentación / Supermercado
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectExample('Pagué 18000 de nafta en YPF')}
                  className="p-2.5 rounded-xl border border-blue-200/80 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">⛽</span>
                    <div>
                      <div className="text-xs font-bold text-blue-950 group-hover:text-blue-700">
                        "Pagué 18000 de nafta en YPF"
                      </div>
                      <div className="text-[10px] text-blue-700">
                        → Transporte / Combustible
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectExample('Compré remedios en Farmacity por 8400')}
                  className="p-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">💊</span>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-700">
                        "Compré en Farmacity por 8400"
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        → Salud / Farmacia
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectExample('Gastamos 24000 en PedidosYa a medias')}
                  className="p-2.5 rounded-xl border border-orange-200/80 bg-orange-50/50 hover:bg-orange-100/70 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍕</span>
                    <div>
                      <div className="text-xs font-bold text-orange-950 group-hover:text-orange-700">
                        "Gastamos 24000 en PedidosYa a medias"
                      </div>
                      <div className="text-[10px] text-orange-700">
                        → Pareja / Delivery 50/50
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Option: Upload audio note from WhatsApp or files */}
          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
            >
              <FileAudio className="w-4 h-4 text-purple-600" />
              <span>Subir nota de audio o archivo de WhatsApp (.mp3, .ogg, .m4a)</span>
            </button>
          </div>

        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 shrink-0">
          Dictá libremente tus compras diarias y GastoAR las sumará al balance del mes de inmediato.
        </div>

      </div>
    </div>
  );
};
